import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Role, User } from '@/models/auth';
import { requirePermission, logAudit } from '@/lib/rbac';

export const GET = requirePermission('roles:view')(async function (request) {
  await connectDB();
  const roles = await Role.find({}).sort({ isSystem: -1, name: 1 });
  // Attach user counts
  const counts = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);
  const countMap = Object.fromEntries(counts.map(c => [c._id.toString(), c.count]));
  const data = roles.map(r => ({ ...r.toObject(), userCount: countMap[r._id.toString()] || 0 }));
  return NextResponse.json({ success: true, data });
});

export const POST = requirePermission('roles:create')(async function (request) {
  await connectDB();
  const { name, displayName, description, permissions, color } = await request.json();

  if (!name || !displayName) return NextResponse.json({ success: false, error: 'name and displayName required' }, { status: 400 });

  const exists = await Role.findOne({ name });
  if (exists) return NextResponse.json({ success: false, error: 'Role name already taken' }, { status: 409 });

  const role = await Role.create({ name, displayName, description, permissions: permissions || [], color: color || '#6366f1', isSystem: false, createdBy: request.user?.sub });
  await logAudit({ user: request.user, action: 'role.create', category: 'role', details: { roleName: name, permissions }, request });
  return NextResponse.json({ success: true, data: role }, { status: 201 });
});

export const PUT = requirePermission('roles:edit')(async function (request) {
  await connectDB();
  const { id, displayName, description, permissions, color } = await request.json();

  if (!id) return NextResponse.json({ success: false, error: 'Role ID required' }, { status: 400 });
  const role = await Role.findById(id);
  if (!role) return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 });

  if (displayName) role.displayName = displayName;
  if (description !== undefined) role.description = description;
  if (permissions) role.permissions = permissions;
  if (color) role.color = color;
  await role.save();

  await logAudit({ user: request.user, action: 'role.update', category: 'role', details: { roleId: id, roleName: role.name }, request });
  return NextResponse.json({ success: true, data: role });
});

export const DELETE = requirePermission('roles:delete')(async function (request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ success: false, error: 'Role ID required' }, { status: 400 });
  const role = await Role.findById(id);
  if (!role) return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 });
  if (role.isSystem) return NextResponse.json({ success: false, error: 'System roles cannot be deleted' }, { status: 400 });

  const usersWithRole = await User.countDocuments({ role: id });
  if (usersWithRole > 0) return NextResponse.json({ success: false, error: `${usersWithRole} users have this role. Reassign them first.` }, { status: 400 });

  await Role.findByIdAndDelete(id);
  await logAudit({ user: request.user, action: 'role.delete', category: 'role', severity: 'warning', details: { roleName: role.name }, request });
  return NextResponse.json({ success: true });
});
