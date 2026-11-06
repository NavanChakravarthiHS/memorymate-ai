import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseMarkdown } from "./renderMarkdown.js";

describe("chat markdown parser", () => {
  it("parses bold text", () => {
    const blocks = parseMarkdown("You are learning **Java** and **React**.");
    const children = blocks[0].children;
    assert.equal(children.some((node) => node.type === "strong" && node.value === "Java"), true);
    assert.equal(children.some((node) => node.type === "strong" && node.value === "React"), true);
  });

  it("parses unordered lists", () => {
    const blocks = parseMarkdown("- Java\n- React");
    assert.equal(blocks[0].type, "ul");
    assert.equal(blocks[0].items.length, 2);
    assert.equal(blocks[0].items[0].children[0].value, "Java");
  });

  it("parses numbered lists", () => {
    const blocks = parseMarkdown("1. Retain\n2. Recall\n3. Reflect");
    assert.equal(blocks[0].type, "ol");
    assert.equal(blocks[0].items.length, 3);
  });
});
