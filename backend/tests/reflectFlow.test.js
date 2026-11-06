import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import { reflectMemories, searchMemories } from "../controllers/memoryController.js";

function mockRes() {
  return {
    body: null,
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe("Hindsight Recall and Reflect", () => {
  it("searchMemories returns mocked Hindsight recall results", async () => {
    const recallMemories = mock.fn(async () => ({
      results: [{ text: "Rahul is learning Java.", type: "observation" }],
    }));
    const res = mockRes();

    await searchMemories(
      { body: { query: "Java" }, user: { bankId: "memorymate-demo-user" } },
      res,
      (err) => {
        throw err;
      },
      { recallMemories }
    );

    assert.equal(res.body.query, "Java");
    assert.equal(res.body.memories[0].text, "Rahul is learning Java.");
    assert.equal(recallMemories.mock.callCount(), 1);
  });

  it("reflectMemories returns a mocked Hindsight profile summary", async () => {
    const reflectOnMemories = mock.fn(async () => ({
      text: "Rahul is a computer science student learning Java and React.",
      basedOn: [{ text: "Rahul is learning Java." }],
      usage: null,
    }));
    const res = mockRes();

    await reflectMemories(
      { body: {}, user: { bankId: "memorymate-demo-user" } },
      res,
      (err) => {
        throw err;
      },
      { reflectOnMemories }
    );

    assert.match(res.body.summary, /Java and React/);
    assert.equal(reflectOnMemories.mock.callCount(), 1);
    assert.match(reflectOnMemories.mock.calls[0].arguments[1], /profile summary/i);
  });
});
