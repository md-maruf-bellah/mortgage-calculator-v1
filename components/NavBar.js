'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import {
  Home, Calculator, BarChart3, TrendingUp, GitCompare, LayoutDashboard,
  History, ChevronDown, User, LogOut, Settings, Shield, Users,
  Menu, X, Lock, Bell
} from 'lucide-react';

const ROLE_BADGE = {
  super_admin: { label: 'Super Admin', bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/20' },
  admin:       { label: 'Admin',       bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/20' },
  loan_officer:{ label: 'Loan Officer',bg: 'bg-indigo-500/15',text: 'text-indigo-400',border: 'border-indigo-500/20' },
  viewer:      { label: 'Viewer',      bg: 'bg-emerald-500/15',text: 'text-emerald-400',border: 'border-emerald-500/20' },
  guest:       { label: 'Guest',       bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-600/20' },
};

function UserAvatar({ user, size = 'sm' }) {
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ fontFamily: 'Syne, sans-serif' }}>
      {initials}
    </div>
  );
}

export default function NavBar({ activeSection, onSectionChange, onHistoryToggle, showHistory }) {
  const { user, loading, logout, can, canAny, isAdmin, isSuperAdmin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
  };

  const roleBadge = user ? (ROLE_BADGE[user.role] || ROLE_BADGE.viewer) : null;

  const SECTION_TABS = [
    { id: 'calculator',   label: 'Calculator',   icon: Calculator,  perm: 'calculator:view' },
    { id: 'amortization', label: 'Amortization', icon: BarChart3,   perm: 'calculator:view' },
    { id: 'affordability',label: 'Affordability',icon: TrendingUp,  perm: 'calculator:view' },
  ];

  const NAV_LINKS = [
    { href: '/compare',   label: 'Compare',   icon: GitCompare,      perm: 'compare:view' },
    { href: '/dashboard', label: 'Analytics', icon: LayoutDashboard, perm: 'dashboard:view' },
  ];

  return (
    <nav className="sticky top-0 z-40 border-b border-white/[0.06] bg-slate-950/90 backdrop-blur-xl">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Brand */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Home size={17} className="text-white" />
            </div>
            <span className="font-bold text-lg text-white hidden sm:block" style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800 }}>
              MortgageIQ
            </span>
          </Link>
        </div>

        {/* Section tabs (desktop) */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {SECTION_TABS.map(({ id, label, icon: Icon, perm }) => {
            const allowed = !user || can(perm);
            if (!allowed) return null;
            return (
              <button key={id}
                onClick={() => onSectionChange?.(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeSection === id
                    ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
                }`} style={{ fontFamily: 'Syne, sans-serif' }}>
                <Icon size={14} />{label}
              </button>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            <div className="w-px h-5 bg-white/10 mx-1" />
            {NAV_LINKS.map(({ href, label, icon: Icon, perm }) => {
              const allowed = !user || can(perm);
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all font-semibold ${
                    !allowed
                      ? 'text-slate-700 cursor-not-allowed pointer-events-none'
                      : pathname.startsWith(href)
                        ? 'text-indigo-400 bg-indigo-500/10'
                        : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.05]'
                  }`} style={{ fontFamily: 'Syne, sans-serif' }}>
                  {!allowed ? <Lock size={12} className="opacity-50" /> : <Icon size={14} />}
                  {label}
                </Link>
              );
            })}

            {/* History */}
            {(!user || can('history:view_own')) && (
              <button onClick={onHistoryToggle}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all font-semibold ${
                  showHistory ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.05]'
                }`} style={{ fontFamily: 'Syne, sans-serif' }}>
                <History size={14} />History
              </button>
            )}

            {/* Admin link */}
            {isAdmin && (
              <>
                <div className="w-px h-5 bg-white/10 mx-1" />
                <Link href="/admin"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    pathname.startsWith('/admin')
                      ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                      : 'text-slate-500 hover:text-amber-400 hover:bg-amber-500/10'
                  }`} style={{ fontFamily: 'Syne, sans-serif' }}>
                  <Shield size={14} />Admin
                </Link>
              </>
            )}
          </div>

          {/* Auth section */}
          {loading ? (
            <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin ml-2" />
          ) : user ? (
            /* User dropdown */
            <div className="relative ml-2" ref={dropRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-white/[0.06] transition-all border border-transparent hover:border-white/[0.08]"
              >
                <UserAvatar user={user} />
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-300 leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
                    {user.name}
                  </p>
                  {roleBadge && (
                    <span className={`text-[10px] font-bold ${roleBadge.text}`} style={{ fontFamily: 'Syne, sans-serif' }}>
                      {roleBadge.label}
                    </span>
                  )}
                </div>
                <ChevronDown size={13} className={`text-slate-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl overflow-hidden shadow-2xl border border-white/[0.08] bg-slate-900 z-50 animate-slide-up">
                  {/* User info header */}
                  <div className="p-4 border-b border-white/[0.06] bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={user} size="lg" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-100 truncate" style={{ fontFamily: 'Syne, sans-serif' }}>
                          {user.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        {roleBadge && (
                          <span className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${roleBadge.bg} ${roleBadge.text} border ${roleBadge.border}`}>
                            {roleBadge.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="p-2">
                    <Link href="/profile" onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] transition-all">
                      <User size={15} /><span style={{ fontFamily: 'Syne, sans-serif' }}>My Profile</span>
                    </Link>

                    {can('dashboard:view') && (
                      <Link href="/dashboard" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] transition-all">
                        <LayoutDashboard size={15} /><span style={{ fontFamily: 'Syne, sans-serif' }}>Analytics</span>
                      </Link>
                    )}

                    {isAdmin && (
                      <>
                        <div className="my-1 border-t border-white/[0.06]" />
                        <Link href="/admin" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-amber-400 hover:bg-amber-500/10 transition-all">
                          <Shield size={15} /><span style={{ fontFamily: 'Syne, sans-serif' }}>Admin Panel</span>
                        </Link>
                        {can('users:view') && (
                          <Link href="/admin/users" onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] transition-all">
                            <Users size={15} /><span style={{ fontFamily: 'Syne, sans-serif' }}>Manage Users</span>
                          </Link>
                        )}
                      </>
                    )}

                    <div className="my-1 border-t border-white/[0.06]" />
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all">
                      <LogOut size={15} /><span style={{ fontFamily: 'Syne, sans-serif' }}>Sign Out</span>
                    </button>
                  </div>

                  {/* Permission count */}
                  <div className="px-4 py-2.5 border-t border-white/[0.06] bg-slate-800/30">
                    <p className="text-[10px] text-slate-600">
                      {user.permissions?.length || 0} permissions active
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Not logged in */
            <div className="flex items-center gap-2 ml-2">
              <Link href="/login" className="btn-secondary py-2 px-4 text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
                Sign In
              </Link>
              <Link href="/register" className="btn-primary py-2 px-4 text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
                Register
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden ml-2 p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-all">
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/[0.06] bg-slate-950/95 backdrop-blur-xl p-4 space-y-1 animate-slide-up">
          {SECTION_TABS.filter(t => !user || can(t.perm)).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { onSectionChange?.(id); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeSection === id ? 'bg-indigo-500/15 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`} style={{ fontFamily: 'Syne, sans-serif' }}>
              <Icon size={15} />{label}
            </button>
          ))}
          {NAV_LINKS.filter(l => !user || can(l.perm)).map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-all"
              style={{ fontFamily: 'Syne, sans-serif' }}>
              <Icon size={15} />{label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-amber-400 hover:bg-amber-500/10 transition-all"
              style={{ fontFamily: 'Syne, sans-serif' }}>
              <Shield size={15} />Admin Panel
            </Link>
          )}
          {!user && (
            <>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm text-indigo-400 font-semibold" style={{ fontFamily: 'Syne, sans-serif' }}>Sign In</Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm text-emerald-400 font-semibold" style={{ fontFamily: 'Syne, sans-serif' }}>Create Account</Link>
            </>
          )}
          {user && (
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all" style={{ fontFamily: 'Syne, sans-serif' }}>
              <LogOut size={15} />Sign Out
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
