import { NextResponse } from 'next/server';

// Inline JWT verify for edge runtime
function verifyTokenEdge(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

function getToken(request) {
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  const cookie = request.headers.get('cookie') || '';
  const m = cookie.match(/access_token=([^;]+)/);
  return m ? m[1] : null;
}

// Pages that require a logged-in user
const AUTH_REQUIRED_PAGES = ['/compare', '/dashboard', '/admin', '/profile'];

// Pages only accessible to admin roles
const ADMIN_ONLY_PAGES = ['/admin'];

// Public pages (never redirect away from)
const PUBLIC_PAGES = ['/login', '/register', '/unauthorized'];

// API routes that require at minimum authentication
const AUTH_REQUIRED_API = ['/api/users', '/api/roles', '/api/audit-logs', '/api/admin'];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Static assets — skip
  if (pathname.startsWith('/_next') || pathname.includes('.')) return NextResponse.next();

  // Public pages — always allow
  if (PUBLIC_PAGES.some(p => pathname.startsWith(p))) return NextResponse.next();

  // Public API — always allow
  if (pathname.startsWith('/api/auth/')) return NextResponse.next();

  const token = getToken(request);
  const payload = token ? verifyTokenEdge(token) : null;

  // ── Protected Pages ────────────────────────────────────────────
  const isAuthPage = AUTH_REQUIRED_PAGES.some(p => pathname.startsWith(p));
  if (isAuthPage) {
    if (!payload) {
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    const isAdminPage = ADMIN_ONLY_PAGES.some(p => pathname.startsWith(p));
    if (isAdminPage && !['super_admin', 'admin'].includes(payload.role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // ── Protected API (auth required, permission checked inside route) ──
  const isAuthApi = AUTH_REQUIRED_API.some(p => pathname.startsWith(p));
  if (isAuthApi && !payload) {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }

  // ── Attach user info to request headers ────────────────────────
  if (payload) {
    const headers = new Headers(request.headers);
    headers.set('x-user-id', payload.sub || '');
    headers.set('x-user-email', payload.email || '');
    headers.set('x-user-role', payload.role || '');
    headers.set('x-user-name', payload.name || '');
    headers.set('x-user-permissions', JSON.stringify(payload.permissions || []));
    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
