'use client';
import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, History, Star, Calendar, DollarSign } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { formatCurrency } from '@/lib/mortgage';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/history?limit=50')
      .then(r => r.json())
      .then(d => {
        if (d.success) setHistory(d.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const favorites = history.filter(h => h.isFavorite);
  const avgMonthly = history.length
    ? history.reduce((s, h) => s + (h.results?.monthlyPayment || 0), 0) / history.length
    : 0;
  const avgLoan = history.length
    ? history.reduce((s, h) => s + (h.inputs?.loanAmount || 0), 0) / history.length
    : 0;

  // Group by day for chart
  const byDay = history.reduce((acc, h) => {
    const day = new Date(h.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!acc[day]) acc[day] = { day, count: 0, avgMonthly: 0, total: 0 };
    acc[day].count++;
    acc[day].total += h.results?.monthlyPayment || 0;
    acc[day].avgMonthly = acc[day].total / acc[day].count;
    return acc;
  }, {});
  const chartData = Object.values(byDay).slice(-14);

  // Rate distribution
  const rateBuckets = { '< 5%': 0, '5-6%': 0, '6-7%': 0, '7-8%': 0, '> 8%': 0 };
  history.forEach(h => {
    const r = h.inputs?.interestRate || 0;
    if (r < 5) rateBuckets['< 5%']++;
    else if (r < 6) rateBuckets['5-6%']++;
    else if (r < 7) rateBuckets['6-7%']++;
    else if (r < 8) rateBuckets['7-8%']++;
    else rateBuckets['> 8%']++;
  });
  const rateData = Object.entries(rateBuckets).map(([name, value]) => ({ name, value }));
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="min-h-screen">
      <NavBar />

      <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Calculations', value: history.length, icon: History, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
            { label: 'Favorites Saved', value: favorites.length, icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'Avg Monthly Payment', value: formatCurrency(avgMonthly), icon: Calendar, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Avg Loan Amount', value: formatCurrency(avgLoan), icon: DollarSign, color: 'text-rose-400', bg: 'bg-rose-500/10' },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="glass-card p-5">
                <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                  <Icon size={17} className={stat.color} />
                </div>
                <div className="text-2xl font-bold text-slate-100 mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
                  {loading ? <div className="skeleton h-7 w-24 rounded" /> : stat.value}
                </div>
                <div className="text-xs text-slate-600">{stat.label}</div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Activity chart */}
          <div className="glass-card p-6 md:col-span-2">
            <h4 className="text-xs font-bold text-slate-400 mb-5" style={{ fontFamily: 'Syne, sans-serif' }}>
              CALCULATION ACTIVITY (LAST 14 DAYS)
            </h4>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                  <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 10, fontSize: 12 }} />
                  <Line yAxisId="left" type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} name="# Calcs" />
                  <Line yAxisId="right" type="monotone" dataKey="avgMonthly" stroke="#10b981" strokeWidth={2} dot={false} name="Avg Monthly" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-slate-600 text-sm">
                No data yet — start calculating!
              </div>
            )}
          </div>

          {/* Rate distribution */}
          <div className="glass-card p-6">
            <h4 className="text-xs font-bold text-slate-400 mb-5" style={{ fontFamily: 'Syne, sans-serif' }}>
              INTEREST RATE DISTRIBUTION
            </h4>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={rateData} cx="50%" cy="50%" outerRadius={65} dataKey="value" paddingAngle={2}>
                  {rateData.map((_, i) => <Cell key={i} fill={COLORS[i]} strokeWidth={0} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 10, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1 mt-3">
              {rateData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                  {d.name}: {d.value}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent calculations */}
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300" style={{ fontFamily: 'Syne, sans-serif' }}>Recent Calculations</h3>
            <span className="badge badge-indigo">{history.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Loan Amount</th>
                  <th>Rate</th>
                  <th>Term</th>
                  <th>Monthly</th>
                  <th>Total Interest</th>
                  <th>When</th>
                  <th>Fav</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [...Array(6)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(8)].map((_, j) => (
                        <td key={j}><div className="skeleton h-4 rounded w-full" /></td>
                      ))}
                    </tr>
                  ))
                  : history.slice(0, 20).map(h => (
                    <tr key={h._id}>
                      <td className="text-slate-300">{h.name}</td>
                      <td>{formatCurrency(h.inputs?.loanAmount || 0)}</td>
                      <td>{h.inputs?.interestRate}%</td>
                      <td>{h.inputs?.loanTermYears}yr</td>
                      <td className="text-indigo-400">{formatCurrency(h.results?.monthlyPayment || 0)}</td>
                      <td className="text-rose-400">{formatCurrency(h.results?.totalInterest || 0)}</td>
                      <td className="text-slate-600 text-[11px]">
                        {h.createdAt ? formatDistanceToNow(new Date(h.createdAt), { addSuffix: true }) : '-'}
                      </td>
                      <td>{h.isFavorite ? <Star size={13} className="text-amber-400" fill="currentColor" /> : <Star size={13} className="text-slate-700" />}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
