import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import { generateAssistantReply } from "../services/groqService.js";

function fakeGroq(handler) {
  return {
    chat: {
      completions: {
        create: mock.fn(handler),
      },
    },
  };
}

describe("Groq chat generation", () => {
  it("returns a Groq reply and zero tool calls when the model answers directly", async () => {
    const groq = fakeGroq(async () => ({
      choices: [{ message: { content: "You are learning **Java** and **React**." } }],
    }));

    const result = await generateAssistantReply(
      {
        message: "What technologies am I learning?",
        memories: [{ text: "Rahul is learning Java and React.", type: "world" }],
        bankId: "memorymate-demo-user",
        userId: "demo-user",
      },
      { groq, executeTool: async () => {
        throw new Error("tool should not run");
      } }
    );

    assert.equal(result.reply, "You are learning **Java** and **React**.");
    assert.equal(result.toolCallCount, 0);
    assert.equal(groq.chat.completions.create.mock.callCount(), 1);
  });

  it("executes registered tools and reports toolCallCount", async () => {
    let round = 0;
    const groq = fakeGroq(async () => {
      round += 1;
      if (round === 1) {
        return {
          choices: [{
            message: {
              content: null,
              tool_calls: [{
                id: "call_search",
                type: "function",
                function: { name: "search_memories", arguments: "{\"query\":\"Java\"}" },
              }],
            },
          }],
        };
      }
      return {
        choices: [{ message: { content: "Stored memories mention Java." } }],
      };
    });

    const executeTool = mock.fn(async (toolCall) => ({
      role: "tool",
      tool_call_id: toolCall.id,
      content: JSON.stringify({ ok: true, memories: [{ text: "Rahul is learning Java." }] }),
    }));

    const result = await generateAssistantReply(
      { message: "Search memory for Java", bankId: "memorymate-demo-user", userId: "demo-user" },
      { groq, executeTool }
    );

    assert.equal(result.reply, "Stored memories mention Java.");
    assert.equal(result.toolCallCount, 1);
    assert.equal(executeTool.mock.callCount(), 1);
    assert.equal(groq.chat.completions.create.mock.callCount(), 2);
  });
});
