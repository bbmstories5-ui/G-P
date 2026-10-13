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
    const includeInactive = searchParams.get('all') === 'true' && user.role === 'ADMIN';

    const categories = await prisma.creativeCategory.findMany({
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
    const { code, name, description, icon, sortOrder, isActive } = body;

    if (!code || !name) {
      return NextResponse.json({ error: 'Category code and name are required' }, { status: 400 });
    }

    const cleanCode = code.toUpperCase().replace(/[^A-Z0-9_]/g, '_');

    const category = await prisma.creativeCategory.create({
      data: {
        code: cleanCode,
        name,
        description: description || null,
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
