// Settings API - API keys and config management
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.setting.findMany();
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      // Mask API keys for security
      settingsMap[s.key] = s.value.length > 8
        ? s.value.slice(0, 4) + '****' + s.value.slice(-4)
        : '****';
    }
    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || !value) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
    }

    await prisma.setting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save setting error:', error);
    return NextResponse.json({ error: 'Failed to save setting' }, { status: 500 });
  }
}
