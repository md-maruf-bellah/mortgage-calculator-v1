'use client';
import { formatCurrency } from '@/lib/mortgage';

export default function ComparisonTable({ results, inputs }) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="p-5 border-b border-white/[0.06]">
        <h3 className="text-sm font-bold text-slate-300" style={{ fontFamily: 'Syne, sans-serif' }}>
          Loan Term Comparison
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Loan Term</th>
              <th>Loan Amount</th>
              <th>Down Payment</th>
              <th>Principal</th>
              <th>Interest Rate</th>
              <th>Property Tax</th>
              <th>Insurance</th>
              <th>PMI</th>
              <th>HOA Fees</th>
              <th>Extra Mo.</th>
              <th>Monthly Pay.</th>
              <th>Total Interest</th>
              <th>Total Payment</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.term}>
                <td>
                  <span className="badge badge-indigo">{r.term} Years</span>
                </td>
                <td>{formatCurrency(inputs.loanAmount)}</td>
                <td>{formatCurrency(inputs.downPayment)}</td>
                <td>{formatCurrency(r.principal)}</td>
                <td>{inputs.interestRate}%</td>
                <td>{formatCurrency(inputs.propertyTaxes)}</td>
                <td>{formatCurrency(inputs.homeInsurance)}</td>
                <td>{inputs.pmi}%</td>
                <td>{formatCurrency(inputs.hoaFees)}</td>
                <td>{formatCurrency(inputs.extraMonthlyPayment)}</td>
                <td className="text-indigo-400 font-semibold">{formatCurrency(r.monthlyPayment)}</td>
                <td className="text-rose-400">{formatCurrency(r.totalInterest)}</td>
                <td className="text-amber-400">{formatCurrency(r.totalCost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
