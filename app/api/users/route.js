import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { User, Role } from "@/models/auth";
import { requirePermission, logAudit } from "@/lib/rbac";

export const GET = requirePermission("users:view")(async function (request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const roleFilter = searchParams.get("role") || "";

  const query = {};
  if (search)
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  if (roleFilter) {
    const role = await Role.findOne({ name: roleFilter });
    if (role) query.role = role._id;
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .populate("role", "name displayName color")
      .select("-password -passwordResetToken")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(query),
  ]);

  return NextResponse.json({
    success: true,
    data: users,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

export const POST = requirePermission("users:create")(async function (request) {
  await connectDB();
  const {
    name,
    email,
    password,
    roleName,
    extraPermissions,
    deniedPermissions,
  } = await request.json();

  if (!name || !email || !password || !roleName) {
    return NextResponse.json(
      { success: false, error: "name, email, password, roleName required" },
      { status: 400 },
    );
  }

  const role = await Role.findOne({ name: roleName });
  if (!role)
    return NextResponse.json(
      { success: false, error: `Role '${roleName}' not found` },
      { status: 404 },
    );

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing)
    return NextResponse.json(
      { success: false, error: "Email already in use" },
      { status: 409 },
    );

  const user = await User.create({
    name,
    email,
    password,
    role: role._id,
    extraPermissions: extraPermissions || [],
    deniedPermissions: deniedPermissions || [],
    createdBy: request.user?.sub,
  });
  await logAudit({
    user: request.user,
    action: "user.create",
    category: "user",
    details: { targetEmail: email, role: roleName },
    request,
  });
  return NextResponse.json(
    { success: true, data: { id: user._id, name, email, role: roleName } },
    { status: 201 },
  );
});

export const PUT = requirePermission("users:edit")(async function (request) {
  await connectDB();
  const {
    id,
    name,
    email,
    roleName,
    isActive,
    extraPermissions,
    deniedPermissions,
    password,
  } = await request.json();

  console.log("id", id);

  if (!id)
    return NextResponse.json(
      { success: false, error: "User ID required" },
      { status: 400 },
    );
  const user = await User.findById(id).populate("role");
  if (!user)
    return NextResponse.json(
      { success: false, error: "User not found" },
      { status: 404 },
    );

  if (name) user.name = name;
  if (email) user.email = email.toLowerCase();
  if (isActive !== undefined) user.isActive = isActive;
  if (extraPermissions) user.extraPermissions = extraPermissions;
  if (deniedPermissions) user.deniedPermissions = deniedPermissions;
  if (password && password.length >= 8) user.password = password;
  if (roleName) {
    const role = await Role.findOne({ name: roleName });
    if (!role)
      return NextResponse.json(
        { success: false, error: `Role '${roleName}' not found` },
        { status: 404 },
      );
    user.role = role._id;
  }

  await user.save();
  const updated = await User.findById(id)
    .populate("role", "name displayName color")
    .select("-password");
  await logAudit({
    user: request.user,
    action: "user.update",
    category: "user",
    details: { targetId: id },
    request,
  });
  return NextResponse.json({ success: true, data: updated });
});

export const DELETE = requirePermission("users:delete")(
  async function (request) {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id)
      return NextResponse.json(
        { success: false, error: "User ID required" },
        { status: 400 },
      );
    if (id === request.user?.sub)
      return NextResponse.json(
        { success: false, error: "Cannot delete yourself" },
        { status: 400 },
      );

    const user = await User.findById(id).populate("role");
    if (!user)
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );

    await User.findByIdAndDelete(id);
    await logAudit({
      user: request.user,
      action: "user.delete",
      category: "user",
      severity: "warning",
      details: { targetEmail: user.email },
      request,
    });
    return NextResponse.json({ success: true });
  },
);
