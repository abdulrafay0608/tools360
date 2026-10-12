import {
  CURRENCY_OPTIONS,
  MAX_TENURE_MONTHS,
} from "./loanEmiCalculatorData.js";

export { CURRENCY_OPTIONS, MAX_TENURE_MONTHS };

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateLoanAmortization({
  amount: rawAmount,
  annualRate: rawRate,
  tenure: rawTenure,
  tenureUnit = "years",
}) {
  const amount = Number(rawAmount);
  const annualRate = Number(rawRate);
  const tenure = Number(rawTenure);

  if (rawAmount === "" || !Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter a loan amount greater than zero." };
  }
  if (rawRate === "" || !Number.isFinite(annualRate) || annualRate < 0) {
    return { error: "Enter a valid annual interest rate of zero or more." };
  }
  if (rawTenure === "" || !Number.isInteger(tenure) || tenure <= 0) {
    return { error: "Enter a whole-number tenure greater than zero." };
  }
  const months = tenureUnit === "months" ? tenure : tenure * 12;
  if (months > MAX_TENURE_MONTHS) {
    return { error: "Loan tenure cannot exceed 40 years (480 months)." };
  }

  const monthlyRate = annualRate / 1200;
  const payment =
    monthlyRate === 0
      ? amount / months
      : (amount * monthlyRate) / (1 - (1 + monthlyRate) ** -months);
  if (!Number.isFinite(payment)) {
    return { error: "These loan details are outside the supported number range." };
  }

  const scheduledPayment = roundMoney(payment);
  let balance = roundMoney(amount);
  const schedule = [];
  let totalInterest = 0;
  let totalPayment = 0;

  for (let month = 1; month <= months; month += 1) {
    const interest = roundMoney(balance * monthlyRate);
    const principal = roundMoney(Math.min(balance, scheduledPayment - interest));
    const isFinal = month === months || principal >= balance;
    const paidPrincipal = isFinal ? balance : principal;
    const emi = roundMoney(paidPrincipal + interest);
    balance = isFinal ? 0 : roundMoney(balance - paidPrincipal);
    totalInterest = roundMoney(totalInterest + interest);
    totalPayment = roundMoney(totalPayment + emi);
    schedule.push({
      month,
      emi,
      principal: paidPrincipal,
      interest,
      balance,
    });
  }

  return {
    monthlyEmi: scheduledPayment,
    totalInterest,
    totalPayment,
    principal: roundMoney(amount),
    months,
    schedule,
  };
}

export function formatCurrency(value, currency = "USD", customSymbol = "") {
  const formatterCurrency = currency === "CUSTOM" ? "USD" : currency;
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: formatterCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (currency !== "CUSTOM") return formatter.format(value);

  const parts = formatter.formatToParts(value);
  const symbol = customSymbol.trim() || "$";
  return parts
    .map((part) => (part.type === "currency" ? symbol : part.value))
    .join("");
}

export function createAmortizationCsv(schedule) {
  const rows = [
    ["Month", "EMI", "Principal", "Interest", "Balance"],
    ...schedule.map((row) => [
      row.month,
      row.emi.toFixed(2),
      row.principal.toFixed(2),
      row.interest.toFixed(2),
      row.balance.toFixed(2),
    ]),
  ];
  return rows.map((row) => row.join(",")).join("\r\n");
}

export function groupAmortizationByYear(schedule) {
  const years = [];
  for (let index = 0; index < schedule.length; index += 12) {
    const period = schedule.slice(index, index + 12);
    const last = period[period.length - 1];
    years.push({
      month: `Year ${years.length + 1}`,
      emi: roundMoney(period.reduce((sum, row) => sum + row.emi, 0)),
      principal: roundMoney(period.reduce((sum, row) => sum + row.principal, 0)),
      interest: roundMoney(period.reduce((sum, row) => sum + row.interest, 0)),
      balance: last.balance,
    });
  }
  return years;
}
