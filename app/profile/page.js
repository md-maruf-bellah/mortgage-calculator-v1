'use client';
import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { User, Lock, Shield, Eye, EyeOff, Check, X, LogOut, Clock, Activity } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow, format } from 'date-fns';
import NavBar from '@/components/NavBar';

const ROLE_BADGE = {
  super_admin:  { label: 'Super Admin',  bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/20' },
  admin:        { label: 'Admin',        bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/20' },
  loan_officer: { label: 'Loan Officer', bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/20' },
  viewer:       { label: 'Viewer',       bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  guest:        { label: 'Guest',        bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-600/20' },
};

const PERMISSION_LABELS = {
  'calculator:view': 'View Calculator',
  'calculator:calculate': 'Run Calculations',
  'calculator:export_pdf': 'Export PDF',
  'calculator:save_history': 'Save History',
  'loan_terms:view': 'View Loan Terms',
  'loan_terms:create': 'Create Loan Terms',
  'loan_terms:edit': 'Edit Loan Terms',
  'loan_terms:delete': 'Delete Loan Terms',
  'fields:view': 'View Custom Fields',
  'fields:create': 'Create Custom Fields',
  'fields:edit': 'Edit Custom Fields',
  'fields:delete': 'Delete Custom Fields',
  'history:view_own': 'View Own History',
  'history:view_all': 'View All History',
  'history:delete_own': 'Delete Own History',
  'history:delete_all': 'Delete All History',
  'compare:view': 'Scenario Compare',
  'dashboard:view': 'Analytics Dashboard',
  'analytics:view_own': 'Own Analytics',
  'analytics:view_all': 'All Analytics',
  'users:view': 'View Users',
  'users:create': 'Create Users',
  'users:edit': 'Edit Users',
  'users:delete': 'Delete Users',
  'users:assign_roles': 'Assign Roles',
  'roles:view': 'View Roles',
  'roles:create': 'Create Roles',
  'roles:edit': 'Edit Roles',
  'roles:delete': 'Delete Roles',
  'audit:view': 'View Audit Logs',
};

const PERM_GROUPS = {
  'Calculator': ['calculator:view','calculator:calculate','calculator:export_pdf','calculator:save_history'],
  'Loan Terms': ['loan_terms:view','loan_terms:create','loan_terms:edit','loan_terms:delete'],
  'Custom Fields': ['fields:view','fields:create','fields:edit','fields:delete'],
  'History': ['history:view_own','history:view_all','history:delete_own','history:delete_all'],
  'Navigation': ['compare:view','dashboard:view','analytics:view_own','analytics:view_all'],
  'User Mgmt': ['users:view','users:create','users:edit','users:delete','users:assign_roles'],
  'Role Mgmt': ['roles:view','roles:create','roles:edit','roles:delete'],
  'System': ['audit:view'],
};

export default function ProfilePage() {
  const { user, logout, refetch } = useAuth();
  const router = useRouter();
  const [editName, setEditName] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [showPassForm, setShowPassForm] = useState(false);
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const roleBadge = ROLE_BADGE[user.role] || ROLE_BADGE.viewer;
  const initials = user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const saveName = async () => {
    if (!name.trim()) return;
    setSavingName(true);
    try {
      const res = await fetch('/api/auth/me', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
      const data = await res.json();
      if (data.success) { await refetch(); toast.success('Name updated!'); setEditName(false); }
      else toast.error(data.error);
    } finally { setSavingName(false); }
  };

  const savePassword = async () => {
    if (passForm.newPassword !== passForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (passForm.newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setSavingPass(true);
    try {
      const res = await fetch('/api/auth/me', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(passForm) });
      const data = await res.json();
      if (data.success) { toast.success('Password changed!'); setShowPassForm(false); setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }
      else toast.error(data.error);
    } finally { setSavingPass(false); }
  };

  return (
    <div className="min-h-screen">
      <NavBar />
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        {/* Profile card */}
        <div className="glass-card p-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white flex-shrink-0"
              style={{ fontFamily: 'Syne, sans-serif' }}>
              {initials}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                {editName ? (
                  <div className="flex items-center gap-2">
                    <input className="input-field text-lg font-bold py-1.5 px-3" style={{ fontFamily: 'Syne, sans-serif' }}
                      value={name} onChange={e => setName(e.target.value)} autoFocus />
                    <button onClick={saveName} disabled={savingPass} className="btn-green p-2"><Check size={15} /></button>
                    <button onClick={() => { setEditName(false); setName(user.name); }} className="btn-danger p-2"><X size={15} /></button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-slate-100" style={{ fontFamily: 'Syne, sans-serif' }}>{user.name}</h1>
                    <button onClick={() => setEditName(true)} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-semibold"
                      style={{ fontFamily: 'Syne, sans-serif' }}>Edit</button>
                  </>
                )}
              </div>
              <p className="text-slate-500 text-sm mb-3">{user.email}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${roleBadge.bg} ${roleBadge.text} border ${roleBadge.border}`}
                  style={{ fontFamily: 'Syne, sans-serif' }}>
                  <Shield size={11} />{roleBadge.label}
                </span>
                <span className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Clock size={11} />
                  Last login: {user.lastLogin ? formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true }) : 'Never'}
                </span>
                <span className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Activity size={11} />
                  {user.loginCount || 0} total logins
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-bold text-slate-300 mb-5" style={{ fontFamily: 'Syne, sans-serif' }}>Security</h2>
          {!showPassForm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-300 font-semibold" style={{ fontFamily: 'Syne, sans-serif' }}>Password</p>
                <p className="text-xs text-slate-600 mt-0.5">Change your account password</p>
              </div>
              <button onClick={() => setShowPassForm(true)} className="btn-secondary flex items-center gap-2 py-2 px-4 text-sm">
                <Lock size={13} />Change Password
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { key: 'currentPassword', label: 'Current Password' },
                { key: 'newPassword', label: 'New Password' },
                { key: 'confirmPassword', label: 'Confirm New Password' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="input-label">{label}</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} className="input-field pr-10"
                      value={passForm[key]} onChange={e => setPassForm(p => ({ ...p, [key]: e.target.value }))} />
                    <button type="button" onClick={() => setShowPass(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex gap-2">
                <button onClick={savePassword} disabled={savingPass} className="btn-primary flex items-center gap-2 py-2 px-4 text-sm">
                  {savingPass ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={14} />}
                  {savingPass ? 'Saving...' : 'Save Password'}
                </button>
                <button onClick={() => { setShowPassForm(false); setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}
                  className="btn-secondary py-2 px-4 text-sm">Cancel</button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-300 font-semibold" style={{ fontFamily: 'Syne, sans-serif' }}>Member since</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  {user.createdAt ? format(new Date(user.createdAt), 'MMMM d, yyyy') : '-'}
                </p>
              </div>
              <button onClick={logout} className="btn-danger flex items-center gap-2 py-2 px-4 text-sm">
                <LogOut size={13} />Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-bold text-slate-300 mb-5" style={{ fontFamily: 'Syne, sans-serif' }}>
            Your Permissions <span className="text-slate-600 font-normal ml-2">({user.permissions?.length || 0} active)</span>
          </h2>
          <div className="space-y-5">
            {Object.entries(PERM_GROUPS).map(([group, perms]) => {
              const activePerms = perms.filter(p => user.permissions?.includes(p));
              if (activePerms.length === 0 && !perms.some(p => user.permissions?.includes(p))) return null;
              return (
                <div key={group}>
                  <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2"
                    style={{ fontFamily: 'Syne, sans-serif' }}>{group}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {perms.map(perm => {
                      const has = user.permissions?.includes(perm);
                      return (
                        <div key={perm} className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs transition-all ${
                          has ? 'bg-emerald-500/8 border border-emerald-500/15' : 'bg-slate-800/30 border border-white/[0.04] opacity-40'
                        }`}>
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${has ? 'bg-emerald-500/20' : 'bg-slate-700'}`}>
                            {has ? <Check size={9} className="text-emerald-400" /> : <X size={9} className="text-slate-600" />}
                          </div>
                          <span className={has ? 'text-slate-300' : 'text-slate-600'} style={{ fontFamily: 'DM Sans, sans-serif' }}>
                            {PERMISSION_LABELS[perm] || perm}
                          </span>
                        </div>
                      );
                    })}
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
