const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const existingUsers = await prisma.user.count().catch(() => 0);
  if (existingUsers > 0) {
    console.log(`--- DATABASE ALREADY SEEDED (${existingUsers} users found). READY ---`);
    return;
  }

  console.log('--- INITIALIZING DATABASE & SEEDING 17 ACCOUNTS ---');

  const passwordHash = await bcrypt.hash('password123', 10);
  const superAdminPasswordHash = await bcrypt.hash('12345678', 10);

  // 1. Create Super Admin (Dhruvit Rajput)
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

  // Secondary demo admin
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

  // 2. Create Lead Approver (1)
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

  // 3. Create Graphic Makers (3)
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

  // 4. Create Requester Members (12)
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

  // 5. System Settings
  await prisma.systemSetting.createMany({
    data: [
      { key: 'PORTAL_NAME', value: 'Creative Flow Enterprise Portal', description: 'Internal Portal Name' },
      { key: 'ALLOW_AUTO_ASSIGN', value: 'false', description: 'Enable auto-assignment algorithms' },
      { key: 'MAX_FILE_SIZE_MB', value: '50', description: 'Maximum upload file size' },
      { key: 'ALLOWED_FORMATS', value: 'PNG,JPG,JPEG,WEBP,PDF,ZIP,PSD,AI', description: 'Allowed upload formats' },
    ],
  });

  console.log('--- ALL DEMO DATA REMOVED. 17 CLEAN ACCOUNTS CREATED ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
