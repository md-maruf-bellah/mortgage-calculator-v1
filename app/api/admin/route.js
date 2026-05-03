import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, Role, AuditLog, Session } from '@/models/auth';
import { requirePermission } from '@/lib/rbac';

export const GET = requirePermission('users:view')(async function (request) {
  try {
    await connectDB();

    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const last7d  = new Date(now - 7  * 24 * 60 * 60 * 1000);
    const last30d = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      totalRoles,
      logins24h,
      failedLogins24h,
      criticalLogs7d,
      recentUsers,
      roleBreakdown,
      activityByDay,
      activeSessions,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Role.countDocuments(),
      AuditLog.countDocuments({ action: 'user.login', success: true, createdAt: { $gte: last24h } }),
      AuditLog.countDocuments({ action: 'user.login.failed', createdAt: { $gte: last24h } }),
      AuditLog.countDocuments({ severity: 'critical', createdAt: { $gte: last7d } }),
      User.find({}).populate('role', 'name displayName color').sort({ createdAt: -1 }).limit(5).select('name email isActive lastLogin createdAt role'),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $lookup: { from: 'roles', localField: '_id', foreignField: '_id', as: 'roleInfo' } },
        { $unwind: '$roleInfo' },
        { $project: { name: '$roleInfo.name', displayName: '$roleInfo.displayName', color: '$roleInfo.color', count: 1 } },
      ]),
      AuditLog.aggregate([
        { $match: { createdAt: { $gte: last7d } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            total: { $sum: 1 },
            logins: { $sum: { $cond: [{ $eq: ['$action', 'user.login'] }, 1, 0] } },
            warnings: { $sum: { $cond: [{ $eq: ['$severity', 'warning'] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Session.countDocuments({ isRevoked: false, expiresAt: { $gt: now } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users: { total: totalUsers, active: activeUsers, inactive: totalUsers - activeUsers },
        roles: { total: totalRoles },
        auth: { logins24h, failedLogins24h, activeSessions },
        security: { criticalLogs7d },
        recentUsers,
        roleBreakdown,
        activityByDay,
      },
    });
  } catch (err) {
    console.error('[Admin Stats Error]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
});
