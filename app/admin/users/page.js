'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';

import { Plus, Search, Edit3, Trash2, UserCheck, UserX, Shield, Loader2, X, Check, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const ROLE_COLORS = {
  superadmin: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  admin:      'text-purple-400 bg-purple-500/10 border-purple-500/20',
  manager:    'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  analyst:    'text-blue-400 bg-blue-500/10 border-blue-500/20',
  viewer:     'text-slate-400 bg-slate-700/30 border-slate-600/20',
};

function UserModal({ user, roles, onClose, onSave, currentUser }) {
  const isEdit = !!user?._id;
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    roleId: user?.role?._id || roles[0]?._id || '',
    isActive: user?.isActive !== false,
    notes: user?.notes || '',
  });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.email || (!isEdit && !form.password)) {
      toast.error('Name, email, and password are required');
      return;
    }
    setSaving(true);
    try {
      const selectedRole = roles.find(r => r._id === form.roleId);
      const body = isEdit
        ? { name: form.name, email: form.email, roleId: form.roleId, isActive: form.isActive, notes: form.notes, ...(form.password ? { password: form.password } : {}) }
        : { name: form.name, email: form.email, password: form.password, roleName: selectedRole?.name, notes: form.notes };

      const res = await fetch('/api/users', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(isEdit ? 'User updated' : 'User created');
      onSave(data.data, isEdit);
      onClose();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
          <h2 className="text-lg font-bold text-slate-100" style={{ fontFamily: 'Syne, sans-serif' }}>
            {isEdit ? 'Edit User' : 'Create User'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-slate-200 transition-colors"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Full Name</label>
              <input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} placeholder="John Doe" />
            </div>
            <div>
              <label className="input-label">Email</label>
              <input type="email" className="input-field" value={form.email} onChange={e => set('email', e.target.value)} placeholder="john@example.com" />
            </div>
          </div>
          <div>
            <label className="input-label">{isEdit ? 'New Password (leave blank to keep)' : 'Password'}</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} className="input-field pr-10"
                value={form.password} onChange={e => set('password', e.target.value)}
                placeholder={isEdit ? '••••••••' : 'Min 8 chars, uppercase + number'} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Role</label>
              <select className="input-field" value={form.roleId} onChange={e => set('roleId', e.target.value)}>
                {roles.map(r => <option key={r._id} value={r._id}>{r.displayName}</option>)}
              </select>
            </div>
            {isEdit && (
              <div>
                <label className="input-label">Status</label>
                <select className="input-field" value={form.isActive ? 'active' : 'inactive'} onChange={e => set('isActive', e.target.value === 'active')}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>
          <div>
            <label className="input-label">Notes (optional)</label>
            <textarea className="input-field h-20 resize-none" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Internal notes about this user..." />
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 flex-1 justify-center py-2.5">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {saving ? 'Saving...' : (isEdit ? 'Update User' : 'Create User')}
          </button>
          <button onClick={onClose} className="btn-secondary py-2.5 px-5">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const { user: currentUser, can } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'create' | userObject
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20, ...(search ? { search } : {}) });
      const [usersRes, rolesRes] = await Promise.all([
        fetch(`/api/users?${params}`),
        fetch('/api/roles'),
      ]);
      const [ud, rd] = await Promise.all([usersRes.json(), rolesRes.json()]);
      if (ud.success) { setUsers(ud.data); setTotal(ud.total); }
      if (rd.success) setRoles(rd.data);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleDelete = async (u) => {
    if (!confirm(`Delete user "${u.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/users/${u._id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      setUsers(p => p.filter(x => x._id !== u._id));
      toast.success('User deleted');
    } else {
      toast.error(data.error);
    }
  };

  const handleToggleActive = async (u) => {
    const res = await fetch(`/api/users/${u._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !u.isActive }),
    });
    const data = await res.json();
    if (data.success) {
      setUsers(p => p.map(x => x._id === u._id ? data.data : x));
      toast.success(u.isActive ? 'User deactivated' : 'User activated');
    }
  };

  const onSaveUser = (saved, isEdit) => {
    if (isEdit) setUsers(p => p.map(u => u._id === saved._id ? saved : u));
    else setUsers(p => [saved, ...p]);
  };

  const roleName = (u) => u.role?.name || 'viewer';

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'Syne, sans-serif' }}>User Management</h1>
          <p className="text-slate-500 text-sm mt-1">{total} total users</p>
        </div>
        {can('users:create') && (
          <button onClick={() => setModal('create')} className="btn-primary flex items-center gap-2">
            <Plus size={15} />Create User
          </button>
        )}
      </div>

      {/* Search */}
      <div className="glass-card p-4 mb-6">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="input-field pl-10" placeholder="Search by name or email…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j}><div className="skeleton h-4 rounded w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-slate-600 py-12">No users found</td></tr>
              ) : users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                        {u.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200 text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>{u.name}</p>
                        <p className="text-xs text-slate-600">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${ROLE_COLORS[roleName(u)] || ROLE_COLORS.viewer}`}
                      style={{ fontFamily: 'Syne, sans-serif' }}>
                      <Shield size={10} />
                      {u.role?.displayName || roleName(u)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge text-xs ${u.isActive ? 'badge-green' : 'bg-slate-700/30 text-slate-500 border-slate-600/20'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="text-slate-600 text-xs">
                    {u.lastLogin ? formatDistanceToNow(new Date(u.lastLogin), { addSuffix: true }) : 'Never'}
                  </td>
                  <td className="text-slate-600 text-xs">
                    {u.createdAt ? formatDistanceToNow(new Date(u.createdAt), { addSuffix: true }) : '-'}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      {can('users:edit') && (
                        <>
                          <button onClick={() => setModal(u)} className="p-1.5 rounded-lg hover:bg-indigo-500/10 text-slate-500 hover:text-indigo-400 transition-colors" title="Edit">
                            <Edit3 size={13} />
                          </button>
                          {u._id !== currentUser?._id && (
                            <button onClick={() => handleToggleActive(u)}
                              className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'hover:bg-amber-500/10 text-slate-500 hover:text-amber-400' : 'hover:bg-emerald-500/10 text-slate-500 hover:text-emerald-400'}`}
                              title={u.isActive ? 'Deactivate' : 'Activate'}>
                              {u.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                            </button>
                          )}
                        </>
                      )}
                      {can('users:delete') && u._id !== currentUser?._id && roleName(u) !== 'superadmin' && (
                        <button onClick={() => handleDelete(u)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="p-4 border-t border-white/[0.06] flex items-center justify-between">
            <p className="text-xs text-slate-500">Showing {(page-1)*20+1}–{Math.min(page*20, total)} of {total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn-secondary py-1.5 px-3 text-xs">Prev</button>
              <button onClick={() => setPage(p => p+1)} disabled={page * 20 >= total} className="btn-secondary py-1.5 px-3 text-xs">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <UserModal
          user={modal === 'create' ? null : modal}
          roles={roles}
          currentUser={currentUser}
          onClose={() => setModal(null)}
          onSave={onSaveUser}
        />
      )}
    </div>
  );
}
