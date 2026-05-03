import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, Session } from '@/models/auth';
import { signAccessToken, signRefreshToken, buildAccessCookie, buildRefreshCookie } from '@/lib/auth';
import { logAudit, getClientIp } from '@/lib/rbac';
import crypto from 'crypto';

export async function POST(request) {
  try {
    await connectDB();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password required' }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).populate('role');

    if (!user || !user.checkPassword(password)) {
      await logAudit({
        user: { sub: null, email, name: 'unknown' },
        action: 'user.login.failed',
        category: 'auth',
        severity: 'warning',
        details: { email },
        success: false,
        errorMessage: 'Invalid credentials',
        request,
      });
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ success: false, error: 'Account is disabled. Contact your administrator.' }, { status: 403 });
    }

    const ip = getClientIp(request);
    const accessToken = signAccessToken(user, user.role);
    const refreshToken = signRefreshToken(user._id);

    // Save refresh session
    await Session.create({
      userId: user._id,
      refreshToken: crypto.createHash('sha256').update(refreshToken).digest('hex'),
      ip,
      userAgent: request.headers.get('user-agent') || '',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Update last login
    await User.findByIdAndUpdate(user._id, {
      lastLogin: new Date(),
      lastLoginIp: ip,
      $inc: { loginCount: 1 },
    });

    await logAudit({
      user: { sub: user._id.toString(), email: user.email, name: user.name },
      action: 'user.login',
      category: 'auth',
      severity: 'info',
      details: { ip, role: user.role.name },
      success: true,
      request,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        roleId: user.role._id,
        permissions: [...new Set([...(user.role.permissions || []), ...(user.extraPermissions || [])])].filter(p => !(user.deniedPermissions || []).includes(p)),
        avatar: user.avatar,
        lastLogin: user.lastLogin,
      },
    });

    response.headers.append('Set-Cookie', buildAccessCookie(accessToken));
    response.headers.append('Set-Cookie', buildRefreshCookie(refreshToken));
    return response;
  } catch (err) {
    console.error('[Login Error]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
