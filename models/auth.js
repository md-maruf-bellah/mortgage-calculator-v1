import mongoose from 'mongoose';
import crypto from 'crypto';

// ─── All available permissions ─────────────────────────────────────────────────
export const ALL_PERMISSIONS = [
  // Calculator
  'calculator:view', 'calculator:calculate', 'calculator:export_pdf',
  // Loan Terms
  'loan_terms:view', 'loan_terms:create', 'loan_terms:edit', 'loan_terms:delete',
  // Custom Fields
  'fields:view', 'fields:create', 'fields:edit', 'fields:delete',
  // History
  'history:view_own', 'history:view_all', 'history:delete_own', 'history:delete_all',
  // Pages
  'compare:view', 'dashboard:view', 'analytics:view_own', 'analytics:view_all',
  // User Management
  'users:view', 'users:create', 'users:edit', 'users:delete', 'users:assign_roles',
  // Role Management (Super Admin only)
  'roles:view', 'roles:create', 'roles:edit', 'roles:delete',
  // Audit
  'audit:view',
];

export const ROLE_PERMISSION_PRESETS = {
  super_admin: [...ALL_PERMISSIONS],
  admin: ALL_PERMISSIONS.filter(p => !p.startsWith('roles:')),
  loan_officer: [
    'calculator:view', 'calculator:calculate', 'calculator:export_pdf',
    'loan_terms:view', 'fields:view',
    'history:view_own', 'history:delete_own',
    'compare:view', 'dashboard:view', 'analytics:view_own',
  ],
  viewer: [
    'calculator:view', 'calculator:calculate',
    'loan_terms:view', 'fields:view',
    'history:view_own', 'compare:view', 'dashboard:view',
  ],
  guest: ['calculator:view', 'calculator:calculate', 'loan_terms:view'],
};

// ─── Role ──────────────────────────────────────────────────────────────────────
const RoleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  displayName: { type: String, required: true },
  description: { type: String, default: '' },
  permissions: [{ type: String }],
  isSystem: { type: Boolean, default: false },
  color: { type: String, default: '#6366f1' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// ─── User ──────────────────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  extraPermissions: [{ type: String }],
  deniedPermissions: [{ type: String }],
  avatar: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  lastLoginIp: { type: String },
  loginCount: { type: Number, default: 0 },
  passwordChangedAt: { type: Date },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const { pbkdf2Sync, randomBytes } = crypto;
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(this.password, salt, 100000, 64, 'sha512').toString('hex');
  this.password = `${salt}:${hash}`;
  this.passwordChangedAt = new Date();
  next();
});

UserSchema.methods.checkPassword = function (candidate) {
  const [salt, hash] = this.password.split(':');
  const candidateHash = crypto.pbkdf2Sync(candidate, salt, 100000, 64, 'sha512').toString('hex');
  return candidateHash === hash;
};

// ─── Audit Log ─────────────────────────────────────────────────────────────────
const AuditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userEmail: { type: String },
  userName: { type: String },
  action: { type: String, required: true },
  category: {
    type: String,
    enum: ['auth', 'user', 'role', 'calculation', 'admin', 'field', 'loan_term'],
    required: true,
  },
  severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
  details: { type: mongoose.Schema.Types.Mixed },
  ip: { type: String },
  userAgent: { type: String },
  success: { type: Boolean, default: true },
  errorMessage: { type: String },
}, { timestamps: true });

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ user: 1, createdAt: -1 });

// ─── Session ───────────────────────────────────────────────────────────────────
const SessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  refreshToken: { type: String, required: true, unique: true },
  ip: { type: String },
  userAgent: { type: String },
  expiresAt: { type: Date, required: true },
  isRevoked: { type: Boolean, default: false },
}, { timestamps: true });

SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ─── Exports ───────────────────────────────────────────────────────────────────
export const Role = mongoose.models.Role || mongoose.model('Role', RoleSchema);
export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
export const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);
