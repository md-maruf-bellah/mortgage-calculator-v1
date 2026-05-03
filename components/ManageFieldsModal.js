'use client';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { X, Plus, Trash2, Edit3, Check, ToggleLeft, ToggleRight } from 'lucide-react';

const FIELD_TYPES = ['currency', 'percentage', 'number', 'text'];
const FREQUENCIES = ['monthly', 'annual', 'one-time'];

export default function ManageFieldsModal({ customFields, onUpdate, onClose }) {
  const [fields, setFields] = useState(customFields);
  const [editing, setEditing] = useState(null);
  const [newField, setNewField] = useState({
    name: '', label: '', type: 'currency', defaultValue: 0, frequency: 'monthly', description: ''
  });
  const [showAdd, setShowAdd] = useState(false);

  const handleAdd = async () => {
    if (!newField.name || !newField.label) {
      toast.error('Name and label are required');
      return;
    }
    try {
      const res = await fetch('/api/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newField),
      });
      const data = await res.json();
      if (data.success) {
        const updated = [...fields, data.data];
        setFields(updated);
        onUpdate(updated.filter(f => f.isActive));
        setNewField({ name: '', label: '', type: 'currency', defaultValue: 0, frequency: 'monthly', description: '' });
        setShowAdd(false);
        toast.success('Field added!');
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Failed to add field');
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/fields?id=${id}`, { method: 'DELETE' });
      const updated = fields.filter(f => f._id !== id);
      setFields(updated);
      onUpdate(updated.filter(f => f.isActive));
      toast.success('Field deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleToggle = async (field) => {
    try {
      const res = await fetch('/api/fields', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: field._id, isActive: !field.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        const updated = fields.map(f => f._id === field._id ? data.data : f);
        setFields(updated);
        onUpdate(updated.filter(f => f.isActive));
      }
    } catch {}
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
          <h2 className="text-lg font-bold text-slate-100" style={{ fontFamily: 'Syne, sans-serif' }}>
            Manage Input Fields
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-slate-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-3">
          {fields.length === 0 && (
            <p className="text-center text-slate-600 py-8 text-sm">No custom fields yet. Add one below.</p>
          )}

          {fields.map((field) => (
            <div key={field._id} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-white/[0.06]">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-slate-200 text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
                    {field.label}
                  </span>
                  <span className="badge badge-indigo text-[10px]">{field.type}</span>
                  <span className="badge badge-green text-[10px]">{field.frequency}</span>
                </div>
                <p className="text-xs text-slate-600">Default: {field.defaultValue} · {field.description}</p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button onClick={() => handleToggle(field)} className="text-slate-400 hover:text-slate-200 transition-colors">
                  {field.isActive ? <ToggleRight size={20} className="text-emerald-400" /> : <ToggleLeft size={20} />}
                </button>
                <button onClick={() => handleDelete(field._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}

          {/* Add new field */}
          {showAdd ? (
            <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/15 space-y-3">
              <p className="text-xs font-bold text-indigo-400 mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>NEW FIELD</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Field Name (key)</label>
                  <input className="input-field" placeholder="e.g. flood_insurance"
                    value={newField.name} onChange={e => setNewField(p => ({ ...p, name: e.target.value.replace(/\s/g, '_') }))} />
                </div>
                <div>
                  <label className="input-label">Display Label</label>
                  <input className="input-field" placeholder="e.g. Flood Insurance"
                    value={newField.label} onChange={e => setNewField(p => ({ ...p, label: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="input-label">Type</label>
                  <select className="input-field" value={newField.type} onChange={e => setNewField(p => ({ ...p, type: e.target.value }))}>
                    {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Frequency</label>
                  <select className="input-field" value={newField.frequency} onChange={e => setNewField(p => ({ ...p, frequency: e.target.value }))}>
                    {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Default Value</label>
                  <input type="number" className="input-field" value={newField.defaultValue}
                    onChange={e => setNewField(p => ({ ...p, defaultValue: parseFloat(e.target.value) || 0 }))} />
                </div>
              </div>

              <div>
                <label className="input-label">Description (optional)</label>
                <input className="input-field" placeholder="Brief description"
                  value={newField.description} onChange={e => setNewField(p => ({ ...p, description: e.target.value }))} />
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={handleAdd} className="btn-primary flex items-center gap-2 py-2 px-4 text-sm">
                  <Check size={14} /> Add Field
                </button>
                <button onClick={() => setShowAdd(false)} className="btn-secondary py-2 px-4 text-sm">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full p-3 rounded-xl border border-dashed border-white/[0.1] text-slate-500 hover:text-slate-300 hover:border-indigo-500/30 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Plus size={15} />
              Add Custom Field
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
