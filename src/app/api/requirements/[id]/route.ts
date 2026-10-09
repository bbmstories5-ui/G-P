import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, assertRequirementAccess } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const { id } = await Promise.resolve(params);
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Strict isolation assertion!
    const requirement = await assertRequirementAccess(id, user);

    return NextResponse.json({ requirement });

  } catch (error: any) {
    if (error.message.includes('FORBIDDEN')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message.includes('NOT_FOUND')) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to fetch requirement' }, { status: 500 });
  }
}
