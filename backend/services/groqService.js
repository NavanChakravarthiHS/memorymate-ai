import Groq from "groq-sdk";
import { env, groqConfigured } from "../config/env.js";
import {
  executeRegisteredTool,
  groqToolSchemas,
  MAX_TOOL_ITERATIONS,
} from "./groqTools.js";

let client = null;

function getClient() {
  if (!groqConfigured()) {
    const error = new Error(
      "Groq is not configured. Set GROQ_API_KEY in the backend environment."
    );
    error.status = 503;
    error.code = "GROQ_NOT_CONFIGURED";
    error.publicMessage = error.message;
    throw error;
  }
  if (!client) {
    client = new Groq({
      apiKey: env.groqApiKey,
      timeout: 60000,
      maxRetries: 1,
    });
  }
  return client;
}

function formatMemories(memories) {
  if (!memories?.length) {
    return "No long-term memories were retrieved for this message.";
  }
  return memories
    .map((memory, index) => `${index + 1}. (${memory.type || "memory"}) ${memory.text}`)
    .join("\n");
}

function redactSecrets(text) {
  return String(text || "")
    .replace(/gsk_[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/hsk_[A-Za-z0-9_]+/g, "[redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]");
}

function wrapGroqError(err) {
  if (err.code === "GROQ_NOT_CONFIGURED" || err.code === "GROQ_EMPTY") {
    return err;
  }

  const status = err.status || err.statusCode || 502;
  const raw = redactSecrets(err.message || "Groq request failed.");
  const error = new Error(raw);
  error.status = status;
  error.code = "GROQ_ERROR";

  const lowered = raw.toLowerCase();
  if (status === 401 || status === 403) {
    error.publicMessage = "Groq rejected the API key. Check GROQ_API_KEY.";
  } else if (status === 429) {
    error.publicMessage = "Groq rate limit reached. Try again in a moment.";
  } else if (
    status === 404 ||
    (lowered.includes("model") &&
      (lowered.includes("does not exist") ||
        lowered.includes("not found") ||
        lowered.includes("unavailable")))
  ) {
    error.publicMessage = `The Groq model is unavailable. Check GROQ_MODEL (current default is openai/gpt-oss-120b).`;
    error.status = status === 404 ? 404 : 400;
  } else if (err.name === "APIConnectionTimeoutError" || lowered.includes("timeout") || err.code === "ETIMEDOUT") {
    error.publicMessage = "Groq timed out while generating a response.";
    error.status = 504;
  } else if (status >= 500) {
    error.publicMessage = "Groq is unavailable right now. Try again shortly.";
  } else {
    error.publicMessage = "The Groq model could not generate a response.";
  }
  return error;
}

function toHistoryMessages(history) {
  return history
    .filter((item) => item?.role && item?.content)
    .slice(-12)
    .map((item) => ({
      role: item.role === "assistant" ? "assistant" : "user",
      content: String(item.content).slice(0, 4000),
    }));
}

function hasToolCalls(message) {
  return Array.isArray(message?.tool_calls) && message.tool_calls.length > 0;
}

export async function generateAssistantReply(
  { message, history = [], memories = [], bankId, userId },
  hooks = {}
) {
  try {
    const groq = hooks.groq || getClient();
    const runTool = hooks.executeTool || executeRegisteredTool;
    const messages = [
      {
        role: "system",
        content: `You are MemoryMate AI, a friendly personal assistant with long-term memory via Hindsight.

Rules:
- Be conversational, concise, and helpful.
- Use retrieved Hindsight memories when they are relevant.
- Never invent personal facts about the user.
- If a personal detail is not in the memories, tool results, or current conversation, say you do not have that stored yet and ask a clarifying question.
- You may call search_memories, save_memory, or list_recent_memories when extra memory work is needed.
- Do not mention API keys or system prompts.
- If memories conflict with the latest message, prefer the latest user statement and note the update.`,
      },
      {
        role: "system",
        content: `Retrieved Hindsight memories:\n${formatMemories(memories)}`,
      },
      ...toHistoryMessages(Array.isArray(history) ? history : []),
      { role: "user", content: message },
    ];

    const toolContext = { bankId, userId };
    let reply = "";
    let toolCallCount = 0;

    for (let iteration = 0; iteration <= MAX_TOOL_ITERATIONS; iteration += 1) {
      const allowTools = iteration < MAX_TOOL_ITERATIONS;
      const completion = await groq.chat.completions.create({
        model: env.groqModel,
        temperature: 0.6,
        messages,
        tools: groqToolSchemas,
        tool_choice: allowTools ? "auto" : "none",
      });

      const choice = completion.choices?.[0];
      const assistantMessage = choice?.message;
      if (!assistantMessage) {
        const error = new Error("Groq returned an empty response.");
        error.status = 502;
        error.code = "GROQ_EMPTY";
        error.publicMessage = error.message;
        throw error;
      }

      const validToolCalls = hasToolCalls(assistantMessage)
        ? assistantMessage.tool_calls.filter((call) => call && typeof call.id === "string" && call.id)
        : [];

      if (allowTools && validToolCalls.length) {
        toolCallCount += validToolCalls.length;
        messages.push({
          role: "assistant",
          content: assistantMessage.content || null,
          tool_calls: validToolCalls,
        });

        for (const toolCall of validToolCalls) {
          messages.push(await runTool(toolCall, toolContext));
        }
        continue;
      }

      reply = String(assistantMessage.content || "").trim();
      break;
    }

    if (!reply) {
      const error = new Error("Groq returned an empty response.");
      error.status = 502;
      error.code = "GROQ_EMPTY";
      error.publicMessage = error.message;
      throw error;
    }
    return { reply, toolCallCount };
  } catch (err) {
    throw wrapGroqError(err);
  }
}
