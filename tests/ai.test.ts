import { test } from "node:test";
import assert from "node:assert/strict";
import { cosineSimilarity, splitIntoChunks } from "../src/lib/ai/gemini";

test("knowledge text is split into bounded chunks without losing content", () => {
  const source = `${"alpha ".repeat(250)}\n\n${"beta ".repeat(250)}`;
  const chunks = splitIntoChunks(source, 300);
  assert.ok(chunks.length > 2);
  assert.ok(chunks.every((chunk) => chunk.length <= 300));
  assert.match(chunks.join(" "), /alpha/);
  assert.match(chunks.join(" "), /beta/);
});

test("cosine similarity ranks aligned vectors and handles invalid dimensions", () => {
  assert.equal(cosineSimilarity([1, 0], [1, 0]), 1);
  assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
  assert.equal(cosineSimilarity([1], [1, 0]), 0);
  assert.equal(cosineSimilarity([0, 0], [0, 0]), 0);
});
