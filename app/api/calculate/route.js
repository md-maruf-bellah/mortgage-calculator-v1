import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { CalculationHistory } from '@/models';
import { calculateMortgage, calculateAllTerms } from '@/lib/mortgage';

export async function POST(request) {
  try {
    const body = await request.json();
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
      customFields,
      calculateAll,
      sessionId,
      saveName,
    } = body;

    // Validate inputs
    if (!loanAmount || !interestRate || loanAmount <= 0 || interestRate <= 0) {
      return NextResponse.json(
        { error: 'Invalid loan amount or interest rate' },
        { status: 400 }
      );
    }

    const params = {
      loanAmount: parseFloat(loanAmount),
      interestRate: parseFloat(interestRate),
      downPayment: parseFloat(downPayment || 0),
      propertyTaxes: parseFloat(propertyTaxes || 0),
      homeInsurance: parseFloat(homeInsurance || 0),
      pmi: parseFloat(pmi || 0),
      hoaFees: parseFloat(hoaFees || 0),
      extraMonthlyPayment: parseFloat(extraMonthlyPayment || 0),
      loanTermYears: parseInt(loanTermYears || 30),
      customFields: customFields || [],
    };

    let result;
    if (calculateAll) {
      result = calculateAllTerms(params);
    } else {
      result = calculateMortgage(params);
    }

    // Save to history
    if (sessionId) {
      try {
        await connectDB();
        await CalculationHistory.create({
          sessionId,
          inputs: params,
          results: {
            monthlyPayment: calculateAll ? result[0]?.monthlyPayment : result.monthlyPayment,
            totalInterest: calculateAll ? result[0]?.totalInterest : result.totalInterest,
            totalPayment: calculateAll ? result[0]?.totalCost : result.totalCost,
            principal: calculateAll ? result[0]?.principal : result.principal,
          },
          name: saveName || `Calculation - $${loanAmount.toLocaleString()}`,
        });
      } catch (dbErr) {
        console.error('DB save error (non-fatal):', dbErr.message);
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Calculate error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
