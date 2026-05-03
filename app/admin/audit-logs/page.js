'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search, Download, RefreshCw, AlertTriangle, CheckCircle, AlertOctagon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const SEVERITY_CONFIG = {
  info:     { icon: CheckCircle,   text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', badge: 'badge-green' },
  warning:  { icon: AlertTriangle, text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',  badge: 'badge-gold' },
  critical: { icon: AlertOctagon,  text: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',    badge: 'bg-red-500/15 text-red-400 border border-red-500/20' },
};

const CATEGORIES = ['auth', 'user', 'role', 'calculator', 'system'];
const SEVERITIES  = ['info', 'warning', 'critical'];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', category: '', severity: '' });
  const [selectedLog, setSelectedLog] = useState(null);
  const LIMIT = 25;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (filters.search)   params.set('search',   filters.search);
    if (filters.category) params.set('category', filters.category);
    if (filters.severity) params.set('severity', filters.severity);
    try {
      const res = await fetch(`/api/audit-logs?${params}`);
      const data = await res.json();
      if (data.success) { setLogs(data.data); setTotal(data.total || 0); }
    } catch {}
    setLoading(false);
  }, [page, filters]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const setFilter = (key, val) => { setFilters(p => ({ ...p, [key]: val })); setPage(1); };
  const hasFilters = Object.values(filters).some(Boolean);

  const exportCSV = () => {
    const headers = ['Time', 'Action', 'User', 'Role', 'IP', 'Category', 'Severity', 'Success'];
    const rows = logs.map(l => [
      l.createdAt ? format(new Date(l.createdAt), 'yyyy-MM-dd HH:mm:ss') : '',
      l.action, l.userEmail || '', l.userRole || '', l.ip || '',
      l.category, l.severity, l.success !== false ? 'Yes' : 'No',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `audit-logs-${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100" style={{ fontFamily: 'Syne, sans-serif' }}>Audit Logs</h1>
          <p className="text-slate-500 text-sm mt-1">{total.toLocaleString()} total events recorded</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchLogs} className="btn-secondary flex items-center gap-2 py-2 px-4 text-sm">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={exportCSV} className="btn-gold flex items-center gap-2 py-2 px-4 text-sm">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input className="input-field pl-9 text-sm" placeholder="Search actions or emails..."
              value={filters.search} onChange={e => setFilter('search', e.target.value)} />
          </div>
          <select className="input-field text-sm w-40" value={filters.category} onChange={e => setFilter('category', e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input-field text-sm w-40" value={filters.severity} onChange={e => setFilter('severity', e.target.value)}>
            <option value="">All Severities</option>
            {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {hasFilters && (
            <button onClick={() => { setFilters({ search: '', category: '', severity: '' }); setPage(1); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20 transition-colors">
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Severity quick-filter pills */}
      <div className="flex gap-3 flex-wrap">
        {SEVERITIES.map(sev => {
          const cfg = SEVERITY_CONFIG[sev];
          const Icon = cfg.icon;
          const count = logs.filter(l => l.severity === sev).length;
          return (
            <button key={sev} onClick={() => setFilter('severity', filters.severity === sev ? '' : sev)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${cfg.bg} ${cfg.border} ${cfg.text} ${filters.severity === sev ? 'ring-2 ring-current ring-offset-1 ring-offset-slate-950' : ''}`}
              style={{ fontFamily: 'Syne, sans-serif' }}>
              <Icon size={11} />{count} {sev}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>User</th>
                <th>Category</th>
                <th>Severity</th>
                <th>IP</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i}>{[...Array(7)].map((_, j) => <td key={j}><div className="skeleton h-4 w-full rounded" /></td>)}</tr>
                ))
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-slate-600 text-sm">No logs match your filters</td></tr>
              ) : logs.map(log => {
                const cfg = SEVERITY_CONFIG[log.severity] || SEVERITY_CONFIG.info;
                const Icon = cfg.icon;
                return (
                  <tr key={log._id} className="cursor-pointer" onClick={() => setSelectedLog(log)}>
                    <td className="whitespace-nowrap">
                      <div className="text-xs text-slate-300 font-mono">
                        {log.createdAt ? format(new Date(log.createdAt), 'MMM d, HH:mm:ss') : '-'}
                      </div>
                      <div className="text-[10px] text-slate-600">
                        {log.createdAt ? formatDistanceToNow(new Date(log.createdAt), { addSuffix: true }) : ''}
                      </div>
                    </td>
                    <td><span className="font-mono text-sm text-slate-200">{log.action}</span></td>
                    <td>
                      <div className="text-sm text-slate-300 truncate max-w-[180px]">{log.userName || log.userEmail || '-'}</div>
                      {log.userRole && <div className="text-[10px] text-slate-600">{log.userRole}</div>}
                    </td>
                    <td><span className="badge badge-indigo text-[10px]">{log.category}</span></td>
                    <td>
                      <span className={`badge text-[10px] ${cfg.badge} flex items-center gap-1 w-fit`}>
                        <Icon size={9} />{log.severity}
                      </span>
                    </td>
                    <td><span className="font-mono text-xs text-slate-600">{log.ip || '-'}</span></td>
                    <td>
                      <span className={`badge text-[10px] ${log.success !== false ? 'badge-green' : 'bg-red-500/15 text-red-400 border border-red-500/20'}`}>
                        {log.success !== false ? '✓ OK' : '✗ Fail'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/[0.06] flex items-center justify-between">
            <p className="text-xs text-slate-600">Page {page} of {totalPages} · {total} records</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-secondary p-2 disabled:opacity-30"><ChevronLeft size={14} /></button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${p === page ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:bg-white/[0.06]'}`}
                    style={{ fontFamily: 'Syne, sans-serif' }}>{p}</button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="btn-secondary p-2 disabled:opacity-30"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedLog && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelectedLog(null)}>
          <div className="modal-content max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
              <h3 className="font-bold text-slate-100" style={{ fontFamily: 'Syne, sans-serif' }}>Event Detail</h3>
              <button onClick={() => setSelectedLog(null)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {[
                ['Action',    selectedLog.action],
                ['User',      `${selectedLog.userName || '-'} · ${selectedLog.userEmail || '-'}`],
                ['Role',      selectedLog.userRole || '-'],
                ['Category',  selectedLog.category],
                ['Severity',  selectedLog.severity],
                ['IP Address',selectedLog.ip || '-'],
                ['User Agent',selectedLog.userAgent || '-'],
                ['Status',    selectedLog.success !== false ? '✓ Success' : '✗ Failed'],
                ['Timestamp', selectedLog.createdAt ? format(new Date(selectedLog.createdAt), 'PPpp') : '-'],
              ].map(([label, val]) => (
                <div key={label} className="flex gap-4 items-start">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider w-24 flex-shrink-0 mt-1"
                    style={{ fontFamily: 'Syne, sans-serif' }}>{label}</span>
                  <span className="text-sm text-slate-300 font-mono break-all">{val}</span>
                </div>
              ))}
              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2"
                    style={{ fontFamily: 'Syne, sans-serif' }}>Details</p>
                  <pre className="text-xs text-emerald-300 bg-slate-900 rounded-xl p-4 overflow-auto max-h-48 font-mono">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
              {selectedLog.errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-xs text-red-400 font-mono">{selectedLog.errorMessage}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
