import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

export const DEFAULT_CREATIVE_CATEGORIES = [
  {
    code: 'MEETING_ANNOUNCEMENT',
    name: 'Referral Meeting Announcement',
    description: 'Announce chapter meetings with date, time, venue, stimulants, dress code, and visitor fees.',
    icon: 'Calendar',
    sortOrder: 1,
  },
  {
    code: 'BUSINESS_PRESENTATION',
    name: 'Business Presentation',
    description: 'Highlight 8-min or 10-min member feature presentation, credentials, and specific asks.',
    icon: 'Presentation',
    sortOrder: 2,
  },
  {
    code: 'KYM',
    name: 'Know Your Member (KYM)',
    description: 'Official member profile showcase with clear portrait, company, business category, and contact details.',
    icon: 'UserCheck',
    sortOrder: 3,
  },
  {
    code: 'BIRTHDAY',
    name: 'Monthly Birthday Creatives',
    description: 'Celebrate member birthdays month-wise with personalized graphics and exportable Word (.docx) member rosters.',
    icon: 'Cake',
    sortOrder: 4,
  },
];

async function ensureDefaultCategories() {
  try {
    const count = await prisma.creativeCategory.count();
    if (count === 0) {
      console.log('[Categories API] 0 categories found in database. Auto-seeding 4 standard default categories...');
      for (const cat of DEFAULT_CREATIVE_CATEGORIES) {
        await prisma.creativeCategory.upsert({
          where: { code: cat.code },
          update: {
            name: cat.name,
            description: cat.description,
            icon: cat.icon,
            sortOrder: cat.sortOrder,
            isActive: true,
          },
          create: {
            code: cat.code,
            name: cat.name,
            description: cat.description,
            icon: cat.icon,
            sortOrder: cat.sortOrder,
            isActive: true,
          },
        });
      }
    }
  } catch (err) {
    console.error('[Categories auto-seed error]:', err);
  }
}

export async function GET(req: NextRequest) {
  try {
    // 1. Ensure standard categories exist if database is fresh / empty
    await ensureDefaultCategories();

    let user: any = null;
    try {
      user = await getCurrentUser(req);
    } catch {}

    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('all') === 'true' && user?.role === 'ADMIN';

    let categories = await prisma.creativeCategory.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        templates: {
          where: includeInactive ? {} : { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        },
        _count: {
          select: {
            templates: true,
            creatives: true,
          },
        },
      },
    });

    // Fallback: If no active categories found, return all available categories
    if (categories.length === 0) {
      categories = await prisma.creativeCategory.findMany({
        orderBy: { sortOrder: 'asc' },
        include: {
          templates: {
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
          },
          _count: {
            select: {
              templates: true,
              creatives: true,
            },
          },
        },
      });
    }

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('Failed to fetch creative categories:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { action, code, name, description, icon, sortOrder, isActive } = body;

    // Explicit seed defaults action
    if (action === 'seed_defaults') {
      for (const cat of DEFAULT_CREATIVE_CATEGORIES) {
        await prisma.creativeCategory.upsert({
          where: { code: cat.code },
          update: {
            name: cat.name,
            description: cat.description,
            icon: cat.icon,
            sortOrder: cat.sortOrder,
            isActive: true,
          },
          create: {
            code: cat.code,
            name: cat.name,
            description: cat.description,
            icon: cat.icon,
            sortOrder: cat.sortOrder,
            isActive: true,
          },
        });
      }
      const seeded = await prisma.creativeCategory.findMany({
        orderBy: { sortOrder: 'asc' },
      });
      return NextResponse.json({ success: true, categories: seeded });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const trimmedName = name.trim();
    const derivedCode = (code || trimmedName)
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, '_')
      .replace(/^_+|_+$/g, '');

    const cleanCode = derivedCode || `CAT_${Date.now()}`;

    // Upsert or create category
    const category = await prisma.creativeCategory.upsert({
      where: { code: cleanCode },
      update: {
        name: trimmedName,
        description: description?.trim() || null,
        icon: icon || 'Sparkles',
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        isActive: isActive !== false,
      },
      create: {
        code: cleanCode,
        name: trimmedName,
        description: description?.trim() || null,
        icon: icon || 'Sparkles',
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        isActive: isActive !== false,
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    console.error('Failed to create category:', error);
    return NextResponse.json({ error: error.message || 'Failed to create category' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, description, icon, sortOrder, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const category = await prisma.creativeCategory.update({
      where: { id },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        icon: icon || undefined,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : undefined,
        isActive: typeof isActive === 'boolean' ? isActive : undefined,
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    console.error('Failed to update category:', error);
    return NextResponse.json({ error: error.message || 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    await prisma.creativeCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete category:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete category' }, { status: 500 });
  }
}
