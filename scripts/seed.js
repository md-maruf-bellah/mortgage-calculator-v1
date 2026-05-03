/**
 * MortgageIQ Database Seed Script
 * Run: node scripts/seed.js
 */
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const crypto = require('crypto');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mortgage-calculator';

const LoanTermSchema = new mongoose.Schema({
  years: { type: Number, required: true, unique: true },
  label: String,
  isActive: { type: Boolean, default: true },
  isDefault: { type: Boolean, default: false },
  order: Number,
}, { timestamps: true });

const RoleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  displayName: String,
  description: String,
  permissions: [String],
  isSystem: { type: Boolean, default: true },
  color: String,
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true },
  password: String,
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  isActive: { type: Boolean, default: true },
  extraPermissions: [String],
  deniedPermissions: [String],
  loginCount: { type: Number, default: 0 },
}, { timestamps: true });

const LoanTerm = mongoose.model('LoanTerm', LoanTermSchema);
const Role     = mongoose.model('Role', RoleSchema);
const User     = mongoose.model('User', UserSchema);

const ALL_PERMISSIONS = [
  'calculator:view','calculator:calculate','calculator:export_pdf','calculator:save_history',
  'loan_terms:view','loan_terms:create','loan_terms:edit','loan_terms:delete',
  'fields:view','fields:create','fields:edit','fields:delete',
  'history:view_own','history:view_all','history:delete_own','history:delete_all',
  'compare:view','dashboard:view','analytics:view_own','analytics:view_all',
  'users:view','users:create','users:edit','users:delete','users:assign_roles',
  'roles:view','roles:create','roles:edit','roles:delete',
  'audit:view',
];

const ROLE_PRESETS = {
  super_admin:  [...ALL_PERMISSIONS],
  admin:        ALL_PERMISSIONS.filter(p => !p.startsWith('roles:')),
  loan_officer: ['calculator:view','calculator:calculate','calculator:export_pdf','calculator:save_history','loan_terms:view','fields:view','history:view_own','history:delete_own','compare:view','dashboard:view','analytics:view_own'],
  viewer:       ['calculator:view','calculator:calculate','loan_terms:view','fields:view','history:view_own','compare:view','dashboard:view'],
  guest:        ['calculator:view','calculator:calculate','loan_terms:view'],
};

const ROLES = [
  { name: 'super_admin',  displayName: 'Super Admin',  description: 'Full system access',               color: '#ef4444' },
  { name: 'admin',        displayName: 'Admin',         description: 'Manage users and configuration',   color: '#f59e0b' },
  { name: 'loan_officer', displayName: 'Loan Officer',  description: 'Full calculator and history access',color: '#6366f1' },
  { name: 'viewer',       displayName: 'Viewer',        description: 'Read-only calculator access',       color: '#10b981' },
  { name: 'guest',        displayName: 'Guest',         description: 'Basic calculation access only',     color: '#64748b' },
];

const DEFAULT_TERMS = [
  { years: 5,  label: '5 Years',  isDefault: false, order: 1 },
  { years: 10, label: '10 Years', isDefault: false, order: 2 },
  { years: 15, label: '15 Years', isDefault: false, order: 3 },
  { years: 20, label: '20 Years', isDefault: false, order: 4 },
  { years: 25, label: '25 Years', isDefault: false, order: 5 },
  { years: 30, label: '30 Years', isDefault: true,  order: 6 },
];

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    console.log('--- Seeding Roles ---');
    for (const rd of ROLES) {
      const exists = await Role.findOne({ name: rd.name });
      if (exists) {
        await Role.findByIdAndUpdate(exists._id, { permissions: ROLE_PRESETS[rd.name], ...rd });
        console.log(`  ↻ Updated: ${rd.displayName}`);
      } else {
        await Role.create({ ...rd, permissions: ROLE_PRESETS[rd.name], isSystem: true });
        console.log(`  + Created: ${rd.displayName}`);
      }
    }

    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@mortgageiq.com';
    const adminPass  = process.env.SEED_ADMIN_PASSWORD || 'Admin@1234';
    const superAdminRole = await Role.findOne({ name: 'super_admin' });

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await User.create({ name: 'Super Admin', email: adminEmail, password: hashPassword(adminPass), role: superAdminRole._id });
      console.log(`\n✓ Demo Admin: ${adminEmail} / ${adminPass}`);
    } else {
      console.log(`\n↻ Admin already exists: ${adminEmail}`);
    }

    console.log('\n--- Seeding Loan Terms ---');
    for (const term of DEFAULT_TERMS) {
      const exists = await LoanTerm.findOne({ years: term.years });
      if (!exists) {
        await LoanTerm.create({ ...term, isActive: true });
        console.log(`  + Created: ${term.label}`);
      } else {
        console.log(`  ↻ Exists:  ${term.label}`);
      }
    }

    console.log('\n✅ Seed complete!\n');
    console.log('┌─────────────────────────────────────────────┐');
    console.log(`│  App:      http://localhost:3000            │`);
    console.log(`│  Admin:    http://localhost:3000/admin      │`);
    console.log(`│  Email:    ${adminEmail.padEnd(32)} │`);
    console.log(`│  Password: ${adminPass.padEnd(32)} │`);
    console.log('└─────────────────────────────────────────────┘\n');

  } catch (err) {
    console.error('\n❌ Seed error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
