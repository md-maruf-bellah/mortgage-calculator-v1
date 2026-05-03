import mongoose from 'mongoose';

// ─── Custom Field Schema ───────────────────────────────────────────────────────
const CustomFieldSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['number', 'text', 'percentage', 'currency'],
      default: 'number',
    },
    defaultValue: { type: Number, default: 0 },
    frequency: {
      type: String,
      enum: ['monthly', 'annual', 'one-time'],
      default: 'monthly',
    },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ─── Loan Term Schema ──────────────────────────────────────────────────────────
const LoanTermSchema = new mongoose.Schema(
  {
    years: { type: Number, required: true, unique: true },
    label: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

// ─── Calculation History Schema ────────────────────────────────────────────────
const CalculationHistorySchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    inputs: {
      loanAmount: Number,
      interestRate: Number,
      downPayment: Number,
      propertyTaxes: Number,
      homeInsurance: Number,
      pmi: Number,
      hoaFees: Number,
      extraMonthlyPayment: Number,
      loanTermYears: Number,
    },
    results: {
      monthlyPayment: Number,
      totalInterest: Number,
      totalPayment: Number,
      principal: Number,
    },
    name: { type: String, default: 'Untitled Calculation' },
    notes: { type: String, default: '' },
    isFavorite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ─── App Settings Schema ───────────────────────────────────────────────────────
const AppSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: mongoose.Schema.Types.Mixed,
    description: { type: String },
  },
  { timestamps: true }
);

// ─── Export Models ─────────────────────────────────────────────────────────────
export const CustomField =
  mongoose.models.CustomField || mongoose.model('CustomField', CustomFieldSchema);

export const LoanTerm =
  mongoose.models.LoanTerm || mongoose.model('LoanTerm', LoanTermSchema);

export const CalculationHistory =
  mongoose.models.CalculationHistory ||
  mongoose.model('CalculationHistory', CalculationHistorySchema);

export const AppSettings =
  mongoose.models.AppSettings || mongoose.model('AppSettings', AppSettingsSchema);
