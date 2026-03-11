// Notes API for CRM functionality
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get('businessId');

  if (!businessId) {
    return NextResponse.json({ error: 'businessId required' }, { status: 400 });
  }

  const notes = await prisma.note.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ notes });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, content } = body;

    if (!businessId || !content) {
      return NextResponse.json({ error: 'businessId and content required' }, { status: 400 });
    }

    const note = await prisma.note.create({
      data: { businessId, content },
    });

    return NextResponse.json({ note });
  } catch (error) {
    console.error('Create note error:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  await prisma.note.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
