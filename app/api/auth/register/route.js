import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, Role } from '@/models/auth';
import { signAccessToken, signRefreshToken, buildAccessCookie, buildRefreshCookie } from '@/lib/auth';
import { logAudit } from '@/lib/rbac';
import crypto from 'crypto';
import { Session } from '@/models/auth';

export async function POST(request) {
  try {
    await connectDB();
    const { name, email, password, confirmPassword } = await request.json();

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: 'Name, email and password are required' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ success: false, error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json({ success: false, error: 'Passwords do not match' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'Invalid email address' }, { status: 400 });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ success: false, error: 'An account with this email already exists' }, { status: 409 });
    }

    // First user ever → super_admin; otherwise → viewer
    const userCount = await User.countDocuments();
    const roleName = userCount === 0 ? 'super_admin' : 'viewer';
    let role = await Role.findOne({ name: roleName });

    // Auto-seed roles if not found (fresh install)
    if (!role) {
      const { ROLE_PERMISSION_PRESETS } = await import('@/models/auth');
      const roleData = [
        { name: 'super_admin', displayName: 'Super Admin', description: 'Full system access', color: '#ef4444', isSystem: true },
        { name: 'admin', displayName: 'Admin', description: 'Manage users and configuration', color: '#f59e0b', isSystem: true },
        { name: 'loan_officer', displayName: 'Loan Officer', description: 'Full calculator access', color: '#6366f1', isSystem: true },
        { name: 'viewer', displayName: 'Viewer', description: 'Read-only access', color: '#10b981', isSystem: true },
        { name: 'guest', displayName: 'Guest', description: 'Limited calculator access', color: '#64748b', isSystem: true },
      ];
      for (const rd of roleData) {
        const exists = await Role.findOne({ name: rd.name });
        if (!exists) await Role.create({ ...rd, permissions: ROLE_PERMISSION_PRESETS[rd.name] || [] });
      }
      role = await Role.findOne({ name: roleName });
    }

    const user = await User.create({ name, email, password, role: role._id });
    const populatedUser = await User.findById(user._id).populate('role');

    const accessToken = signAccessToken(populatedUser, populatedUser.role);
    const refreshToken = signRefreshToken(user._id);

    await Session.create({
      userId: user._id,
      refreshToken: crypto.createHash('sha256').update(refreshToken).digest('hex'),
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || '',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await logAudit({
      user: { sub: user._id.toString(), email: user.email, name: user.name },
      action: 'user.register',
      category: 'auth',
      details: { role: roleName },
      request,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: populatedUser.role.name,
        permissions: populatedUser.role.permissions,
        avatar: user.avatar,
      },
    }, { status: 201 });

    response.headers.append('Set-Cookie', buildAccessCookie(accessToken));
    response.headers.append('Set-Cookie', buildRefreshCookie(refreshToken));
    return response;
  } catch (err) {
    console.error('[Register Error]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
