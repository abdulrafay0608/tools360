"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import { calculatePercentage } from "../percentageCalculatorUtils";
import {
  PERCENTAGE_MODES,
  MODE_LABELS,
  FIELD_LABELS,
} from "../percentageCalculatorData";

export default function PercentageCalculatorTool() {
  const [mode, setMode] = useState(PERCENTAGE_MODES[0]);
  const [values, setValues] = useState({ first: "", second: "" });
  const [copyMessage, setCopyMessage] = useState("");
  const result = useMemo(() => calculatePercentage(mode, values), [mode, values]);
  const labels = FIELD_LABELS[mode];

  async function copyResult() {
    if (result.error || result.formattedValue === undefined) return;
    try {
      await navigator.clipboard.writeText(result.formattedValue);
      setCopyMessage("Result copied.");
    } catch {
      setCopyMessage("Could not copy the result. Select and copy it instead.");
    }
  }

  function clear() {
    setValues({ first: "", second: "" });
    setCopyMessage("");
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.8fr)]">
        <section aria-label="Percentage inputs" className="space-y-4">
          <label className="block text-sm font-semibold text-[#263e36]">
            Calculation
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value)}
              className="mt-2 min-h-11 w-full border border-[#b8c9c0] bg-white px-3 font-normal"
            >
              {PERCENTAGE_MODES.map((item) => (
                <option key={item} value={item}>{MODE_LABELS[item]}</option>
              ))}
            </select>
          </label>
          {["first", "second"].map((key, index) => (
            <label key={key} className="block text-sm font-semibold text-[#263e36]">
              {labels[index]}
              <input
                type="number"
                inputMode="decimal"
                value={values[key]}
                onChange={(event) => {
                  setValues((current) => ({ ...current, [key]: event.target.value }));
                  setCopyMessage("");
                }}
                className="mt-2 min-h-11 w-full border border-[#b8c9c0] px-3 font-normal"
                aria-label={labels[index]}
              />
            </label>
          ))}
        </section>

        <section className="flex min-h-48 flex-col justify-between border border-[#dce5e0] bg-[#f8faf9] p-4 sm:p-5" aria-live="polite">
          <div>
            <p className="text-sm font-medium text-[#62746d]">Result</p>
            {result.error ? (
              <p role="status" className="mt-3 text-sm text-[#71827c]">{result.error}</p>
            ) : (
              <>
                <output data-testid="percentage-result" className="mt-2 block break-words text-3xl font-semibold text-[#173d34] sm:text-4xl">
                  {result.formattedValue}
                </output>
                <p className="mt-3 break-words text-sm text-[#52675e]">
                  Formula: <span data-testid="percentage-formula">{result.formula}</span>
                </p>
              </>
            )}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={copyResult} disabled={Boolean(result.error)}>Copy result</Button>
            <Button variant="outline" onClick={clear}>Clear</Button>
          </div>
          {copyMessage && <p role="status" data-testid="percentage-copy-status" className="mt-2 text-sm text-[#527268]">{copyMessage}</p>}
        </section>
      </div>
    </div>
  );
}
