import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const db = prisma as any;

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('all') === 'true' && user.role === 'ADMIN';

    const where: any = {};
    if (!includeInactive) {
      where.isActive = true;
    }

    const logos = await db.brandLogo.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({ logos });
  } catch (error: any) {
    console.error('Failed to fetch brand logos:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch logos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      slug,
      logoUrl,
      darkLogoUrl,
      isDefault = false,
      isActive = true,
      sortOrder = 0,
    } = body;

    if (!name || !logoUrl) {
      return NextResponse.json({ error: 'Logo name and logo URL are required' }, { status: 400 });
    }

    const generatedSlug = slug
      ? slug.toLowerCase().replace(/[^a-z0-9_-]/g, '-')
      : `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

    if (isDefault) {
      await db.brandLogo.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const logo = await db.brandLogo.create({
      data: {
        name,
        slug: generatedSlug,
        logoUrl,
        darkLogoUrl: darkLogoUrl || null,
        isDefault: Boolean(isDefault),
        isActive: isActive !== false,
        sortOrder: Number(sortOrder) || 0,
      },
    });

    return NextResponse.json({ success: true, logo });
  } catch (error: any) {
    console.error('Failed to create brand logo:', error);
    return NextResponse.json({ error: error.message || 'Failed to create logo' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, logoUrl, darkLogoUrl, isDefault, isActive, sortOrder } = body;

    if (!id) {
      return NextResponse.json({ error: 'Logo ID is required' }, { status: 400 });
    }

    const existing = await db.brandLogo.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Logo not found' }, { status: 404 });
    }

    if (isDefault) {
      await db.brandLogo.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await db.brandLogo.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        logoUrl: logoUrl !== undefined ? logoUrl : undefined,
        darkLogoUrl: darkLogoUrl !== undefined ? darkLogoUrl : undefined,
        isDefault: isDefault !== undefined ? Boolean(isDefault) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
      },
    });

    return NextResponse.json({ success: true, logo: updated });
  } catch (error: any) {
    console.error('Failed to update brand logo:', error);
    return NextResponse.json({ error: error.message || 'Failed to update logo' }, { status: 500 });
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
      return NextResponse.json({ error: 'Logo ID is required' }, { status: 400 });
    }

    await db.brandLogo.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Logo safely deleted' });
  } catch (error: any) {
    console.error('Failed to delete brand logo:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete logo' }, { status: 500 });
  }
}
