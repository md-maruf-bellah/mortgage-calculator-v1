'use client';
import { useState, useEffect } from 'react';
import { X, Star, Trash2, Upload, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/mortgage';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function HistoryPanel({ sessionId, onClose, onLoad }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = () => {
    fetch(`/api/history?sessionId=${sessionId}&limit=30`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setHistory(d.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadHistory(); }, []);

  const handleDelete = async (id) => {
    await fetch(`/api/history?id=${id}`, { method: 'DELETE' });
    setHistory(prev => prev.filter(h => h._id !== id));
    toast.success('Removed from history');
  };

  const handleFavorite = async (item) => {
    await fetch('/api/history', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item._id, isFavorite: !item.isFavorite }),
    });
    setHistory(prev => prev.map(h => h._id === item._id ? { ...h, isFavorite: !h.isFavorite } : h));
  };

  return (
    <div className="glass-card sticky top-24 overflow-hidden" style={{ maxHeight: 'calc(100vh - 120px)' }}>
      <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Clock size={15} className="text-slate-400" />
          <span className="text-sm font-bold text-slate-300" style={{ fontFamily: 'Syne, sans-serif' }}>
            History
          </span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-500 hover:text-slate-300 transition-colors">
          <X size={15} />
        </button>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-xl" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-slate-600 text-sm">
            <Clock size={30} className="mx-auto mb-3 opacity-30" />
            <p>No calculations yet</p>
            <p className="text-xs mt-1">Run a calculation to see history</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {history.map((item) => (
              <div key={item._id} className="p-3 rounded-xl bg-slate-800/50 border border-white/[0.05] hover:border-white/[0.1] transition-all group">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-300 truncate" style={{ fontFamily: 'Syne, sans-serif' }}>
                      {formatCurrency(item.inputs?.loanAmount || 0)}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      {item.inputs?.interestRate}% · {item.inputs?.loanTermYears}yr
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button onClick={() => handleFavorite(item)} className={`p-1 rounded transition-colors ${item.isFavorite ? 'text-amber-400' : 'text-slate-600 hover:text-amber-400'}`}>
                      <Star size={12} fill={item.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                    <button onClick={() => handleDelete(item._id)} className="p-1 rounded text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-slate-600 mb-2">
                  <span>Monthly: <span className="text-indigo-400 font-mono">{formatCurrency(item.results?.monthlyPayment || 0)}</span></span>
                  <span>Interest: <span className="text-rose-400 font-mono">{formatCurrency(item.results?.totalInterest || 0)}</span></span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-700">
                    {item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) : ''}
                  </span>
                  <button
                    onClick={() => onLoad(item.inputs)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
                    style={{ fontFamily: 'Syne, sans-serif' }}
                  >
                    <Upload size={10} /> Load
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
