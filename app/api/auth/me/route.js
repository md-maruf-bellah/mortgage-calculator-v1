import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/rbac';
import connectDB from '@/lib/db';
import { User } from '@/models/auth';

export async function GET(request) {
  try {
    const tokenUser = await getAuthUser(request);
    if (!tokenUser) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(tokenUser.sub).populate('role').select('-password -refreshTokens -passwordResetToken');

    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: 'User not found or inactive' }, { status: 404 });
    }

    const permissions = [
      ...new Set([...(user.role?.permissions || []), ...(user.extraPermissions || [])])
    ].filter(p => !(user.deniedPermissions || []).includes(p));

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role?.name,
        roleId: user.role?._id,
        roleDisplayName: user.role?.displayName,
        roleColor: user.role?.color,
        permissions,
        extraPermissions: user.extraPermissions,
        deniedPermissions: user.deniedPermissions,
        lastLogin: user.lastLogin,
        loginCount: user.loginCount,
        createdAt: user.createdAt,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// Update own profile
export async function PUT(request) {
  try {
    const tokenUser = await getAuthUser(request);
    if (!tokenUser) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { name, avatar, currentPassword, newPassword } = body;

    const user = await User.findById(tokenUser.sub);
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ success: false, error: 'Current password required' }, { status: 400 });
      }
      if (!user.checkPassword(currentPassword)) {
        return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status: 400 });
      }
      if (newPassword.length < 8) {
        return NextResponse.json({ success: false, error: 'New password must be at least 8 characters' }, { status: 400 });
      }
      user.password = newPassword;
    }

    await user.save();
    return NextResponse.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
