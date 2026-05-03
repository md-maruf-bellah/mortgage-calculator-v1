import { NextResponse } from 'next/server';
import { clearAuthCookies } from '@/lib/auth';
import { getAuthUser, logAudit } from '@/lib/rbac';
import connectDB from '@/lib/db';
import { Session } from '@/models/auth';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const user = await getAuthUser(request);

    // Revoke all sessions for this user
    if (user) {
      await connectDB();
      await Session.updateMany({ userId: user.sub, isRevoked: false }, { isRevoked: true });
      await logAudit({ user, action: 'user.logout', category: 'auth', request });
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    clearAuthCookies().forEach(c => response.headers.append('Set-Cookie', c));
    return response;
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
