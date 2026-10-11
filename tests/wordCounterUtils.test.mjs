import test from "node:test";
import assert from "node:assert/strict";
import { analyzeText } from "../src/tools/writing/word-counter/wordCounterUtils.js";

test("counts English words, characters, lines, paragraphs, and sentences", () => {
  const result = analyzeText("The quick fox.\n\nThe fox jumps!");
  assert.equal(result.words, 6);
  assert.equal(result.characters, 30);
  assert.equal(result.charactersNoSpaces, 24);
  assert.equal(result.sentences, 2);
  assert.equal(result.paragraphs, 2);
  assert.equal(result.lines, 3);
  assert.deepEqual(result.keywords, [
    { word: "fox", count: 2 },
    { word: "jumps", count: 1 },
    { word: "quick", count: 1 },
  ]);
});

test("supports Urdu/Arabic and CJK word segmentation", () => {
  const urdu = analyzeText("یہ ایک اردو متن ہے۔");
  assert.equal(urdu.words, 5);
  assert.ok(urdu.characters > 0);
  assert.ok(urdu.keywords.some(({ word }) => word === "اردو"));
  const cjk = analyzeText("今日は世界です。");
  assert.equal(cjk.words, 4);
  assert.ok(cjk.characters > 0);
});

test("empty text has zeroed statistics", () => {
  const result = analyzeText("");
  assert.equal(result.words, 0);
  assert.equal(result.characters, 0);
  assert.equal(result.sentences, 0);
  assert.equal(result.paragraphs, 0);
  assert.equal(result.lines, 0);
  assert.deepEqual(result.keywords, []);
});

test("reading and speaking time use their specified words-per-minute rates", () => {
  assert.equal(analyzeText("word ".repeat(130)).readingMinutes, 1);
  assert.equal(analyzeText("word ".repeat(130)).speakingMinutes, 1);
  assert.equal(analyzeText("word ".repeat(201)).readingMinutes, 2);
  assert.equal(analyzeText("word ".repeat(131)).speakingMinutes, 2);
});

test("one-million-character analysis completes within a practical bound", () => {
  const text = "word ".repeat(200000);
  const start = performance.now();
  const result = analyzeText(text);
  const elapsedMs = performance.now() - start;
  assert.equal(text.length, 1000000);
  assert.equal(result.words, 200000);
  assert.ok(elapsedMs < 10000, `Analysis took ${elapsedMs.toFixed(0)} ms`);
});
