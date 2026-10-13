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
    const month = searchParams.get('month');
    const referralGroup = searchParams.get('referralGroup');

    const users = await prisma.user.findMany({
      where: {
        role: 'REQUESTER',
        status: 'ACTIVE',
      },
      include: {
        requesterProfile: true,
      },
      orderBy: { name: 'asc' },
    });

    let members = users.map((u) => {
      const p = u.requesterProfile;
      return {
        id: u.id,
        memberCode: p?.memberCode || 'Member',
        name: u.name.replace(/\s*\([^)]*\)/, ''), // Strip code if in name
        fullName: u.name,
        email: u.email,
        phone: p?.phone || '',
        avatar: u.avatar || '',
        company: p?.company || '',
        businessCategory: p?.businessCategory || '',
        website: p?.website || '',
        referralGroupName: p?.referralGroupName || 'Apex Referral Chapter',
        birthDay: p?.birthDay || '',
        birthMonth: p?.birthMonth || '',
        specificAsk: p?.specificAsk || '',
      };
    });

    if (month && month !== 'ALL') {
      const targetMonth = month.toLowerCase().trim();
      members = members.filter((m) => m.birthMonth && m.birthMonth.toLowerCase().trim() === targetMonth);
    }

    if (referralGroup && referralGroup !== 'ALL') {
      members = members.filter((m) => m.referralGroupName === referralGroup);
    }

    return NextResponse.json({ members });
  } catch (error: any) {
    console.error('Failed to fetch members:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch members' }, { status: 500 });
  }
}
