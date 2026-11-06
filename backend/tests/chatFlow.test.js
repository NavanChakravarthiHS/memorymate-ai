import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import { chat } from "../controllers/chatController.js";
import { requireTextField } from "../middleware/validate.js";

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function mockReq(message, history = []) {
  return {
    body: { message, history },
    user: { id: "demo-user", bankId: "memorymate-demo-user" },
  };
}

describe("request validation", () => {
  it("rejects empty chat messages", () => {
    const middleware = requireTextField("message");
    const res = mockRes();
    let nextCalled = false;
    middleware({ body: { message: "   " } }, res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.error, /cannot be empty/i);
  });

  it("accepts a non-empty message", () => {
    const middleware = requireTextField("message");
    const req = { body: { message: "  Hello there  " } };
    const res = mockRes();
    let nextCalled = false;
    middleware(req, res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
    assert.equal(req.body.message, "Hello there");
  });
});

describe("chat Retain / Recall / Reflect-adjacent flow", () => {
  it("recalls memories, generates a Groq reply, retains facts, and reports toolCallCount", async () => {
    const recalled = [{ text: "Rahul is learning Java and React.", type: "world" }];
    const recallMemories = mock.fn(async () => ({ results: recalled }));
    const retainMemory = mock.fn(async () => ({ ok: true }));
    const listStoredMemories = mock.fn(async () => ({ total: 4, items: recalled }));
    const generateAssistantReply = mock.fn(async () => ({
      reply: "You are learning Java and React.",
      toolCallCount: 2,
    }));

    const res = mockRes();
    await chat(
      mockReq("My name is Rahul. I am a computer science student. I am learning Java and React."),
      res,
      (err) => {
        throw err;
      },
      { generateAssistantReply, recallMemories, retainMemory, listStoredMemories }
    );

    assert.equal(res.body.reply, "You are learning Java and React.");
    assert.equal(res.body.toolCallCount, 2);
    assert.equal(res.body.memoryStatus.recalled, true);
    assert.equal(res.body.memoryStatus.retained, true);
    assert.equal(res.body.memoryStatus.toolCallCount, 2);
    assert.equal(res.body.memories[0].text, "Rahul is learning Java and React.");
    assert.equal(recallMemories.mock.callCount(), 1);
    assert.equal(retainMemory.mock.callCount(), 1);
    assert.equal(generateAssistantReply.mock.calls[0].arguments[0].memories[0].text, recalled[0].text);
  });

  it("persists memory across a new chat by recalling Hindsight, not request history", async () => {
    const recallMemories = mock.fn(async (_bank, query) => {
      if (/technologies/i.test(query)) {
        return { results: [{ text: "Rahul is learning Java and React.", type: "world" }] };
      }
      return { results: [] };
    });
    const retainMemory = mock.fn(async () => ({ ok: true }));
    const listStoredMemories = mock.fn(async () => ({ total: 4, items: [] }));
    const generateAssistantReply = mock.fn(async ({ memories }) => ({
      reply: memories[0]?.text?.includes("Java")
        ? "You are learning Java and React."
        : "I do not have that stored yet.",
      toolCallCount: 0,
    }));

    const first = mockRes();
    await chat(
      mockReq("My name is Rahul. I am a computer science student. I am learning Java and React."),
      first,
      (err) => {
        throw err;
      },
      { generateAssistantReply, recallMemories, retainMemory, listStoredMemories }
    );
    assert.equal(first.body.memoryStatus.retained, true);

    const second = mockRes();
    await chat(
      mockReq("What technologies am I learning?", []),
      second,
      (err) => {
        throw err;
      },
      { generateAssistantReply, recallMemories, retainMemory, listStoredMemories }
    );

    assert.equal(second.body.reply, "You are learning Java and React.");
    assert.equal(generateAssistantReply.mock.calls[1].arguments[0].history.length, 0);
    assert.match(generateAssistantReply.mock.calls[1].arguments[0].memories[0].text, /Java and React/);
  });

  it("does not retain credential-like messages", async () => {
    const retainMemory = mock.fn(async () => ({ ok: true }));
    const res = mockRes();
    await chat(
      mockReq("my password is hunter2-audit"),
      res,
      (err) => {
        throw err;
      },
      {
        generateAssistantReply: async () => ({ reply: "I will not store that.", toolCallCount: 0 }),
        recallMemories: async () => ({ results: [] }),
        retainMemory,
        listStoredMemories: async () => ({ total: 0, items: [] }),
      }
    );

    assert.equal(res.body.memoryStatus.retained, false);
    assert.ok(res.body.memoryStatus.skipReason);
    assert.equal(retainMemory.mock.callCount(), 0);
  });

  it("retains ordinary secret-hobby phrasing", async () => {
    const retainMemory = mock.fn(async () => ({ ok: true }));
    const res = mockRes();
    await chat(
      mockReq("My secret hobby is origami"),
      res,
      (err) => {
        throw err;
      },
      {
        generateAssistantReply: async () => ({ reply: "I will remember origami.", toolCallCount: 0 }),
        recallMemories: async () => ({ results: [] }),
        retainMemory,
        listStoredMemories: async () => ({ total: 1, items: [] }),
      }
    );

    assert.equal(res.body.memoryStatus.retained, true);
    assert.equal(retainMemory.mock.callCount(), 1);
  });
});
