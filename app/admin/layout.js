'use client';
import { useAuth } from '@/components/auth/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Users, Shield, Activity, LayoutDashboard, Home, ChevronRight } from 'lucide-react';

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/roles', label: 'Roles & Permissions', icon: Shield },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: Activity },
];

export default function AdminLayout({ children }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace('/login?redirect=/admin');
    if (!loading && user && !isAdmin) router.replace('/unauthorized');
  }, [user, loading, isAdmin]);

  if (loading || !user || !isAdmin) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 flex-shrink-0 bg-slate-900/80 border-r border-white/[0.06] flex flex-col sticky top-0 h-screen">
        <div className="p-5 border-b border-white/[0.06]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
              <Home size={15} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>MortgageIQ</div>
              <div className="text-[10px] text-slate-500">Admin Panel</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider px-3 mb-3">Management</p>
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${active ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]'}`} style={{ fontFamily: 'Syne, sans-serif' }}>
                <Icon size={15} />{label}
                {active && <ChevronRight size={12} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm font-bold">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-300 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-600">{user.role}</p>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-auto">{children}</main>
    </div>
  );
}
