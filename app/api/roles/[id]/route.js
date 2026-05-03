import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Role, User } from '@/models/auth';
import { requirePermission, logAudit } from '@/lib/rbac';

export const GET = requirePermission('roles:view')(async function (request, { params }) {
  try {
    await connectDB();
    const role = await Role.findById(params.id);
    if (!role) return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 });
    const userCount = await User.countDocuments({ role: params.id });
    return NextResponse.json({ success: true, data: { ...role.toObject(), userCount } });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
});

export const PUT = requirePermission('roles:edit')(async function (request, { params }) {
  try {
    await connectDB();
    const { displayName, description, permissions, color } = await request.json();
    const role = await Role.findById(params.id);
    if (!role) return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 });
    if (displayName) role.displayName = displayName;
    if (description !== undefined) role.description = description;
    if (permissions) role.permissions = permissions;
    if (color) role.color = color;
    await role.save();
    await logAudit({ user: request.user, action: 'role.update', category: 'role', details: { roleId: params.id, roleName: role.name }, request });
    return NextResponse.json({ success: true, data: role });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
});

export const DELETE = requirePermission('roles:delete')(async function (request, { params }) {
  try {
    await connectDB();
    const role = await Role.findById(params.id);
    if (!role) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    if (role.isSystem) return NextResponse.json({ success: false, error: 'Cannot delete system roles' }, { status: 400 });
    const count = await User.countDocuments({ role: params.id });
    if (count > 0) return NextResponse.json({ success: false, error: `${count} user(s) assigned this role. Reassign them first.` }, { status: 400 });
    await Role.findByIdAndDelete(params.id);
    await logAudit({ user: request.user, action: 'role.delete', category: 'role', severity: 'warning', details: { roleName: role.name }, request });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
});
