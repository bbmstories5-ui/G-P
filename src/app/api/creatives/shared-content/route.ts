import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key') || 'global_footer_config';

    const item = await prisma.sharedFixedContent.findUnique({
      where: { key },
    });

    if (!item) {
      return NextResponse.json({ key, value: null, config: null });
    }

    let parsed = null;
    try {
      parsed = JSON.parse(item.value);
    } catch {
      parsed = item.value;
    }

    return NextResponse.json({
      key: item.key,
      label: item.label,
      value: item.value,
      config: parsed,
      updatedAt: item.updatedAt,
    });
  } catch (error: any) {
    console.error('Failed to get shared content:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { key = 'global_footer_config', label, value, config } = body;

    const stringValue = typeof config === 'object' ? JSON.stringify(config, null, 2) : String(value || '');

    const updated = await prisma.sharedFixedContent.upsert({
      where: { key },
      update: {
        label: label || 'Global Configuration',
        value: stringValue,
        scope: 'GLOBAL',
      },
      create: {
        key,
        label: label || 'Global Configuration',
        value: stringValue,
        scope: 'GLOBAL',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Global fixed content updated globally across all templates',
      item: updated,
    });
  } catch (error: any) {
    console.error('Failed to update shared content:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
