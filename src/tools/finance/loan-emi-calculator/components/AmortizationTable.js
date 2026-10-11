"use client";

export default function AmortizationTable({ rows, currency, customSymbol, formatCurrency }) {
  return (
    <div className="max-h-[28rem] overflow-auto overscroll-contain border border-[#dce5e0]" data-testid="amortization-scroll">
      <table className="w-full min-w-[660px] border-collapse text-left text-sm">
        <thead className="sticky top-0 bg-[#edf3ef] text-xs uppercase tracking-wide text-[#405950]">
          <tr>
            {["Month", "EMI", "Principal", "Interest", "Balance"].map((heading) => (
              <th key={heading} scope="col" className="whitespace-nowrap px-3 py-3">{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.month}-${index}`} className="border-t border-[#e5ece8] even:bg-[#fafcfb]">
              <th scope="row" className="whitespace-nowrap px-3 py-2 font-medium text-[#405950]">{row.month}</th>
              {[row.emi, row.principal, row.interest, row.balance].map((value, cellIndex) => (
                <td key={cellIndex} className="whitespace-nowrap px-3 py-2 tabular-nums">
                  {formatCurrency(value, currency, customSymbol)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
