// ─── Inputs ───────────────────────────────────────────────────────────────────
export interface MortgageInputs {
  loanAmount: number;
  interestRate: number;
  downPayment: number;
  propertyTaxes: number;
  homeInsurance: number;
  pmi: number;
  hoaFees: number;
  extraMonthlyPayment: number;
  loanTermYears?: number;
}

export interface CustomFieldValue {
  _id: string;
  name: string;
  label: string;
  type: 'currency' | 'percentage' | 'number' | 'text';
  defaultValue: number;
  value?: number;
  frequency: 'monthly' | 'annual' | 'one-time';
  description?: string;
  isActive: boolean;
  order: number;
}

// ─── Calculation Results ───────────────────────────────────────────────────────
export interface AmortizationEntry {
  month: number;
  year: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  totalInterestPaid: number;
}

export interface PaymentBreakdown {
  principal: number;
  tax: number;
  insurance: number;
  pmi: number;
  hoa: number;
  extra: number;
  custom: number;
}

export interface MortgageResult {
  monthlyPayment: number;
  monthlyPI: number;
  monthlyTax: number;
  monthlyInsurance: number;
  monthlyPMI: number;
  monthlyHOA: number;
  customTotal: number;
  principal: number;
  totalInterest: number;
  totalPayment: number;
  totalCost: number;
  schedule: AmortizationEntry[];
  breakdown: PaymentBreakdown;
  loanTermYears?: number;
}

export interface TermResult extends MortgageResult {
  term: number;
}

// ─── DB Models ─────────────────────────────────────────────────────────────────
export interface LoanTermDoc {
  _id: string;
  years: number;
  label: string;
  isActive: boolean;
  isDefault: boolean;
  order: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CalculationHistoryDoc {
  _id: string;
  sessionId: string;
  inputs: MortgageInputs;
  results: {
    monthlyPayment: number;
    totalInterest: number;
    totalPayment: number;
    principal: number;
  };
  name: string;
  notes?: string;
  isFavorite: boolean;
  createdAt: string;
}

// ─── API Responses ─────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ─── Affordability ─────────────────────────────────────────────────────────────
export interface AffordabilityRating {
  rating: 'Excellent' | 'Good' | 'Caution' | 'High Risk';
  color: 'green' | 'blue' | 'yellow' | 'red';
  message: string;
}
