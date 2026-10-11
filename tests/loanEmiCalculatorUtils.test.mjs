import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateLoanAmortization,
  createAmortizationCsv,
  formatCurrency,
  groupAmortizationByYear,
} from "../src/tools/finance/loan-emi-calculator/loanEmiCalculatorUtils.js";

test("known EMI value and amortization totals are consistent", () => {
  const result = calculateLoanAmortization({
    amount: "100000",
    annualRate: "12",
    tenure: "12",
    tenureUnit: "months",
  });
  assert.equal(result.monthlyEmi, 8884.88);
  assert.equal(result.schedule.length, 12);
  assert.equal(result.schedule.at(-1).balance, 0);
  assert.equal(
    Number(result.schedule.reduce((sum, row) => sum + row.emi, 0).toFixed(2)),
    result.totalPayment
  );
  assert.equal(
    Number(result.schedule.reduce((sum, row) => sum + row.interest, 0).toFixed(2)),
    result.totalInterest
  );
});

test("zero-interest loan has no interest and pays down the full principal", () => {
  const result = calculateLoanAmortization({
    amount: 1200,
    annualRate: 0,
    tenure: 12,
    tenureUnit: "months",
  });
  assert.equal(result.monthlyEmi, 100);
  assert.equal(result.totalInterest, 0);
  assert.equal(result.totalPayment, 1200);
  assert.equal(result.schedule.at(-1).balance, 0);
});

test("years and months tenure, yearly grouping, CSV output and currency formatting work", () => {
  const yearly = calculateLoanAmortization({
    amount: 24000,
    annualRate: 0,
    tenure: 2,
    tenureUnit: "years",
  });
  assert.equal(yearly.months, 24);
  assert.equal(groupAmortizationByYear(yearly.schedule).length, 2);
  const csv = createAmortizationCsv(yearly.schedule);
  assert.match(csv, /^Month,EMI,Principal,Interest,Balance\r\n/);
  assert.match(csv, /\r\n24,/);
  assert.match(formatCurrency(100, "CUSTOM", "Rs").replace(/\u00a0/g, " "), /Rs/);
  assert.match(formatCurrency(100, "EUR"), /100/);
});

test("the maximum forty-year tenure is accepted", () => {
  const result = calculateLoanAmortization({
    amount: 100000,
    annualRate: 5,
    tenure: 40,
    tenureUnit: "years",
  });
  assert.equal(result.months, 480);
  assert.equal(result.schedule.length, 480);
  assert.equal(result.schedule.at(-1).balance, 0);
});

test("invalid amounts, rates, tenure, and tenure above forty years are rejected", () => {
  const base = { amount: 1000, annualRate: 5, tenure: 12, tenureUnit: "months" };
  assert.match(calculateLoanAmortization({ ...base, amount: "" }).error, /amount/);
  assert.match(calculateLoanAmortization({ ...base, amount: -1 }).error, /amount/);
  assert.match(calculateLoanAmortization({ ...base, annualRate: -1 }).error, /interest rate/);
  assert.match(calculateLoanAmortization({ ...base, tenure: 0 }).error, /tenure/);
  assert.match(calculateLoanAmortization({ ...base, tenure: 481 }).error, /40 years/);
});
