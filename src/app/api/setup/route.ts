import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  try {
    console.log('[SETUP] Running database migration and seeding...');

    // 1. Run schema push
    try {
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    } catch (e: any) {
      console.warn('[SETUP] db push warning:', e.message);
    }

    // 2. Check if users already exist
    const userCount = await prisma.user.count().catch(() => 0);
    if (userCount > 0) {
      return NextResponse.json({
        success: true,
        message: `Database already initialized with ${userCount} users!`,
        usersCount: userCount,
        superAdmin: 'dhruviktra.rajput.1379@gmail.com',
      });
    }

    // 3. Seed accounts
    const passwordHash = await bcrypt.hash('password123', 10);
    const superAdminPasswordHash = await bcrypt.hash('12345678', 10);

    // Create Super Admin (Dhruvit Rajput)
    await prisma.user.create({
      data: {
        email: 'dhruviktra.rajput.1379@gmail.com',
        password: superAdminPasswordHash,
        name: 'Dhruvit Rajput (Super Admin)',
        role: 'ADMIN',
        status: 'ACTIVE',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      },
    });

    // Create Demo Admin
    await prisma.user.create({
      data: {
        email: 'admin@company.com',
        password: passwordHash,
        name: 'Super Admin (System)',
        role: 'ADMIN',
        status: 'ACTIVE',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      },
    });

    // Create Lead Approver
    await prisma.user.create({
      data: {
        email: 'approver@company.com',
        password: passwordHash,
        name: 'Elena Rostova (Lead Approver)',
        role: 'APPROVER',
        status: 'ACTIVE',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        approverProfile: {
          create: {
            title: 'Head of Creative Quality & Brand Governance',
            department: 'Executive Brand Council',
          },
        },
      },
    });

    // Create 3 Designers
    const designersData = [
      { code: 'Designer 01', name: 'Alex Morgan', email: 'designer01@company.com', specialty: 'Brand Identity & Visuals', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
      { code: 'Designer 02', name: 'Sophia Chen', email: 'designer02@company.com', specialty: 'Social Media & Vector Art', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
      { code: 'Designer 03', name: 'Marcus Vance', email: 'designer03@company.com', specialty: 'Infographics & Ad Campaigns', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
    ];

    for (const d of designersData) {
      await prisma.user.create({
        data: {
          email: d.email,
          password: passwordHash,
          name: `${d.name} (${d.code})`,
          role: 'DESIGNER',
          status: 'ACTIVE',
          avatar: d.avatar,
          designerProfile: {
            create: {
              designerCode: d.code,
              specialty: d.specialty,
              activeCapacity: 5,
            },
          },
        },
      });
    }

    // Create 12 Requesters
    const requestersData = [
      { code: 'Member 01', name: 'Liam Davies', email: 'member01@company.com', dept: 'Digital Marketing' },
      { code: 'Member 02', name: 'Emma Wilson', email: 'member02@company.com', dept: 'Brand Operations' },
      { code: 'Member 03', name: 'Noah Miller', email: 'member03@company.com', dept: 'Product Marketing' },
      { code: 'Member 04', name: 'Olivia Taylor', email: 'member04@company.com', dept: 'Performance Ads' },
      { code: 'Member 05', name: 'Ethan Anderson', email: 'member05@company.com', dept: 'Social Media' },
      { code: 'Member 06', name: 'Ava Thomas', email: 'member06@company.com', dept: 'Public Relations' },
      { code: 'Member 07', name: 'Lucas Jackson', email: 'member07@company.com', dept: 'Regional Campaigns' },
      { code: 'Member 08', name: 'Mia White', email: 'member08@company.com', dept: 'Content Strategy' },
      { code: 'Member 09', name: 'Oliver Harris', email: 'member09@company.com', dept: 'Customer Retention' },
      { code: 'Member 10', name: 'Isabella Martin', email: 'member10@company.com', dept: 'E-Commerce' },
      { code: 'Member 11', name: 'James Garcia', email: 'member11@company.com', dept: 'Internal Communications' },
      { code: 'Member 12', name: 'Charlotte Robinson', email: 'member12@company.com', dept: 'Executive Office' },
    ];

    for (const r of requestersData) {
      await prisma.user.create({
        data: {
          email: r.email,
          password: passwordHash,
          name: `${r.name} (${r.code})`,
          role: 'REQUESTER',
          status: 'ACTIVE',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.code.replace(' ', '')}`,
          requesterProfile: {
            create: {
              memberCode: r.code,
              department: r.dept,
              phone: `+1-555-010${r.code.replace('Member ', '')}`,
            },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'All PostgreSQL tables created and 18 accounts initialized successfully!',
      superAdmin: 'dhruviktra.rajput.1379@gmail.com',
      password: 'Set to 12345678',
    });
  } catch (error: any) {
    console.error('[SETUP ERROR]', error);
    return NextResponse.json({ error: error.message || 'Setup failed' }, { status: 500 });
  }
}
