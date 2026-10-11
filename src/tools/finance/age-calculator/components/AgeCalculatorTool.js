"use client";

import { useMemo, useState } from "react";
import {
  calculateAge,
  getLocalDateInputValue,
} from "../ageCalculatorUtils";

const INPUT_CLASS = "mt-1 min-h-11 w-full border border-[#b8c9c0] bg-white px-3 text-sm";

function Result({ label, value }) {
  return (
    <div className="border border-[#dce5e0] bg-[#f8faf9] p-3">
      <p className="text-xs text-[#62746d]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[#173d34]">{value}</p>
    </div>
  );
}

function pluralize(value, unit) {
  return `${value} ${unit}${value === 1 ? "" : "s"}`;
}

export default function AgeCalculatorTool() {
  const today = useMemo(() => getLocalDateInputValue(), []);
  const [birthDate, setBirthDate] = useState("");
  const [ageOnDate, setAgeOnDate] = useState(today);
  const result = useMemo(
    () => calculateAge(birthDate, ageOnDate || today),
    [birthDate, ageOnDate, today]
  );

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <section className="grid gap-4 sm:grid-cols-2" aria-label="Age dates">
        <label className="text-sm font-semibold text-[#263e36]">
          Date of birth
          <input
            aria-label="Date of birth"
            type="date"
            max={today}
            value={birthDate}
            onChange={(event) => setBirthDate(event.target.value)}
            className={INPUT_CLASS}
          />
        </label>
        <label className="text-sm font-semibold text-[#263e36]">
          Age on date (defaults to today)
          <input
            aria-label="Age on date"
            type="date"
            value={ageOnDate}
            onChange={(event) => setAgeOnDate(event.target.value)}
            className={INPUT_CLASS}
          />
        </label>
      </section>

      {!birthDate ? (
        <p role="status" className="border border-[#dce5e0] bg-[#f8faf9] px-4 py-3 text-sm text-[#62746d]">
          Enter your date of birth to calculate your age.
        </p>
      ) : result.error ? (
        <p role="alert" className="border border-[#f3cfc8] bg-[#fdf4f3] px-4 py-3 text-sm text-[#a13c2f]">
          {result.error}
        </p>
      ) : (
        <section aria-live="polite" className="space-y-4">
          <div className="border border-[#dce5e0] bg-[#eaf3ed] p-4">
            <p className="text-xs font-medium text-[#527268]">Exact age</p>
            <p data-testid="exact-age" className="mt-1 text-2xl font-semibold text-[#173d34]">
              {pluralize(result.years, "year")}, {pluralize(result.months, "month")}, {pluralize(result.days, "day")}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Result label="Total months" value={result.totalMonths.toLocaleString()} />
            <Result label="Total weeks" value={result.totalWeeks.toLocaleString()} />
            <Result label="Total days" value={result.totalDays.toLocaleString()} />
            <Result label="Days until next birthday" value={result.daysUntilNextBirthday.toLocaleString()} />
            <Result label="Next birthday falls on" value={result.nextBirthdayWeekday} />
          </div>
          <p className="text-xs leading-5 text-[#71827c]">
            A February 29 birthday is observed on February 28 in non-leap years.
          </p>
        </section>
      )}
    </div>
  );
}
