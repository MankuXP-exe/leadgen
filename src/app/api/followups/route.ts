// Follow-up tracking API for CRM functionality
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get('businessId');

  if (businessId) {
    const followUps = await prisma.followUp.findMany({
      where: { businessId },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json({ followUps });
  }

  // Get all pending follow-ups
  const followUps = await prisma.followUp.findMany({
    where: { status: 'PENDING' },
    include: { business: { select: { name: true, category: true, phoneNumbers: true } } },
    orderBy: { date: 'asc' },
  });

  return NextResponse.json({ followUps });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, date, notes } = body;

    if (!businessId || !date) {
      return NextResponse.json({ error: 'businessId and date required' }, { status: 400 });
    }

    const followUp = await prisma.followUp.create({
      data: {
        businessId,
        date: new Date(date),
        notes: notes || '',
        status: 'PENDING',
      },
    });

    return NextResponse.json({ followUp });
  } catch (error) {
    console.error('Create follow-up error:', error);
    return NextResponse.json({ error: 'Failed to create follow-up' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const followUp = await prisma.followUp.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json({ followUp });
  } catch (error) {
    console.error('Update follow-up error:', error);
    return NextResponse.json({ error: 'Failed to update follow-up' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  await prisma.followUp.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
