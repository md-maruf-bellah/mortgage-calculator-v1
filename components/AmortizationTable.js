'use client';
import { useState } from 'react';
import { formatCurrency } from '@/lib/mortgage';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

export default function AmortizationTable({ result, inputs }) {
  const [showAll, setShowAll] = useState(false);

  const schedule = result.schedule || [];
  const displayed = showAll ? schedule : schedule.slice(0, 24);

  // Cumulative data for chart
  const chartData = schedule.map(s => ({
    year: `Y${s.year}`,
    'Remaining Balance': parseFloat(s.balance.toFixed(0)),
    'Cumulative Interest': parseFloat(s.totalInterestPaid.toFixed(0)),
  }));

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Balance over time chart */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-bold text-slate-300 mb-6" style={{ fontFamily: 'Syne, sans-serif' }}>
          Balance vs Interest Paid Over Time
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="gradBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradCumInterest" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
            <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{
                background: '#1e293b',
                border: '1px solid rgba(148,163,184,0.12)',
                borderRadius: 10,
                fontFamily: 'JetBrains Mono',
                fontSize: 12,
              }}
              formatter={(v) => formatCurrency(v)}
            />
            <Area type="monotone" dataKey="Remaining Balance" stroke="#6366f1" strokeWidth={2} fill="url(#gradBalance)" />
            <Area type="monotone" dataKey="Cumulative Interest" stroke="#ef4444" strokeWidth={2} fill="url(#gradCumInterest)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Amortization table */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-300" style={{ fontFamily: 'Syne, sans-serif' }}>
            Amortization Schedule
          </h3>
          <span className="badge badge-indigo">{result.loanTermYears * 12} payments</span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Year</th>
                <th>Payment</th>
                <th>Principal</th>
                <th>Interest</th>
                <th>Balance</th>
                <th>Total Interest Paid</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((row, i) => (
                <tr key={i}>
                  <td>{row.month}</td>
                  <td>{row.year}</td>
                  <td>{formatCurrency(row.payment)}</td>
                  <td className="text-emerald-400">{formatCurrency(row.principal)}</td>
                  <td className="text-rose-400">{formatCurrency(row.interest)}</td>
                  <td>{formatCurrency(row.balance)}</td>
                  <td className="text-amber-400">{formatCurrency(row.totalInterestPaid)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {schedule.length > 24 && (
          <div className="p-4 border-t border-white/[0.06] flex justify-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showAll ? 'Show Less' : `Show All ${schedule.length} Entries`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
