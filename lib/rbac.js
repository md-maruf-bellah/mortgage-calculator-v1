import { NextResponse } from 'next/server';
import { verifyAccessToken, extractToken } from './auth';
import connectDB from './db';
import { AuditLog } from '@/models/auth';

/**
 * Get authenticated user from request.
 * Prefers middleware-set headers (already verified) over re-verifying token.
 */
export async function getAuthUser(request) {
  // Fast path: middleware already verified and attached headers
  const userId = request.headers.get('x-user-id');
  const role   = request.headers.get('x-user-role');
  if (userId && role) {
    let permissions = [];
    try { permissions = JSON.parse(request.headers.get('x-user-permissions') || '[]'); } catch {}
    return {
      sub:         userId,
      email:       request.headers.get('x-user-email') || '',
      name:        request.headers.get('x-user-name')  || '',
      role,
      permissions,
    };
  }
  // Fallback: verify token directly (dev/test or non-middleware path)
  const token = extractToken(request);
  if (!token) return null;
  const { valid, payload } = verifyAccessToken(token);
  return valid ? payload : null;
}

/** Middleware: require any authenticated user */
export function requireAuth(handler) {
  return async function (request, context) {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    request.user = user;
    return handler(request, context);
  };
}

/**
 * Middleware: require specific permission(s).
 * requirePermission('users:view') — single
 * requirePermission(['users:view','users:edit']) — needs ALL
 */
export function requirePermission(permissions) {
  const required = Array.isArray(permissions) ? permissions : [permissions];
  return function (handler) {
    return async function (request, context) {
      const user = await getAuthUser(request);
      if (!user) {
        return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
      }
      const userPerms = new Set(user.permissions || []);
      const missing = required.filter(p => !userPerms.has(p));
      if (missing.length > 0) {
        await logAudit({
          user, action: 'permission.denied', category: 'auth', severity: 'warning',
          details: { required, missing }, success: false, request,
        }).catch(() => {});
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions', required: missing },
          { status: 403 }
        );
      }
      request.user = user;
      return handler(request, context);
    };
  };
}

/** Middleware: require specific role(s) */
export function requireRole(roles) {
  const required = Array.isArray(roles) ? roles : [roles];
  return function (handler) {
    return async function (request, context) {
      const user = await getAuthUser(request);
      if (!user) {
        return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
      }
      if (!required.includes(user.role)) {
        return NextResponse.json(
          { success: false, error: `Role required: ${required.join(' or ')}` },
          { status: 403 }
        );
      }
      request.user = user;
      return handler(request, context);
    };
  };
}

/** Client-side helpers */
export const hasPermission    = (user, p)    => user?.permissions?.includes(p) ?? false;
export const hasAnyPermission = (user, perms) => perms.some(p => user?.permissions?.includes(p));
export const hasAllPermissions= (user, perms) => perms.every(p => user?.permissions?.includes(p));

/** Write an audit log entry */
export async function logAudit({ user, action, category, severity = 'info', details, success = true, errorMessage, request }) {
  try {
    await connectDB();
    await AuditLog.create({
      user:         user?.sub  || null,
      userEmail:    user?.email || 'anonymous',
      userName:     user?.name  || 'anonymous',
      action, category, severity, details, success, errorMessage,
      ip: request?.headers?.get('x-forwarded-for')?.split(',')[0].trim()
        || request?.headers?.get('x-real-ip') || 'unknown',
      userAgent: request?.headers?.get('user-agent') || '',
    });
  } catch (e) {
    console.error('[AuditLog Error]', e.message);
  }
}

export function getClientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') || 'unknown'
  );
}
