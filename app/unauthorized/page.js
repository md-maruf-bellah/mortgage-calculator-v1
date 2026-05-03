'use client';
import Link from 'next/link';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';

export default function UnauthorizedPage() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-red-500/15 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <ShieldX size={36} className="text-red-400" />
        </div>
        <h1 className="text-3xl font-bold text-slate-100 mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>Access Denied</h1>
        <p className="text-slate-400 mb-2">You don&apos;t have permission to view this page.</p>
        {user && (
          <p className="text-sm text-slate-600 mb-8">
            Signed in as <span className="text-slate-400">{user.email}</span> with role{' '}
            <span className="text-indigo-400 font-semibold">{user.roleDisplayName || user.role}</span>
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <Link href="/" className="btn-primary flex items-center gap-2 py-2.5 px-5 text-sm">
            <Home size={15} /> Go Home
          </Link>
          <button onClick={() => window.history.back()} className="btn-secondary flex items-center gap-2 py-2.5 px-5 text-sm">
            <ArrowLeft size={15} /> Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
