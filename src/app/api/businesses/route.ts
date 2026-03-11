// Businesses CRUD API
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const classification = searchParams.get('classification') || '';
    const location = searchParams.get('location') || '';
    const minScore = parseInt(searchParams.get('minScore') || '0');
    const sortBy = searchParams.get('sortBy') || 'score';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { address: { contains: search } },
        { phoneNumbers: { contains: search } },
      ];
    }
    if (category) where.category = { contains: category };
    if (location) {
      where.OR = [
        ...(Array.isArray(where.OR) ? where.OR : []),
        { city: { contains: location } },
        { area: { contains: location } },
        { address: { contains: location } },
      ];
    }
    if (status) {
      where.websiteAnalysis = { status };
    }
    if (classification) {
      where.leadScore = { classification };
    }
    if (minScore > 0) {
      where.leadScore = { ...(where.leadScore as object || {}), score: { gte: minScore } };
    }

    const orderBy: Record<string, unknown> = {};
    if (sortBy === 'score') {
      orderBy.leadScore = { score: sortOrder };
    } else if (sortBy === 'rating') {
      orderBy.rating = sortOrder;
    } else if (sortBy === 'reviews') {
      orderBy.reviewCount = sortOrder;
    } else if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        include: { websiteAnalysis: true, leadScore: true },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.business.count({ where }),
    ]);

    return NextResponse.json({
      businesses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get businesses error:', error);
    return NextResponse.json({ error: 'Failed to fetch businesses' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      await prisma.business.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  } catch (error) {
    console.error('Delete business error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
