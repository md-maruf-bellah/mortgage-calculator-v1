'use client';
import { useState } from 'react';
import { Plus, Trash2, TrendingUp } from 'lucide-react';
import { calculateMortgage, formatCurrency } from '@/lib/mortgage';
import NavBar from '@/components/NavBar';
import PermissionGate from '@/components/auth/PermissionGate';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

const SCENARIO_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

const DEFAULT_SCENARIO = {
  label: 'Scenario A',
  loanAmount: 300000,
  interestRate: 6.5,
  downPayment: 20000,
  propertyTaxes: 3600,
  homeInsurance: 1200,
  pmi: 0.5,
  hoaFees: 100,
  extraMonthlyPayment: 0,
  loanTermYears: 30,
};

export default function ComparePage() {
  const [scenarios, setScenarios] = useState([
    { ...DEFAULT_SCENARIO, label: 'Scenario A', id: 1 },
    { ...DEFAULT_SCENARIO, label: 'Scenario B', interestRate: 6.0, downPayment: 60000, id: 2 },
  ]);

  const addScenario = () => {
    if (scenarios.length >= 4) return;
    const labels = ['A', 'B', 'C', 'D'];
    setScenarios(p => [...p, {
      ...DEFAULT_SCENARIO,
      label: `Scenario ${labels[p.length]}`,
      id: Date.now(),
    }]);
  };

  const removeScenario = (id) => {
    if (scenarios.length <= 2) return;
    setScenarios(p => p.filter(s => s.id !== id));
  };

  const updateScenario = (id, key, value) => {
    setScenarios(p => p.map(s => s.id === id ? { ...s, [key]: parseFloat(value) || value } : s));
  };

  const results = scenarios.map(s => ({ ...s, ...calculateMortgage(s) }));

  // Radar data
  const maxMonthly = Math.max(...results.map(r => r.monthlyPayment));
  const maxInterest = Math.max(...results.map(r => r.totalInterest));
  const maxCost = Math.max(...results.map(r => r.totalCost));

  const radarData = [
    { subject: 'Monthly Pay', ...Object.fromEntries(results.map(r => [r.label, ((r.monthlyPayment / maxMonthly) * 100).toFixed(0)])) },
    { subject: 'Total Interest', ...Object.fromEntries(results.map(r => [r.label, ((r.totalInterest / maxInterest) * 100).toFixed(0)])) },
    { subject: 'Total Cost', ...Object.fromEntries(results.map(r => [r.label, ((r.totalCost / maxCost) * 100).toFixed(0)])) },
    { subject: 'Down Pay %', ...Object.fromEntries(results.map(r => [r.label, ((r.downPayment / r.loanAmount) * 100).toFixed(0)])) },
  ];

  const barData = [
    { metric: 'Monthly', ...Object.fromEntries(results.map(r => [r.label, Math.round(r.monthlyPayment)])) },
    { metric: 'Interest ($K)', ...Object.fromEntries(results.map(r => [r.label, Math.round(r.totalInterest / 1000)])) },
    { metric: 'Total Cost ($K)', ...Object.fromEntries(results.map(r => [r.label, Math.round(r.totalCost / 1000)])) },
  ];

  const INPUTS = [
    { key: 'loanAmount', label: 'Loan Amount', prefix: '$' },
    { key: 'interestRate', label: 'Interest Rate', suffix: '%' },
    { key: 'downPayment', label: 'Down Payment', prefix: '$' },
    { key: 'loanTermYears', label: 'Loan Term (yrs)' },
    { key: 'propertyTaxes', label: 'Property Tax/yr', prefix: '$' },
    { key: 'extraMonthlyPayment', label: 'Extra Pay/mo', prefix: '$' },
  ];

  return (
    <div className="min-h-screen">
      <NavBar />

      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">
        {/* Scenario input cards */}
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${scenarios.length}, 1fr)` }}>
          {scenarios.map((s, idx) => (
            <div key={s.id} className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: SCENARIO_COLORS[idx] }} />
                  <input
                    className="bg-transparent text-sm font-bold text-slate-200 outline-none border-b border-transparent focus:border-indigo-500/50 pb-0.5 w-28"
                    style={{ fontFamily: 'Syne, sans-serif' }}
                    value={s.label}
                    onChange={e => updateScenario(s.id, 'label', e.target.value)}
                  />
                </div>
                {scenarios.length > 2 && (
                  <button onClick={() => removeScenario(s.id)} className="p-1.5 text-slate-600 hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {INPUTS.map(field => (
                  <div key={field.key}>
                    <label className="input-label">{field.label}</label>
                    <div className="relative">
                      {field.prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">{field.prefix}</span>}
                      <input
                        type="number"
                        className="input-field text-sm"
                        style={{ paddingLeft: field.prefix ? '24px' : '14px', paddingRight: field.suffix ? '32px' : '14px' }}
                        value={s[field.key]}
                        onChange={e => updateScenario(s.id, field.key, e.target.value)}
                      />
                      {field.suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">{field.suffix}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {scenarios.length < 4 && (
            <button
              onClick={addScenario}
              className="glass-card p-5 border-dashed border-white/10 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all flex flex-col items-center justify-center gap-3 text-slate-600 hover:text-indigo-400 min-h-[300px]"
            >
              <Plus size={24} />
              <span className="text-sm font-semibold" style={{ fontFamily: 'Syne, sans-serif' }}>Add Scenario</span>
            </button>
          )}
        </div>

        {/* Results comparison */}
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-white/[0.06]">
            <h3 className="text-sm font-bold text-slate-300" style={{ fontFamily: 'Syne, sans-serif' }}>Results Comparison</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  {results.map((r, i) => (
                    <th key={r.id}>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: SCENARIO_COLORS[i] }} />
                        {r.label}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Monthly Payment (Total)', key: 'monthlyPayment' },
                  { label: 'P&I Only', key: 'monthlyPI' },
                  { label: 'Principal', key: 'principal' },
                  { label: 'Total Interest', key: 'totalInterest' },
                  { label: 'Total Cost', key: 'totalCost' },
                ].map(row => {
                  const values = results.map(r => r[row.key]);
                  const best = Math.min(...values);
                  return (
                    <tr key={row.label}>
                      <td className="font-semibold text-slate-400" style={{ fontFamily: 'Syne, sans-serif' }}>{row.label}</td>
                      {values.map((v, i) => (
                        <td key={i} className={v === best ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                          {formatCurrency(v)}
                          {v === best && <span className="ml-2 badge badge-green text-[9px]">Best</span>}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bar chart */}
          <div className="glass-card p-6">
            <h4 className="text-xs font-bold text-slate-400 mb-5" style={{ fontFamily: 'Syne, sans-serif' }}>SIDE-BY-SIDE COMPARISON</h4>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                <XAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'Syne' }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 10, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'Syne' }} />
                {results.map((r, i) => (
                  <Bar key={r.id} dataKey={r.label} fill={SCENARIO_COLORS[i]} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar chart */}
          <div className="glass-card p-6">
            <h4 className="text-xs font-bold text-slate-400 mb-5" style={{ fontFamily: 'Syne, sans-serif' }}>COST PROFILE (RELATIVE %)</h4>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(148,163,184,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'Syne' }} />
                {results.map((r, i) => (
                  <Radar key={r.id} name={r.label} dataKey={r.label}
                    stroke={SCENARIO_COLORS[i]} fill={SCENARIO_COLORS[i]} fillOpacity={0.1} strokeWidth={2} />
                ))}
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'Syne' }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 10, fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Winner summary */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-bold text-slate-300 mb-5" style={{ fontFamily: 'Syne, sans-serif' }}>
            📊 Smart Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'Lowest Monthly Cost', key: 'monthlyPayment', desc: 'Best for cash flow' },
              { title: 'Least Interest Paid', key: 'totalInterest', desc: 'Best long-term value' },
              { title: 'Lowest Total Cost', key: 'totalCost', desc: 'Best overall deal' },
            ].map(({ title, key, desc }) => {
              const sorted = [...results].sort((a, b) => a[key] - b[key]);
              const winner = sorted[0];
              const winnerIdx = results.findIndex(r => r.id === winner.id);
              const savings = sorted[1][key] - winner[key];
              return (
                <div key={key} className="p-4 rounded-xl bg-slate-800/50 border border-white/[0.06]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: SCENARIO_COLORS[winnerIdx] }} />
                    <span className="text-xs text-slate-500">{desc}</span>
                  </div>
                  <div className="text-lg font-bold text-slate-100 mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
                    {winner.label}
                  </div>
                  <div className="text-sm text-slate-400 font-mono">{formatCurrency(winner[key])}</div>
                  <div className="text-xs text-emerald-400 mt-1">
                    Saves {formatCurrency(savings)} vs next best
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
