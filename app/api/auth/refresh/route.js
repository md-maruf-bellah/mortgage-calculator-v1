import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, Session } from '@/models/auth';
import { verifyRefreshToken, signAccessToken, signRefreshToken, buildAccessCookie, buildRefreshCookie, clearAuthCookies } from '@/lib/auth';
import crypto from 'crypto';

function getRefreshToken(request) {
  const cookie = request.headers.get('cookie') || '';
  const m = cookie.match(/refresh_token=([^;]+)/);
  return m ? m[1] : null;
}

export async function POST(request) {
  try {
    const refreshToken = getRefreshToken(request);
    if (!refreshToken) {
      return NextResponse.json({ success: false, error: 'No refresh token' }, { status: 401 });
    }

    const { valid, payload } = verifyRefreshToken(refreshToken);
    if (!valid || !payload) {
      const res = NextResponse.json({ success: false, error: 'Invalid refresh token' }, { status: 401 });
      clearAuthCookies().forEach(c => res.headers.append('Set-Cookie', c));
      return res;
    }

    await connectDB();

    // Check session in DB
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const session = await Session.findOne({ userId: payload.sub, refreshToken: tokenHash, isRevoked: false });

    if (!session || session.expiresAt < new Date()) {
      const res = NextResponse.json({ success: false, error: 'Session expired or revoked' }, { status: 401 });
      clearAuthCookies().forEach(c => res.headers.append('Set-Cookie', c));
      return res;
    }

    const user = await User.findById(payload.sub).populate('role');
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: 'User not found or inactive' }, { status: 401 });
    }

    // Rotate tokens
    const newAccessToken = signAccessToken(user, user.role);
    const newRefreshToken = signRefreshToken(user._id);
    const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

    await Session.findByIdAndUpdate(session._id, {
      refreshToken: newHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const response = NextResponse.json({ success: true });
    response.headers.append('Set-Cookie', buildAccessCookie(newAccessToken));
    response.headers.append('Set-Cookie', buildRefreshCookie(newRefreshToken));
    return response;
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
