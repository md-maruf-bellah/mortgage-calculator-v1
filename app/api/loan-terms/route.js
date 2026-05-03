import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { LoanTerm } from '@/models';

// GET all loan terms
export async function GET() {
  try {
    await connectDB();
    const terms = await LoanTerm.find({}).sort({ order: 1, years: 1 });
    return NextResponse.json({ success: true, data: terms });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create new loan term
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    const existing = await LoanTerm.findOne({ years: body.years });
    if (existing) {
      return NextResponse.json({ error: 'Loan term already exists' }, { status: 409 });
    }

    const term = await LoanTerm.create({
      years: body.years,
      label: body.label || `${body.years} Years`,
      isActive: body.isActive !== undefined ? body.isActive : true,
      isDefault: body.isDefault || false,
      order: body.order || body.years,
      description: body.description || '',
    });

    return NextResponse.json({ success: true, data: term }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT update loan term
export async function PUT(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { id, ...updates } = body;

    const term = await LoanTerm.findByIdAndUpdate(id, updates, { new: true });
    if (!term) {
      return NextResponse.json({ error: 'Loan term not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: term });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE loan term
export async function DELETE(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const term = await LoanTerm.findByIdAndDelete(id);
    if (!term) {
      return NextResponse.json({ error: 'Loan term not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Loan term deleted' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
