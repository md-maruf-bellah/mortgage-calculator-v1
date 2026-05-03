'use client';
import { formatCurrency } from '@/lib/mortgage';
import { TrendingUp, DollarSign, Calendar, Home } from 'lucide-react';

export default function ResultsPanel({ result, inputs }) {
  const stats = [
    {
      label: 'Monthly Payment',
      sublabel: 'with taxes & fees',
      value: formatCurrency(result.monthlyPayment),
      icon: Calendar,
      color: 'indigo',
      glow: 'shadow-indigo-500/10',
    },
    {
      label: 'Total Interest',
      sublabel: 'over loan term',
      value: formatCurrency(result.totalInterest),
      icon: TrendingUp,
      color: 'rose',
      glow: 'shadow-rose-500/10',
    },
    {
      label: 'Total Payment',
      sublabel: 'principal + interest',
      value: formatCurrency(result.totalCost),
      icon: DollarSign,
      color: 'amber',
      glow: 'shadow-amber-500/10',
    },
    {
      label: 'Loan Amount',
      sublabel: 'after down payment',
      value: formatCurrency(result.principal),
      icon: Home,
      color: 'emerald',
      glow: 'shadow-emerald-500/10',
    },
  ];

  const colorMap = {
    indigo: { bg: 'bg-indigo-500/15', icon: 'text-indigo-400', border: 'border-indigo-500/20', value: 'text-indigo-300' },
    rose: { bg: 'bg-rose-500/15', icon: 'text-rose-400', border: 'border-rose-500/20', value: 'text-rose-300' },
    amber: { bg: 'bg-amber-500/15', icon: 'text-amber-400', border: 'border-amber-500/20', value: 'text-amber-300' },
    emerald: { bg: 'bg-emerald-500/15', icon: 'text-emerald-400', border: 'border-emerald-500/20', value: 'text-emerald-300' },
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
      {stats.map((stat) => {
        const colors = colorMap[stat.color];
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={`glass-card glass-card-hover p-5 shadow-lg ${stat.glow}`}
          >
            <div className={`w-9 h-9 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center mb-4`}>
              <Icon size={17} className={colors.icon} />
            </div>
            <div className={`text-2xl font-bold mb-1 ${colors.value}`} style={{ fontFamily: 'Syne, sans-serif' }}>
              {stat.value}
            </div>
            <div className="text-xs font-semibold text-slate-300 mb-0.5" style={{ fontFamily: 'Syne, sans-serif' }}>
              {stat.label}
            </div>
            <div className="text-[11px] text-slate-600">{stat.sublabel}</div>
          </div>
        );
      })}
    </div>
  );
}
