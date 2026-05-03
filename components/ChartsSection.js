'use client';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, Legend,
} from 'recharts';
import { formatCurrency } from '@/lib/mortgage';

const DONUT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#1e293b',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: '10px',
        padding: '10px 14px',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '12px',
      }}>
        {label && <p style={{ color: '#94a3b8', marginBottom: 6, fontFamily: 'Syne, sans-serif', fontSize: 11 }}>{label}</p>}
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color, margin: '2px 0' }}>
            {p.name}: {typeof p.value === 'number' ? formatCurrency(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ChartsSection({ result, allTerms }) {
  // Breakdown donut
  const breakdown = result.breakdown || {};
  const donutData = [
    { name: 'P&I', value: breakdown.principal || 0 },
    { name: 'Tax', value: breakdown.tax || 0 },
    { name: 'Insurance', value: breakdown.insurance || 0 },
    { name: 'PMI', value: breakdown.pmi || 0 },
    { name: 'HOA', value: breakdown.hoa || 0 },
  ].filter((d) => d.value > 0);

  // Amortization area chart
  const scheduleData = result.schedule?.map((s) => ({
    month: `Y${s.year}`,
    Principal: parseFloat(s.principal.toFixed(0)),
    Interest: parseFloat(s.interest.toFixed(0)),
  })) || [];

  // Bar chart - monthly payments by term
  const barData = allTerms.map((t) => ({
    term: `${t.term}Y`,
    Monthly: parseFloat(t.monthlyPayment.toFixed(0)),
  }));

  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-bold text-slate-300 mb-6" style={{ fontFamily: 'Syne, sans-serif' }}>
        Visual Analysis
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Donut */}
        <div>
          <p className="text-xs text-slate-500 font-semibold text-center mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
            Monthly Payment Breakdown
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {donutData.map((_, i) => (
                  <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {donutData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-500">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: DONUT_COLORS[i] }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>

        {/* Area - Interest vs Principal */}
        <div>
          <p className="text-xs text-slate-500 font-semibold text-center mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
            Interest vs Principal
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={scheduleData.slice(0, 30)} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="gradPrincipal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradInterest" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Principal" stroke="#10b981" strokeWidth={2} fill="url(#gradPrincipal)" />
              <Area type="monotone" dataKey="Interest" stroke="#ef4444" strokeWidth={2} fill="url(#gradInterest)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bar - term comparison */}
        <div>
          <p className="text-xs text-slate-500 font-semibold text-center mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
            Monthly by Loan Term
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
              <XAxis dataKey="term" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Monthly" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
