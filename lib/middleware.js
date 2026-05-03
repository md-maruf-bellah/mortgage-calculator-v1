import { NextResponse } from 'next/server';

/**
 * Wraps an API route handler with consistent error handling
 */
export function withErrorHandler(handler) {
  return async function (request, context) {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error(`[API Error] ${request.method} ${request.url}:`, error);

      if (error.name === 'ValidationError') {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: error.errors },
          { status: 422 }
        );
      }

      if (error.code === 11000) {
        return NextResponse.json(
          { success: false, error: 'Duplicate entry — this record already exists' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { success: false, error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Validates mortgage input parameters
 */
export function validateMortgageInputs(inputs) {
  const errors = [];

  if (!inputs.loanAmount || inputs.loanAmount <= 0) {
    errors.push('Loan amount must be greater than 0');
  }
  if (!inputs.interestRate || inputs.interestRate <= 0 || inputs.interestRate > 30) {
    errors.push('Interest rate must be between 0 and 30%');
  }
  if (inputs.downPayment < 0) {
    errors.push('Down payment cannot be negative');
  }
  if (inputs.downPayment >= inputs.loanAmount) {
    errors.push('Down payment cannot exceed loan amount');
  }
  if (inputs.loanTermYears && (inputs.loanTermYears < 1 || inputs.loanTermYears > 50)) {
    errors.push('Loan term must be between 1 and 50 years');
  }

  return errors;
}

/**
 * Rate limiting helper (simple in-memory — use Redis for production)
 */
const requestCounts = new Map();

export function rateLimit(identifier, maxRequests = 60, windowMs = 60000) {
  const now = Date.now();
  const key = `${identifier}:${Math.floor(now / windowMs)}`;

  const count = (requestCounts.get(key) || 0) + 1;
  requestCounts.set(key, count);

  // Cleanup old keys
  if (requestCounts.size > 10000) {
    const cutoff = Math.floor(now / windowMs) - 2;
    for (const [k] of requestCounts) {
      if (parseInt(k.split(':')[1]) < cutoff) requestCounts.delete(k);
    }
  }

  return count <= maxRequests;
}

/**
 * Parse and sanitize number inputs
 */
export function sanitizeNumber(value, defaultValue = 0, min = 0, max = Infinity) {
  const num = parseFloat(value);
  if (isNaN(num)) return defaultValue;
  return Math.min(Math.max(num, min), max);
}
