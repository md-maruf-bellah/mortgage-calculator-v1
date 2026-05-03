import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { CalculationHistory } from '@/models';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query = sessionId ? { sessionId } : {};
    const history = await CalculationHistory.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { id, ...updates } = body;

    const record = await CalculationHistory.findByIdAndUpdate(id, updates, { new: true });
    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    await CalculationHistory.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
