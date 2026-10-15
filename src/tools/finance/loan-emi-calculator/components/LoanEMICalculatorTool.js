"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import {
  calculateLoanAmortization,
  createAmortizationCsv,
  CURRENCY_OPTIONS,
  formatCurrency,
  groupAmortizationByYear,
} from "../loanEmiCalculatorUtils";
import AmortizationTable from "./AmortizationTable";

const INPUT_CLASS = "mt-1 min-h-10 w-full border border-[#b8c9c0] bg-white px-3 text-sm";

function SummaryCard({ label, value }) {
  return (
    <div className="border border-[#dce5e0] bg-[#f8faf9] p-3">
      <p className="text-xs font-medium text-[#62746d]">{label}</p>
      <p data-testid={label.toLowerCase().replaceAll(" ", "-")} className="mt-1 break-words text-lg font-semibold text-[#173d34] sm:text-xl">{value}</p>
    </div>
  );
}

function DonutChart({ principal, interest, currency, customSymbol }) {
  const total = principal + interest;
  const interestPercent = total > 0 ? (interest / total) * 100 : 0;
  return (
    <div className="flex items-center gap-4">
      <svg
        viewBox="0 0 120 120"
        role="img"
        aria-label={`Loan breakdown: ${100 - interestPercent.toFixed(1)} percent principal and ${interestPercent.toFixed(1)} percent interest`}
        className="h-28 w-28 shrink-0"
      >
        <circle cx="60" cy="60" r="45" fill="none" stroke="#dce5e0" strokeWidth="18" />
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke="#2563eb"
          strokeWidth="18"
          strokeDasharray={`${((100 - interestPercent) * 282.743) / 100} 282.743`}
          transform="rotate(-90 60 60)"
        />
        <text x="60" y="64" textAnchor="middle" className="fill-[#173d34] text-[12px] font-semibold">
          {interestPercent.toFixed(0)}% interest
        </text>
      </svg>
      <div className="min-w-0 space-y-2 text-xs text-[#52675e]">
        <p><span className="mr-2 inline-block size-2 bg-[#2563eb]" />Principal: {formatCurrency(principal, currency, customSymbol)}</p>
        <p><span className="mr-2 inline-block size-2 bg-[#dce5e0]" />Interest: {formatCurrency(interest, currency, customSymbol)}</p>
      </div>
    </div>
  );
}

export default function LoanEMICalculatorTool() {
  const [form, setForm] = useState({
    amount: "100000",
    annualRate: "12",
    tenure: "12",
    tenureUnit: "months",
    currency: "USD",
    customSymbol: "",
  });
  const [view, setView] = useState("monthly");
  const result = useMemo(
    () => calculateLoanAmortization({
      amount: form.amount,
      annualRate: form.annualRate,
      tenure: form.tenure,
      tenureUnit: form.tenureUnit,
    }),
    [form.amount, form.annualRate, form.tenure, form.tenureUnit]
  );
  const yearlyRows = useMemo(
    () => result.schedule ? groupAmortizationByYear(result.schedule) : [],
    [result]
  );
  const displayedRows = view === "yearly" ? yearlyRows : (result.schedule || []);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function downloadCsv() {
    if (!result.schedule) return;
    const blob = new Blob([createAmortizationCsv(result.schedule)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "loan-amortization.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <section aria-label="Loan details" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm font-semibold text-[#263e36]">
          Loan amount
          <input aria-label="Loan amount" type="number" min="0" step="any" value={form.amount} onChange={(event) => update("amount", event.target.value)} className={INPUT_CLASS} />
        </label>
        <label className="text-sm font-semibold text-[#263e36]">
          Annual interest rate (%)
          <input aria-label="Annual interest rate" type="number" min="0" step="any" value={form.annualRate} onChange={(event) => update("annualRate", event.target.value)} className={INPUT_CLASS} />
        </label>
        <div className="grid grid-cols-[1fr_7rem] gap-2">
          <label className="text-sm font-semibold text-[#263e36]">
            Tenure
            <input aria-label="Loan tenure" type="number" min="1" step="1" value={form.tenure} onChange={(event) => update("tenure", event.target.value)} className={INPUT_CLASS} />
          </label>
          <label className="text-sm font-semibold text-[#263e36]">
            Unit
            <select aria-label="Tenure unit" value={form.tenureUnit} onChange={(event) => update("tenureUnit", event.target.value)} className={INPUT_CLASS}>
              <option value="years">Years</option>
              <option value="months">Months</option>
            </select>
          </label>
        </div>
        <label className="text-sm font-semibold text-[#263e36]">
          Currency
          <select aria-label="Currency" value={form.currency} onChange={(event) => update("currency", event.target.value)} className={INPUT_CLASS}>
            {CURRENCY_OPTIONS.map((currency) => <option key={currency.code} value={currency.code}>{currency.label}</option>)}
          </select>
        </label>
        {form.currency === "CUSTOM" && (
          <label className="text-sm font-semibold text-[#263e36]">
            Custom currency symbol
            <input aria-label="Custom currency symbol" maxLength={8} value={form.customSymbol} onChange={(event) => update("customSymbol", event.target.value)} className={INPUT_CLASS} placeholder="e.g. ¥" />
          </label>
        )}
      </section>

      {result.error ? (
        <p role="alert" className="border border-[#f3cfc8] bg-[#fdf4f3] px-4 py-3 text-sm text-[#a13c2f]">{result.error}</p>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-3" aria-live="polite">
            <SummaryCard label="Monthly EMI" value={formatCurrency(result.monthlyEmi, form.currency, form.customSymbol)} />
            <SummaryCard label="Total interest" value={formatCurrency(result.totalInterest, form.currency, form.customSymbol)} />
            <SummaryCard label="Total payment" value={formatCurrency(result.totalPayment, form.currency, form.customSymbol)} />
          </section>
          <section className="flex flex-wrap items-center gap-4 border border-[#dce5e0] p-3 sm:p-4">
            <DonutChart principal={result.principal} interest={result.totalInterest} currency={form.currency} customSymbol={form.customSymbol} />
            <p className="max-w-xs text-xs leading-5 text-[#62746d]">
              The chart shows the total principal and interest paid over {result.months} months.
            </p>
          </section>
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-[#173d34]">Amortization schedule</h2>
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex border border-[#b8c9c0]" aria-label="Schedule grouping">
                  {["monthly", "yearly"].map((item) => (
                    <button key={item} type="button" aria-pressed={view === item} onClick={() => setView(item)} className={`min-h-9 px-3 text-xs font-medium capitalize ${view === item ? "bg-[#eaf3ed] text-[#173d34]" : "bg-white text-[#52675e]"}`}>
                      {item}
                    </button>
                  ))}
                </div>
                <Button size="sm" onClick={downloadCsv}>Download CSV</Button>
              </div>
            </div>
            <AmortizationTable
              rows={displayedRows}
              currency={form.currency}
              customSymbol={form.customSymbol}
              formatCurrency={formatCurrency}
            />
          </section>
        </>
      )}
    </div>
  );
}
