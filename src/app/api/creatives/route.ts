import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 15-Day Auto-Retention Policy: Clean up creatives older than 15 days from database & storage
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    try {
      const expiredCreatives = await prisma.generatedCreative.findMany({
        where: {
          createdAt: { lt: fifteenDaysAgo },
        },
        select: { id: true, fileUrl: true },
      });

      if (expiredCreatives.length > 0) {
        for (const exp of expiredCreatives) {
          if (exp.fileUrl && exp.fileUrl.startsWith('/uploads/creatives/')) {
            try {
              const localPath = path.join(process.cwd(), 'public', exp.fileUrl);
              await fs.unlink(localPath).catch(() => {});
            } catch {}
          }
        }

        await prisma.generatedCreative.deleteMany({
          where: {
            id: { in: expiredCreatives.map((e) => e.id) },
          },
        });
      }
    } catch (cleanupErr) {
      console.warn('Auto 15-day cleanup notice:', cleanupErr);
    }

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const categoryCode = searchParams.get('categoryCode');
    const search = searchParams.get('search');
    const all = searchParams.get('all') === 'true' && user.role === 'ADMIN';

    const where: any = {};
    if (!all) {
      where.userId = user.id;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (categoryCode) {
      where.category = { code: categoryCode };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { referralGroupName: { contains: search, mode: 'insensitive' } },
        { memberName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const creatives = await prisma.generatedCreative.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        template: {
          include: {
            elements: true,
            category: true,
          },
        },
        logo: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({ creatives });
  } catch (error: any) {
    console.error('Failed to fetch creatives:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch creatives' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      id: existingCreativeId,
      categoryId,
      templateId,
      logoId,
      logoUrl,
      title,
      referralGroupName,
      memberName,
      formData,
      imageData, // base64 data url from canvas
      fileUrl: existingFileUrl,
      outputFormat = 'PNG',
      dimensions = '1080x1080',
    } = body;

    if (!categoryId || !title) {
      return NextResponse.json({ error: 'Category ID and title are required.' }, { status: 400 });
    }

    let savedFileUrl = existingFileUrl || '';
    let fileSize = 0;

    // If base64 imageData provided, save to public/uploads/creatives
    if (imageData && imageData.startsWith('data:image/')) {
      try {
        const matches = imageData.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const ext = matches[1].replace('jpeg', 'jpg');
          const buffer = Buffer.from(matches[2], 'base64');
          fileSize = buffer.length;

          const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'creatives');
          await fs.mkdir(uploadDir, { recursive: true });

          const filename = `creative_${user.id}_${Date.now()}.${ext}`;
          const filePath = path.join(uploadDir, filename);
          await fs.writeFile(filePath, buffer);
          savedFileUrl = `/uploads/creatives/${filename}`;
        }
      } catch (err: any) {
        console.warn('Filesystem write failed, keeping Data URI as fileUrl:', err?.message);
        savedFileUrl = imageData;
      }
    } else if (!savedFileUrl) {
      savedFileUrl = imageData || '';
    }

    // Check if updating an existing saved creative
    if (existingCreativeId) {
      const existing = await prisma.generatedCreative.findUnique({
        where: { id: existingCreativeId },
      });

      if (existing && (existing.userId === user.id || user.role === 'ADMIN')) {
        // Clean up old file if replaced
        if (
          savedFileUrl &&
          existing.fileUrl &&
          savedFileUrl !== existing.fileUrl &&
          existing.fileUrl.startsWith('/uploads/creatives/')
        ) {
          try {
            const oldPath = path.join(process.cwd(), 'public', existing.fileUrl);
            await fs.unlink(oldPath).catch(() => {});
          } catch {}
        }

        const updatedCreative = await prisma.generatedCreative.update({
          where: { id: existingCreativeId },
          data: {
            categoryId,
            templateId: templateId || null,
            logoId: logoId || null,
            logoUrl: logoUrl || null,
            title,
            referralGroupName: referralGroupName || null,
            memberName: memberName || user.name,
            formData: typeof formData === 'string' ? formData : JSON.stringify(formData || {}),
            fileUrl: savedFileUrl || existing.fileUrl,
            previewUrl: savedFileUrl || existing.previewUrl,
            outputFormat: outputFormat.toUpperCase(),
            fileSize: fileSize || existing.fileSize,
            dimensions,
            updatedAt: new Date(),
          },
          include: {
            category: true,
            template: {
              include: {
                elements: true,
                category: true,
              },
            },
            logo: true,
          },
        });

        return NextResponse.json({ success: true, creative: updatedCreative, updated: true });
      }
    }

    const creative = await prisma.generatedCreative.create({
      data: {
        userId: user.id,
        categoryId,
        templateId: templateId || null,
        logoId: logoId || null,
        logoUrl: logoUrl || null,
        title,
        referralGroupName: referralGroupName || null,
        memberName: memberName || user.name,
        formData: typeof formData === 'string' ? formData : JSON.stringify(formData || {}),
        fileUrl: savedFileUrl,
        previewUrl: savedFileUrl,
        outputFormat: outputFormat.toUpperCase(),
        fileSize,
        dimensions,
        downloadCount: 1, // generated for member
        lastDownloadedAt: new Date(),
      },
      include: {
        category: true,
        template: {
          include: {
            elements: true,
            category: true,
          },
        },
        logo: true,
      },
    });

    return NextResponse.json({ success: true, creative });
  } catch (error: any) {
    console.error('Failed to save creative:', error);
    return NextResponse.json({ error: error.message || 'Failed to save creative' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Creative ID is required' }, { status: 400 });
    }

    const creative = await prisma.generatedCreative.findUnique({
      where: { id },
    });

    if (!creative) {
      return NextResponse.json({ error: 'Creative record not found' }, { status: 404 });
    }

    // Members can only delete their own; admins can delete any
    if (creative.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Remove file from disk if present
    if (creative.fileUrl && creative.fileUrl.startsWith('/uploads/creatives/')) {
      try {
        const fullPath = path.join(process.cwd(), 'public', creative.fileUrl);
        await fs.unlink(fullPath).catch(() => {});
      } catch {}
    }

    await prisma.generatedCreative.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Creative removed successfully' });
  } catch (error: any) {
    console.error('Failed to delete creative:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete creative' }, { status: 500 });
  }
}
