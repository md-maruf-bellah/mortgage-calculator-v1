'use client';
import { useAuth } from './AuthContext';

export default function PermissionGate({ permission, permissions, role, roles, requireAll = false, fallback = null, children }) {
  const { user, can, canAny, hasRole } = useAuth();
  if (!user) return fallback;
  if (role || roles) { const r = roles || [role]; if (!hasRole(r)) return fallback; }
  if (permission && !can(permission)) return fallback;
  if (permissions) {
    const allowed = requireAll ? permissions.every(p => can(p)) : canAny(permissions);
    if (!allowed) return fallback;
  }
  return children;
}
