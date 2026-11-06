import {
  listStoredMemories,
  recallMemories,
  retainMemory,
} from "./hindsightService.js";
import { shouldRetain } from "./memorySanitize.js";

export const MAX_TOOL_ITERATIONS = 4;

export const groqToolSchemas = [
  {
    type: "function",
    function: {
      name: "search_memories",
      description:
        "Search the user's Hindsight long-term memory for facts relevant to a query. Use when recalled context is missing or the user asks what you remember.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Natural-language search query",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_memory",
      description:
        "Store a durable personal fact in Hindsight, such as a name, skill, preference, or goal. Do not store secrets or passwords.",
      parameters: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "The fact to retain",
          },
        },
        required: ["content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_recent_memories",
      description: "List recently stored Hindsight memories for this user.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            description: "Number of memories to return, 1 to 20",
          },
        },
      },
    },
  },
];

function asText(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

async function searchMemories(args, context) {
  const query = asText(args.query);
  if (!query) {
    return { ok: false, error: "query is required." };
  }
  const result = await recallMemories(context.bankId, query);
  return {
    ok: true,
    memories: result.results.slice(0, 8).map((item) => ({
      text: item.text,
      type: item.type,
    })),
  };
}

async function saveMemory(args, context) {
  const content = asText(args.content);
  if (!content) {
    return { ok: false, error: "content is required." };
  }
  if (!shouldRetain(content)) {
    return { ok: false, error: "That content was not stored because it looked empty, trivial, or sensitive." };
  }
  await retainMemory(context.bankId, content, {
    context: "Saved by MemoryMate Groq tool",
    metadata: { source: "tool", userId: String(context.userId || "") },
    tags: ["tool", "user"],
  });
  return { ok: true, stored: true };
}

async function listRecentMemories(args, context) {
  const limit = Math.min(Math.max(Number(args.limit) || 8, 1), 20);
  const result = await listStoredMemories(context.bankId, { limit });
  return {
    ok: true,
    total: result.total,
    items: result.items.slice(0, limit).map((item) => ({
      text: item.text,
      type: item.type,
    })),
  };
}

const registry = {
  search_memories: searchMemories,
  save_memory: saveMemory,
  list_recent_memories: listRecentMemories,
};

export function parseToolArguments(raw) {
  if (raw == null || raw === "") {
    return { ok: true, value: {} };
  }
  if (typeof raw !== "string") {
    return { ok: false, error: "Tool arguments must be a JSON string." };
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, error: "Tool arguments must be a JSON object." };
    }
    return { ok: true, value: parsed };
  } catch {
    return { ok: false, error: "Tool arguments were not valid JSON." };
  }
}

export async function executeRegisteredTool(toolCall, context) {
  const name = toolCall?.function?.name;
  const toolCallId = toolCall?.id;

  if (!toolCallId || typeof toolCallId !== "string") {
    return {
      role: "tool",
      tool_call_id: "missing_tool_call_id",
      content: JSON.stringify({ ok: false, error: "Tool call was missing an id." }),
    };
  }

  if (!name || typeof name !== "string" || !registry[name]) {
    return {
      role: "tool",
      tool_call_id: toolCallId,
      content: JSON.stringify({ ok: false, error: "Unsupported or missing tool name." }),
    };
  }

  const parsed = parseToolArguments(toolCall.function?.arguments);
  if (!parsed.ok) {
    return {
      role: "tool",
      tool_call_id: toolCallId,
      content: JSON.stringify({ ok: false, error: parsed.error }),
    };
  }

  try {
    const result = await registry[name](parsed.value, context);
    return {
      role: "tool",
      tool_call_id: toolCallId,
      content: JSON.stringify(result),
    };
  } catch (err) {
    return {
      role: "tool",
      tool_call_id: toolCallId,
      content: JSON.stringify({
        ok: false,
        error: err.publicMessage || "The memory tool could not complete.",
      }),
    };
  }
}
