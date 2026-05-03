'use client';
import { formatCurrency } from '@/lib/mortgage';

export default function SummaryGrid({ results, activeTab, onTabChange }) {
  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-bold text-slate-300 mb-5" style={{ fontFamily: 'Syne, sans-serif' }}>
        All Loan Terms — Summary
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {results.map((r) => (
          <button
            key={r.term}
            onClick={() => onTabChange(r.term)}
            className={`p-4 rounded-xl border text-left transition-all ${
              activeTab === r.term
                ? 'border-indigo-500/40 bg-indigo-500/10'
                : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
            }`}
          >
            <div className={`text-xs font-bold mb-2 ${activeTab === r.term ? 'text-indigo-400' : 'text-slate-500'}`} style={{ fontFamily: 'Syne, sans-serif' }}>
              {r.term} Years
            </div>
            <div className="text-xl font-bold text-slate-100 mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
              {formatCurrency(r.monthlyPayment)}
            </div>
            <div className="text-[11px] text-slate-600">
              Total Interest: {formatCurrency(r.totalInterest)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
