'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { Home, Eye, EyeOff, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

function PasswordStrength({ password }) {
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'Contains uppercase', ok: /[A-Z]/.test(password) },
    { label: 'Contains number', ok: /[0-9]/.test(password) },
    { label: 'Contains special char', ok: /[^a-zA-Z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['bg-red-500', 'bg-red-400', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-500'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1.5">
        {[0,1,2,3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < score ? colors[score] : 'bg-slate-700'}`} />
        ))}
      </div>
      <p className={`text-xs ${score >= 3 ? 'text-emerald-400' : score >= 2 ? 'text-amber-400' : 'text-red-400'}`}>
        {labels[score]}
      </p>
    </div>
  );
}

export default function RegisterPage() {
  const { register, user, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (!loading && user) router.replace('/'); }, [user, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setSubmitting(true);
    const data = await register(form.name, form.email, form.password);
    if (data.success) { toast.success('Account created! Welcome to MortgageIQ.'); router.replace('/'); }
    else setError(data.error || 'Registration failed');
    setSubmitting(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-emerald-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
              <Home size={22} className="text-white" />
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>MortgageIQ</div>
              <div className="text-xs text-slate-500">Smart Mortgage Calculator</div>
            </div>
          </div>
          <h1 className="text-xl font-bold text-slate-200" style={{ fontFamily: 'Syne, sans-serif' }}>Create your account</h1>
          <p className="text-sm text-slate-500 mt-1">Get started with MortgageIQ</p>
        </div>
        <div className="glass-card p-8">
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">Full Name</label>
              <input type="text" className="input-field" placeholder="John Smith" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div>
              <label className="input-label">Email Address</label>
              <input type="email" className="input-field" placeholder="you@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required autoComplete="email" />
            </div>
            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input-field pr-12" placeholder="Min. 8 characters" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
            </div>
            <div>
              <label className="input-label">Confirm Password</label>
              <div className="relative">
                <input type="password" className="input-field pr-10" placeholder="Re-enter password" value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} required />
                {form.confirmPassword && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {form.password === form.confirmPassword
                      ? <CheckCircle size={16} className="text-emerald-400" />
                      : <AlertCircle size={16} className="text-red-400" />}
                  </span>
                )}
              </div>
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserPlus size={16} />}
              {submitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <div className="mt-6 pt-6 border-t border-white/[0.06] text-center">
            <p className="text-sm text-slate-500">Already have an account?{' '}
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
