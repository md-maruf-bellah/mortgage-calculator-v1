'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children, initialUser = null }) {
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(!initialUser);
  const router = useRouter();

  // Fetch current user
  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialUser) fetchMe();
  }, []);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  };

  const register = async (payload) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    setUser(data.user);
    return data.user;
  };

  // Permission helpers
  const hasPermission = (permission) => {
    if (!user?.role?.permissions) return false;
    return user.role.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions) => {
    return permissions.some(p => hasPermission(p));
  };

  const hasAllPermissions = (permissions) => {
    return permissions.every(p => hasPermission(p));
  };

  const isRole = (...roles) => {
    return roles.includes(user?.role?.name);
  };

  const isSuperAdmin = () => isRole('superadmin');
  const isAdmin = () => isRole('superadmin', 'admin');

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      register,
      fetchMe,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      isRole,
      isSuperAdmin,
      isAdmin,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

// Higher-order component for permission guarding
export function withPermission(Component, requiredPermission, FallbackComponent = null) {
  return function PermissionGuard(props) {
    const { hasPermission, loading } = useAuth();
    if (loading) return null;
    if (!hasPermission(requiredPermission)) {
      return FallbackComponent ? <FallbackComponent /> : null;
    }
    return <Component {...props} />;
  };
}
