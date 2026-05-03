import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { User, Role } from "@/models/auth";
import { requirePermission, logAudit } from "@/lib/rbac";

export const GET = requirePermission("users:view")(async function (
  request,
  { params },
) {
  try {
    await connectDB();
    const user = await User.findById(params.id)
      .populate("role", "name displayName color permissions")
      .populate("createdBy", "name email")
      .select("-password");
    if (!user)
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    return NextResponse.json({ success: true, data: user });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
});

export const PUT = requirePermission("users:edit")(async function (
  request,
  { params },
) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, email, roleId, isActive, notes, password } = body;

    // Prevent self role/status change
    if (params.id === request.user?.sub) {
      if (roleId !== undefined || isActive !== undefined) {
        return NextResponse.json(
          { success: false, error: "Cannot change your own role or status" },
          { status: 403 },
        );
      }
    }

    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email.toLowerCase();
    if (roleId) updates.role = roleId;
    if (notes !== undefined) updates.notes = notes;
    if (isActive !== undefined) updates.isActive = isActive;

    let user;
    if (password) {
      user = await User.findById(params.id);
      if (!user)
        return NextResponse.json(
          { success: false, error: "Not found" },
          { status: 404 },
        );
      Object.assign(user, updates);
      user.password = password;
      await user.save();
    } else {
      user = await User.findByIdAndUpdate(params.id, updates, { new: true });
      if (!user)
        return NextResponse.json(
          { success: false, error: "Not found" },
          { status: 404 },
        );
    }

    const populated = await User.findById(user._id)
      .populate("role", "name displayName color permissions")
      .select("-password");

    await logAudit({
      user: request.user,
      action: "user.update",
      category: "user",
      details: { userId: params.id, fields: Object.keys(updates) },
      request,
    });

    return NextResponse.json({ success: true, data: populated });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
});

export const DELETE = requirePermission("users:delete")(async function (
  request,
  { params },
) {
  try {
    await connectDB();

    if (params.id === request.user?.sub) {
      return NextResponse.json(
        { success: false, error: "Cannot delete your own account" },
        { status: 403 },
      );
    }

    const user = await User.findById(params.id).populate("role");
    if (!user)
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 },
      );

    if (
      user.role?.name === "super_admin" &&
      request.user?.role !== "super_admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Only super admins can delete super admin accounts",
        },
        { status: 403 },
      );
    }

    await User.findByIdAndDelete(params.id);

    await logAudit({
      user: request.user,
      action: "user.delete",
      category: "user",
      severity: "warning",
      details: { email: user.email, role: user.role?.name },
      request,
    });

    return NextResponse.json({ success: true, message: "User deleted" });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
});
