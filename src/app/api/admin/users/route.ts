import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { sendInvitationEmail } from '@/lib/email';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(['ADMIN']);

    const users = await prisma.user.findMany({
      include: {
        requesterProfile: true,
        designerProfile: true,
        approverProfile: true,
        _count: {
          select: {
            createdRequests: true,
            assignedRequests: true,
            approvals: true,
          },
        },
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unauthorized' }, { status: 403 });
  }
}

import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const adminUser = await requireAuth(['ADMIN']);
    const body = await req.json();

    const {
      name,
      email,
      role = 'REQUESTER',
      department = 'Marketing',
      specialty = 'Social Media & Creatives',
      memberCode,
      designerCode,
      approverTitle = 'Lead Creative Approver',
      password = 'password123',
    } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and Email are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check duplicate
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json({ error: `User with email ${cleanEmail} already exists` }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Auto-calculate code if not provided
    let calculatedCode = memberCode;
    if (role === 'REQUESTER' && !calculatedCode) {
      const count = await prisma.requesterProfile.count();
      calculatedCode = `Member ${String(count + 1).padStart(2, '0')}`;
    } else if (role === 'DESIGNER' && !designerCode) {
      const count = await prisma.designerProfile.count();
      calculatedCode = `Designer ${String(count + 1).padStart(2, '0')}`;
    }

    // Create User & Profile
    const newUser = await prisma.user.create({
      data: {
        email: cleanEmail,
        password: passwordHash,
        name: role === 'REQUESTER' || role === 'DESIGNER' ? `${name} (${calculatedCode})` : name,
        role,
        status: 'ACTIVE',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        ...(role === 'REQUESTER'
          ? {
              requesterProfile: {
                create: {
                  memberCode: calculatedCode || `Member ${Date.now().toString().slice(-4)}`,
                  department: department || 'Marketing',
                  phone: '+1-555-0199',
                },
              },
            }
          : {}),
        ...(role === 'DESIGNER'
          ? {
              designerProfile: {
                create: {
                  designerCode: calculatedCode || `Designer ${Date.now().toString().slice(-4)}`,
                  specialty: specialty || 'Graphic & Motion Design',
                  activeCapacity: 5,
                },
              },
            }
          : {}),
        ...(role === 'APPROVER'
          ? {
              approverProfile: {
                create: {
                  title: approverTitle || 'Creative Director & Brand Lead',
                  department: department || 'Brand Governance',
                },
              },
            }
          : {}),
      },
      include: {
        requesterProfile: true,
        designerProfile: true,
        approverProfile: true,
      },
    });

    // Log admin activity
    await prisma.activityLog.create({
      data: {
        userId: adminUser.id,
        userName: adminUser.name,
        userRole: adminUser.role,
        action: 'USER_INVITED',
        details: `Super Admin invited new user ${name} (${cleanEmail}) as ${role}`,
      },
    });

    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      (host.includes('localhost') ? 'https://portal-grap.up.railway.app' : `${protocol}://${host}`);

    const roleLoginPath =
      role === 'ADMIN'
        ? '/login/admin'
        : role === 'APPROVER'
        ? '/login/approver'
        : role === 'DESIGNER'
        ? '/login/designer'
        : '/login/requester';

    const loginUrl = `${baseUrl.replace(/\/$/, '')}${roleLoginPath}?email=${encodeURIComponent(cleanEmail)}`;

    // Dispatch real email via Google Gmail SMTP if configured with safety timeout
    let emailResult: any = null;
    try {
      const emailPromise = sendInvitationEmail({
        toEmail: cleanEmail,
        recipientName: name,
        role,
        identifier: calculatedCode || role,
        password,
        loginUrl,
      });

      const timeoutPromise = new Promise((resolve) =>
        setTimeout(() => resolve({ success: false, error: 'Email dispatch timed out' }), 18000)
      );

      emailResult = await Promise.race([emailPromise, timeoutPromise]);
    } catch (emailErr) {
      console.error('Email sending failed (non-blocking):', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: `User ${name} invited successfully!`,
      user: newUser,
      emailDispatched: emailResult?.success ?? false,
      credentials: {
        email: cleanEmail,
        password,
        role,
        identifier: calculatedCode || role,
        loginUrl,
      },
    });
  } catch (error: any) {
    console.error('Error inviting user:', error);
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(['ADMIN']);
    const { userId, status } = await req.json();

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}


