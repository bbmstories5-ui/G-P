import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    const creative = await prisma.generatedCreative.findUnique({
      where: { id },
    });

    if (!creative) {
      return NextResponse.json({ error: 'Creative record not found' }, { status: 404 });
    }

    if (creative.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.generatedCreative.update({
      where: { id },
      data: {
        downloadCount: { increment: 1 },
        lastDownloadedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, downloadCount: updated.downloadCount, fileUrl: updated.fileUrl });
  } catch (error: any) {
    console.error('Download tracker error:', error);
    return NextResponse.json({ error: error.message || 'Download tracker error' }, { status: 500 });
  }
}
