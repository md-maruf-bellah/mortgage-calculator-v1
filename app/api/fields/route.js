import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { CustomField } from '@/models';

export async function GET() {
  try {
    await connectDB();
    const fields = await CustomField.find({}).sort({ order: 1, createdAt: 1 });
    return NextResponse.json({ success: true, data: fields });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    const field = await CustomField.create({
      name: body.name,
      label: body.label,
      type: body.type || 'currency',
      defaultValue: body.defaultValue || 0,
      frequency: body.frequency || 'monthly',
      description: body.description || '',
      isActive: true,
      order: body.order || 99,
    });

    return NextResponse.json({ success: true, data: field }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { id, ...updates } = body;

    const field = await CustomField.findByIdAndUpdate(id, updates, { new: true });
    if (!field) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: field });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    await CustomField.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Field deleted' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
