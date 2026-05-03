'use client';
import { useState, useEffect } from 'react';
import { Users, Shield, Activity, TrendingUp, AlertTriangle, CheckCircle,
  Clock, Wifi, UserX, Key, BarChart3, ArrowUpRight } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthContext';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const SEVERITY_ICON  = { info: CheckCircle, warning: AlertTriangle, critical: AlertTriangle };
const SEVERITY_COLOR = { info: 'text-emerald-400', warning: 'text-amber-400', critical: 'text-red-400' };
const SEVERITY_BG    = { info: 'bg-emerald-500/10', warning: 'bg-amber-500/10', critical: 'bg-red-500/10' };

function StatCard({ label, value, icon: Icon, color, bg, sub, loading, href }) {
  const inner = (
    <div className={`glass-card p-5 ${href ? 'glass-card-hover cursor-pointer' : ''}`}>
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-4`}>
        <Icon size={17} className={color} />
      </div>
      {loading
        ? <div className="skeleton h-8 w-20 rounded mb-1" />
        : <div className="text-3xl font-bold text-slate-100 mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>{value}</div>
      }
      <div className="text-xs font-semibold text-slate-400" style={{ fontFamily: 'Syne, sans-serif' }}>{label}</div>
      {sub && <div className="text-[11px] text-slate-600 mt-0.5">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats]       = useState(null);
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin').then(r => r.json()),
      fetch('/api/audit-logs?limit=10&page=1').then(r => r.json()),
    ]).then(([adminData, logsData]) => {
      if (adminData.success) setStats(adminData.data);
      if (logsData.success)  setLogs(logsData.data || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const PIE_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100" style={{ fontFamily: 'Syne, sans-serif' }}>
            Admin Overview
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Welcome back, <span className="text-slate-300">{user?.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-400" style={{ fontFamily: 'Syne, sans-serif' }}>System Healthy</span>
        </div>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users"      value={stats?.users.total ?? '—'}     icon={Users}    color="text-indigo-400"  bg="bg-indigo-500/10"  sub={`${stats?.users.active ?? '—'} active`}         href="/admin/users"  loading={loading} />
        <StatCard label="Roles Configured" value={stats?.roles.total ?? '—'}     icon={Shield}   color="text-amber-400"   bg="bg-amber-500/10"   sub="permission groups"                               href="/admin/roles"  loading={loading} />
        <StatCard label="Logins (24 h)"    value={stats?.auth.logins24h ?? '—'}  icon={Key}      color="text-emerald-400" bg="bg-emerald-500/10"  sub={`${stats?.auth.failedLogins24h ?? 0} failed`}   loading={loading} />
        <StatCard label="Active Sessions"  value={stats?.auth.activeSessions ?? '—'} icon={Wifi} color="text-blue-400"   bg="bg-blue-500/10"    sub="live tokens"                                     loading={loading} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity chart */}
        <div className="glass-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-slate-300" style={{ fontFamily: 'Syne, sans-serif' }}>
              Activity — Last 7 Days
            </h3>
            <BarChart3 size={16} className="text-slate-600" />
          </div>
          {stats?.activityByDay?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stats.activityByDay}>
                <defs>
                  <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gLogins" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                <XAxis dataKey="_id" tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 10, fontSize: 12 }} />
                <Area type="monotone" dataKey="total"   stroke="#6366f1" fill="url(#gTotal)"   strokeWidth={2} name="Total Events" />
                <Area type="monotone" dataKey="logins"  stroke="#10b981" fill="url(#gLogins)"  strokeWidth={2} name="Logins" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-600 text-sm">
              No activity data yet
            </div>
          )}
        </div>

        {/* Role distribution pie */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-bold text-slate-300 mb-5" style={{ fontFamily: 'Syne, sans-serif' }}>
            Users by Role
          </h3>
          {stats?.roleBreakdown?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={stats.roleBreakdown} cx="50%" cy="50%" outerRadius={60} dataKey="count" paddingAngle={3}>
                    {stats.roleBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} strokeWidth={0} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 10, fontSize: 12 }}
                    formatter={(v, n, p) => [v, p.payload.displayName]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {stats.roleBreakdown.map((r, i) => (
                  <div key={r.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-xs text-slate-400">{r.displayName}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-500">{r.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-600 text-sm">No users yet</div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent users */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300" style={{ fontFamily: 'Syne, sans-serif' }}>Recent Users</h3>
            <Link href="/admin/users" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View all <ArrowUpRight size={11} />
            </Link>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {loading ? [...Array(4)].map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-3">
                <div className="skeleton w-9 h-9 rounded-full" />
                <div className="flex-1 space-y-1.5"><div className="skeleton h-3.5 w-32 rounded" /><div className="skeleton h-3 w-24 rounded" /></div>
              </div>
            )) : stats?.recentUsers?.map(u => (
              <div key={u._id} className="p-4 flex items-center gap-3 hover:bg-white/[0.02]">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: u.role?.color ? u.role.color + '22' : '#6366f122', color: u.role?.color || '#818cf8' }}>
                  {u.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-300 truncate">{u.name}</p>
                  <p className="text-xs text-slate-600 truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] px-2 py-1 rounded-lg font-semibold"
                    style={{ background: (u.role?.color || '#6366f1') + '22', color: u.role?.color || '#818cf8' }}>
                    {u.role?.displayName || u.role?.name}
                  </span>
                  {!u.isActive && <UserX size={12} className="text-red-400" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent audit log */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300" style={{ fontFamily: 'Syne, sans-serif' }}>Recent Audit Events</h3>
            <Link href="/admin/audit-logs" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View all <ArrowUpRight size={11} />
            </Link>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {loading ? [...Array(5)].map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-3">
                <div className="skeleton w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-1.5"><div className="skeleton h-3.5 w-40 rounded" /><div className="skeleton h-3 w-28 rounded" /></div>
              </div>
            )) : logs.map(log => {
              const SevIcon = SEVERITY_ICON[log.severity] || CheckCircle;
              return (
                <div key={log._id} className="p-4 flex items-center gap-3 hover:bg-white/[0.02]">
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${SEVERITY_BG[log.severity]}`}>
                    <SevIcon size={13} className={SEVERITY_COLOR[log.severity]} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-slate-300 truncate">{log.action}</p>
                    <p className="text-[11px] text-slate-600 truncate">{log.userEmail}</p>
                  </div>
                  <div className="text-[10px] text-slate-700 flex items-center gap-1 flex-shrink-0">
                    <Clock size={10} />
                    {log.createdAt ? formatDistanceToNow(new Date(log.createdAt), { addSuffix: true }) : '-'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Security alert if issues */}
      {(stats?.security?.criticalLogs7d > 0 || stats?.auth?.failedLogins24h > 5) && (
        <div className="glass-card p-4 border-amber-500/20 border bg-amber-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-400" style={{ fontFamily: 'Syne, sans-serif' }}>
                Security Notice
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {stats.security.criticalLogs7d > 0 && `${stats.security.criticalLogs7d} critical events in the last 7 days. `}
                {stats.auth.failedLogins24h > 5 && `${stats.auth.failedLogins24h} failed login attempts in the last 24 hours.`}
                {' '}Review the <Link href="/admin/audit-logs" className="text-amber-400 underline">audit log</Link> for details.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
