/**
 * Core mortgage calculation engine
 */

export function calculateMortgage(params) {
  const {
    loanAmount,
    interestRate,
    downPayment,
    propertyTaxes,
    homeInsurance,
    pmi,
    hoaFees,
    extraMonthlyPayment,
    loanTermYears,
    customFields = [],
  } = params;

  const principal = loanAmount - downPayment;
  const monthlyRate = interestRate / 100 / 12;
  const numPayments = loanTermYears * 12;

  // Base monthly payment (P&I)
  let monthlyPI = 0;
  if (monthlyRate === 0) {
    monthlyPI = principal / numPayments;
  } else {
    monthlyPI =
      (principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);
  }

  // Monthly extras
  const monthlyTax = propertyTaxes / 12;
  const monthlyInsurance = homeInsurance / 12;
  const monthlyPMI = (principal * (pmi / 100)) / 12;
  const monthlyHOA = hoaFees;

  // Custom fields total
  const customTotal = customFields.reduce((sum, field) => {
    if (field.frequency === 'monthly') return sum + (field.value || 0);
    if (field.frequency === 'annual') return sum + (field.value || 0) / 12;
    return sum;
  }, 0);

  const totalMonthly =
    monthlyPI + monthlyTax + monthlyInsurance + monthlyPMI + monthlyHOA + customTotal + (extraMonthlyPayment || 0);

  // Amortization schedule
  const schedule = [];
  let balance = principal;
  let totalInterestPaid = 0;

  for (let month = 1; month <= numPayments; month++) {
    if (balance <= 0) break;

    const interestPayment = balance * monthlyRate;
    let principalPayment = monthlyPI - interestPayment + (extraMonthlyPayment || 0);

    if (principalPayment > balance) principalPayment = balance;

    totalInterestPaid += interestPayment;
    balance -= principalPayment;

    if (month <= 12 || month % 12 === 0 || balance <= 0) {
      schedule.push({
        month,
        year: Math.ceil(month / 12),
        payment: monthlyPI + (extraMonthlyPayment || 0),
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, balance),
        totalInterestPaid,
      });
    }
  }

  return {
    monthlyPayment: totalMonthly,
    monthlyPI,
    monthlyTax,
    monthlyInsurance,
    monthlyPMI,
    monthlyHOA,
    customTotal,
    principal,
    totalInterest: totalInterestPaid,
    totalPayment: monthlyPI * numPayments + totalInterestPaid - totalInterestPaid + principal,
    totalCost: totalMonthly * numPayments,
    schedule,
    breakdown: {
      principal: monthlyPI,
      tax: monthlyTax,
      insurance: monthlyInsurance,
      pmi: monthlyPMI,
      hoa: monthlyHOA,
      extra: extraMonthlyPayment || 0,
      custom: customTotal,
    },
  };
}

export function calculateAllTerms(params, terms = [5, 10, 15, 20, 25, 30]) {
  return terms.map((term) => ({
    term,
    ...calculateMortgage({ ...params, loanTermYears: term }),
  }));
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value) {
  return `${value.toFixed(2)}%`;
}

export function getAffordabilityRating(monthlyPayment, annualIncome) {
  const ratio = (monthlyPayment * 12) / annualIncome;
  if (ratio < 0.28) return { rating: 'Excellent', color: 'green', message: 'Well within affordability guidelines' };
  if (ratio < 0.36) return { rating: 'Good', color: 'blue', message: 'Within standard affordability range' };
  if (ratio < 0.43) return { rating: 'Caution', color: 'yellow', message: 'Approaching affordability limits' };
  return { rating: 'High Risk', color: 'red', message: 'Exceeds recommended debt-to-income ratio' };
}

export function calculateBreakEvenPoint(closingCosts, monthlySavings) {
  if (monthlySavings <= 0) return null;
  return Math.ceil(closingCosts / monthlySavings);
}
