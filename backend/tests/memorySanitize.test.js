import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { looksSensitive, retainSkipReason, shouldRetain } from "../services/memorySanitize.js";

describe("memorySanitize", () => {
  it("allows ordinary phrases that include the word secret", () => {
    const message = "My secret hobby is origami";
    assert.equal(looksSensitive(message), false);
    assert.equal(shouldRetain(message), true);
    assert.equal(retainSkipReason(message), null);
  });

  it("retains useful personal facts", () => {
    assert.equal(
      shouldRetain("My name is Rahul. I am a computer science student. I am learning Java and React."),
      true
    );
  });

  it("blocks password and API key assignments", () => {
    assert.equal(looksSensitive("my password is hunter2-audit"), true);
    assert.equal(looksSensitive("api_key=sk-abcdefghijklmnopqrstuvwxyz"), true);
    assert.equal(looksSensitive("secret: super-secret-value"), true);
    assert.equal(shouldRetain("my password is hunter2-audit"), false);
  });

  it("blocks token-shaped credentials", () => {
    assert.equal(looksSensitive("here is gsk_abcdefghij1234567890"), true);
    assert.equal(looksSensitive("Authorization Bearer abcdefghijklmnop"), true);
  });

  it("skips short greetings", () => {
    assert.equal(shouldRetain("hi"), false);
    assert.equal(shouldRetain("thanks"), false);
  });
});
