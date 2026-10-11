import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateAge,
  getLocalDateInputValue,
} from "../src/tools/finance/age-calculator/ageCalculatorUtils.js";

test("calculates exact age and totals without timezone-sensitive parsing", () => {
  assert.deepEqual(calculateAge("2000-01-01", "2024-01-02"), {
    years: 24,
    months: 0,
    days: 1,
    totalMonths: 288,
    totalWeeks: 1252,
    totalDays: 8767,
    daysUntilNextBirthday: 365,
    nextBirthdayWeekday: "Wednesday",
  });
});

test("handles leap-day birthdays using February 28 in non-leap years", () => {
  const before = calculateAge("2000-02-29", "2021-02-27");
  const birthday = calculateAge("2000-02-29", "2021-02-28");
  const after = calculateAge("2000-02-29", "2021-03-01");
  assert.deepEqual([before.years, before.months, before.days], [20, 11, 29]);
  assert.deepEqual([birthday.years, birthday.months, birthday.days], [21, 0, 0]);
  assert.deepEqual([after.years, after.months, after.days], [21, 0, 1]);
  assert.equal(birthday.daysUntilNextBirthday, 365);
});

test("birthday on the age-on date counts toward the next birthday", () => {
  const result = calculateAge("1990-06-15", "2024-06-15");
  assert.deepEqual([result.years, result.months, result.days], [34, 0, 0]);
  assert.equal(result.daysUntilNextBirthday, 365);
});

test("empty and future date inputs produce errors", () => {
  assert.match(calculateAge("", "2024-01-01").error, /birth date/);
  assert.match(calculateAge("2025-01-01", "2024-01-01").error, /before/);
  assert.match(calculateAge("2020-02-30", "2024-01-01").error, /valid/);
});

test("local date input string uses local calendar fields", () => {
  const date = new Date(2024, 0, 2, 23, 30);
  assert.equal(getLocalDateInputValue(date), "2024-01-02");
});
