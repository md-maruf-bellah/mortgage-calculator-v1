'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setUser(res.ok && data.success ? data.user : null);
    } catch { setUser(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMe(); }, []);

  const login = useCallback(async (email, password) => {
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const data = await res.json();
    if (data.success) setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) });
    const data = await res.json();
    if (data.success) setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/login';
  }, []);

  const can = useCallback((permission) => user?.permissions?.includes(permission) ?? false, [user]);
  const canAny = useCallback((perms) => perms.some(p => user?.permissions?.includes(p)), [user]);
  const hasRole = useCallback((r) => { const roles = Array.isArray(r) ? r : [r]; return roles.includes(user?.role); }, [user]);

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout,
      can, canAny, hasRole,
      isAdmin: ['super_admin', 'admin'].includes(user?.role),
      isSuperAdmin: user?.role === 'super_admin',
      refetch: fetchMe,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
