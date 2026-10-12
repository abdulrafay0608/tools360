import { PERCENTAGE_MODES } from "./percentageCalculatorData.js";

export { PERCENTAGE_MODES };

function parseValue(value, label) {
  if (value === "" || value === null || value === undefined) {
    return { error: `Enter ${label}.` };
  }
  const number = Number(value);
  if (!Number.isFinite(number)) return { error: `Enter a valid ${label}.` };
  return { value: number };
}

export function formatRoundedNumber(value) {
  if (!Number.isFinite(value)) return "";
  const rounded = Math.round((value + Number.EPSILON) * 10000) / 10000;
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

export function calculatePercentage(mode, rawValues) {
  if (!PERCENTAGE_MODES.includes(mode)) {
    return { error: "Choose a percentage calculation." };
  }

  const first = parseValue(rawValues.first, mode === "change" ? "original value" : "percentage");
  if (first.error) return first;
  const second = parseValue(rawValues.second, mode === "change" ? "new value" : "value");
  if (second.error) return second;

  const [x, y] = [first.value, second.value];
  let value;
  let formula;
  switch (mode) {
    case "percent-of":
      value = (x / 100) * y;
      formula = `${formatRoundedNumber(x)} ÷ 100 × ${formatRoundedNumber(y)}`;
      break;
    case "is-what-percent":
      if (y === 0) return { error: "The value to divide by cannot be zero." };
      value = (x / y) * 100;
      formula = `(${formatRoundedNumber(x)} ÷ ${formatRoundedNumber(y)}) × 100`;
      break;
    case "change":
      if (x === 0) return { error: "Percentage change is undefined when the original value is zero." };
      value = ((y - x) / Math.abs(x)) * 100;
      formula = `((${formatRoundedNumber(y)} − ${formatRoundedNumber(x)}) ÷ |${formatRoundedNumber(x)}|) × 100`;
      break;
    case "add-percent":
      value = y + (x / 100) * y;
      formula = `${formatRoundedNumber(y)} + (${formatRoundedNumber(x)} ÷ 100 × ${formatRoundedNumber(y)})`;
      break;
    case "subtract-percent":
      value = y - (x / 100) * y;
      formula = `${formatRoundedNumber(y)} − (${formatRoundedNumber(x)} ÷ 100 × ${formatRoundedNumber(y)})`;
      break;
    default:
      return { error: "Choose a percentage calculation." };
  }

  if (!Number.isFinite(value)) return { error: "This calculation is outside the supported number range." };
  return { value, formattedValue: formatRoundedNumber(value), formula };
}
