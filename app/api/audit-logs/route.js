import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { AuditLog } from '@/models/auth';
import { requirePermission } from '@/lib/rbac';

export const GET = requirePermission('audit:view')(async function (request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const category = searchParams.get('category') || '';
  const severity = searchParams.get('severity') || '';
  const userId = searchParams.get('userId') || '';
  const search = searchParams.get('search') || '';
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const query = {};
  if (category) query.category = category;
  if (severity) query.severity = severity;
  if (userId) query.user = userId;
  if (search) query.$or = [
    { action: { $regex: search, $options: 'i' } },
    { userEmail: { $regex: search, $options: 'i' } },
  ];
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    AuditLog.countDocuments(query),
  ]);

  return NextResponse.json({ success: true, data: logs, total, page, pages: Math.ceil(total / limit) });
});
