import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { executeRegisteredTool, parseToolArguments } from "../services/groqTools.js";

describe("Groq local tools", () => {
  it("parses object arguments", () => {
    assert.deepEqual(parseToolArguments("{\"query\":\"Java\"}"), {
      ok: true,
      value: { query: "Java" },
    });
  });

  it("rejects malformed or non-object arguments", () => {
    assert.equal(parseToolArguments("{not-json").ok, false);
    assert.equal(parseToolArguments("[1,2]").ok, false);
  });

  it("rejects unsupported tool names without executing them", async () => {
    const result = await executeRegisteredTool(
      { id: "call_1", function: { name: "drop_database", arguments: "{}" } },
      { bankId: "memorymate-test", userId: "test" }
    );
    assert.equal(result.role, "tool");
    assert.equal(result.tool_call_id, "call_1");
    assert.equal(JSON.parse(result.content).ok, false);
  });

  it("rejects malformed tool arguments", async () => {
    const result = await executeRegisteredTool(
      { id: "call_2", function: { name: "search_memories", arguments: "{bad" } },
      { bankId: "memorymate-test", userId: "test" }
    );
    assert.match(JSON.parse(result.content).error, /valid JSON/i);
  });
});
