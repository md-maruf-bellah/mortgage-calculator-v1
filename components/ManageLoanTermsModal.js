'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { X, Plus, Trash2, Check, Star } from 'lucide-react';

const PRESET_TERMS = [5, 7, 10, 12, 15, 20, 25, 30, 40];

export default function ManageLoanTermsModal({ loanTerms, onUpdate, onClose }) {
  const [dbTerms, setDbTerms] = useState([]);
  const [newYears, setNewYears] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/loan-terms')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data.length > 0) {
          setDbTerms(d.data);
        } else {
          // Seed from current loanTerms prop
          setDbTerms(loanTerms.map((y, i) => ({
            _id: `local-${y}`,
            years: y,
            label: `${y} Years`,
            isActive: true,
            isDefault: y === 30,
            order: i,
          })));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const syncUpdate = (updated) => {
    setDbTerms(updated);
    onUpdate(updated.filter(t => t.isActive).map(t => t.years).sort((a, b) => a - b));
  };

  const handleAdd = async () => {
    const years = parseInt(newYears);
    if (!years || years < 1 || years > 50) {
      toast.error('Enter a valid term (1-50 years)');
      return;
    }
    if (dbTerms.find(t => t.years === years)) {
      toast.error('Term already exists');
      return;
    }
    try {
      const res = await fetch('/api/loan-terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ years, label: `${years} Years`, order: years }),
      });
      const data = await res.json();
      if (data.success) {
        syncUpdate([...dbTerms, data.data]);
        setNewYears('');
        toast.success(`${years}-year term added`);
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Failed to add');
    }
  };

  const handleDelete = async (term) => {
    if (dbTerms.filter(t => t.isActive).length <= 1) {
      toast.error('Keep at least one active term');
      return;
    }
    try {
      if (!term._id.startsWith('local')) {
        await fetch(`/api/loan-terms?id=${term._id}`, { method: 'DELETE' });
      }
      syncUpdate(dbTerms.filter(t => t._id !== term._id));
      toast.success('Term removed');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleToggle = async (term) => {
    try {
      if (!term._id.startsWith('local')) {
        await fetch('/api/loan-terms', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: term._id, isActive: !term.isActive }),
        });
      }
      syncUpdate(dbTerms.map(t => t._id === term._id ? { ...t, isActive: !t.isActive } : t));
    } catch {}
  };

  const handleSetDefault = async (term) => {
    try {
      if (!term._id.startsWith('local')) {
        await Promise.all(dbTerms.map(t =>
          fetch('/api/loan-terms', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: t._id, isDefault: t._id === term._id }),
          })
        ));
      }
      syncUpdate(dbTerms.map(t => ({ ...t, isDefault: t._id === term._id })));
      toast.success(`${term.years}-year set as default`);
    } catch {}
  };

  const sorted = [...dbTerms].sort((a, b) => a.years - b.years);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
          <h2 className="text-lg font-bold text-slate-100" style={{ fontFamily: 'Syne, sans-serif' }}>
            Manage Loan Terms
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-slate-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-3">
          {loading ? (
            <div className="text-center text-slate-600 py-8">Loading...</div>
          ) : (
            sorted.map((term) => (
              <div key={term._id} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-bold ${term.isActive ? 'text-slate-200' : 'text-slate-600'}`} style={{ fontFamily: 'Syne, sans-serif' }}>
                    {term.years}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400" style={{ fontFamily: 'Syne, sans-serif' }}>
                        {term.label}
                      </span>
                      {term.isDefault && <span className="badge badge-gold text-[10px]">Default</span>}
                      {!term.isActive && <span className="badge text-[10px] bg-slate-700/50 text-slate-500 border-slate-600/20">Inactive</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!term.isDefault && term.isActive && (
                    <button onClick={() => handleSetDefault(term)} title="Set as default"
                      className="p-1.5 rounded-lg hover:bg-amber-500/10 text-slate-600 hover:text-amber-400 transition-colors">
                      <Star size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleToggle(term)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      term.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-slate-700/50 text-slate-500 border border-slate-600/20 hover:bg-slate-700'
                    }`}
                    style={{ fontFamily: 'Syne, sans-serif' }}
                  >
                    {term.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button onClick={() => handleDelete(term)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Add term */}
          <div className="flex gap-3 pt-2">
            <div className="flex-1">
              <label className="input-label">Add Custom Term (years)</label>
              <input
                type="number"
                className="input-field"
                placeholder="e.g. 12"
                value={newYears}
                onChange={e => setNewYears(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                min={1}
                max={50}
              />
            </div>
            <button onClick={handleAdd} className="btn-primary flex items-center gap-2 mt-5 py-2.5 px-4 text-sm h-fit">
              <Plus size={14} /> Add
            </button>
          </div>

          {/* Quick presets */}
          <div>
            <p className="input-label mt-2">Quick Add Presets</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_TERMS.filter(y => !dbTerms.find(t => t.years === y)).map(y => (
                <button key={y} onClick={() => { setNewYears(String(y)); }}
                  className="px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-400 text-xs hover:bg-indigo-500/15 hover:text-indigo-400 transition-all border border-transparent hover:border-indigo-500/20"
                  style={{ fontFamily: 'Syne, sans-serif' }}>
                  {y}yr
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
