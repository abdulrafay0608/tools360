import test from "node:test";
import assert from "node:assert/strict";
import { calculatePercentage, formatRoundedNumber } from "../src/tools/finance/percentage-calculator/percentageCalculatorUtils.js";

test("percentage modes return the expected values and formula explanations", () => {
  const cases = [
    ["percent-of", { first: "20", second: "150" }, 30],
    ["percent-of", { first: "0", second: "150" }, 0],
    ["is-what-percent", { first: "30", second: "150" }, 20],
    ["change", { first: "80", second: "100" }, 25],
    ["add-percent", { first: "10", second: "200" }, 220],
    ["subtract-percent", { first: "10", second: "200" }, 180],
  ];
  for (const [mode, values, expected] of cases) {
    const result = calculatePercentage(mode, values);
    assert.equal(result.value, expected);
    assert.ok(result.formula.length > 0);
  }
});

test("percentage calculations support meaningful negative values and trim precision", () => {
  assert.equal(calculatePercentage("percent-of", { first: "-12.5", second: "8" }).formattedValue, "-1");
  assert.equal(calculatePercentage("change", { first: "-10", second: "-5" }).formattedValue, "50");
  assert.equal(formatRoundedNumber(1.234567), "1.2346");
  assert.equal(formatRoundedNumber(2.5), "2.5");
  assert.equal(formatRoundedNumber(-0.00001), "0");
});

test("empty, invalid, and zero-denominator inputs have clear errors", () => {
  assert.match(calculatePercentage("percent-of", { first: "", second: "2" }).error, /Enter/);
  assert.match(calculatePercentage("percent-of", { first: "no", second: "2" }).error, /valid/);
  assert.match(calculatePercentage("is-what-percent", { first: "1", second: "0" }).error, /zero/);
  assert.match(calculatePercentage("change", { first: "0", second: "2" }).error, /zero/);
});
