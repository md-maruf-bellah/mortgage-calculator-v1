import { NextResponse } from 'next/server';
import { calculateMortgage, calculateAllTerms, formatCurrency } from '@/lib/mortgage';

export async function POST(request) {
  try {
    const body = await request.json();
    const { params, results } = body;

    // Return data for client-side PDF generation
    const allTerms = calculateAllTerms(params);

    const reportData = {
      generatedAt: new Date().toISOString(),
      inputs: params,
      summary: results,
      allTermsComparison: allTerms.map((t) => ({
        term: `${t.term} Years`,
        monthlyPayment: formatCurrency(t.monthlyPayment),
        totalInterest: formatCurrency(t.totalInterest),
        totalPayment: formatCurrency(t.totalCost),
        principal: formatCurrency(t.principal),
      })),
      amortizationHighlights: results.schedule?.slice(0, 12) || [],
    };

    return NextResponse.json({ success: true, data: reportData });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
