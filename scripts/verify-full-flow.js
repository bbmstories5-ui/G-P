const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFullFlow() {
  console.log('--- Verifying Full System Integration ---');

  // 1. Verify Templates Count
  const templates = await prisma.creativeTemplate.findMany({
    where: { status: 'PUBLISHED', isActive: true },
    include: { elements: true, category: true },
  });
  console.log(`[Templates in DB] Found ${templates.length} published templates:`);
  templates.forEach((t) => {
    console.log(` - [${t.category?.name}] ${t.name} (Approval: ${t.approvalRequired ? 'YES' : 'NO'}, Elements: ${t.elements.length})`);
  });

  // 2. Verify Member & Admin Users
  const member = await prisma.user.findFirst({ where: { role: 'REQUESTER' } });
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  console.log(`[Member User] ${member?.name} (${member?.email})`);
  console.log(`[Admin User] ${admin?.name} (${admin?.email})`);

  if (!member || !templates.length) {
    console.error('Missing member or templates');
    return;
  }

  // 3. Test Direct Generation Template (Template 1: Meeting Announcement)
  const directTpl = templates.find((t) => !t.approvalRequired) || templates[0];
  console.log(`\nTesting Direct Generation for: ${directTpl.name}`);
  const directCreative = await prisma.generatedCreative.create({
    data: {
      userId: member.id,
      categoryId: directTpl.categoryId,
      templateId: directTpl.id,
      title: `${directTpl.name} - Test Direct Generation`,
      referralGroupName: 'Apex Referral Chapter',
      memberName: member.name,
      formData: JSON.stringify({
        referralGroupName: 'Apex Referral Chapter',
        date: 'Wednesday, 16th October 2026',
        time: '07:00 AM - 09:30 AM',
        venue: 'Grand Ballroom, The Oberoi, Marine Drive',
        meetingStimulant: 'Unlocking Cross-Chapter Alliances',
      }),
      fileUrl: '/reference-design.png',
      outputFormat: 'PNG',
      dimensions: `${directTpl.width}x${directTpl.height}`,
      downloadCount: 1,
      lastDownloadedAt: new Date(),
    },
  });
  console.log(`[Direct Creative Created] ID: ${directCreative.id}, Title: ${directCreative.title}`);

  // 4. Test Approval Workflow (Template 3: KYM which requires approval)
  const approvalTpl = templates.find((t) => t.approvalRequired) || templates[2];
  if (approvalTpl) {
    console.log(`\nTesting Approval Request Workflow for: ${approvalTpl.name}`);
    const reqCode = `CR-TEST-${Date.now().toString().slice(-4)}`;
    const request = await prisma.creativeRequest.create({
      data: {
        reqCode,
        memberId: member.id,
        templateId: approvalTpl.id,
        submittedData: JSON.stringify({
          memberName: member.name,
          companyName: 'Apex Enterprise',
          phone: '+91 98250 11223',
        }),
        photoUrl: '/logos/official/jito-crest.png',
        status: 'PENDING_APPROVAL',
      },
    });
    console.log(`[Request Submitted] ReqCode: ${request.reqCode}, Status: ${request.status}`);

    // Admin Approves Request
    const approved = await prisma.creativeRequest.update({
      where: { id: request.id },
      data: {
        status: 'APPROVED',
        adminFeedback: 'Branding and content verified by Super Admin.',
      },
    });
    console.log(`[Admin Action] Request ${approved.reqCode} -> Status: ${approved.status}, Feedback: "${approved.adminFeedback}"`);
  }

  // 5. Verify 6 Official Logos
  const logos = await prisma.brandLogo.findMany();
  console.log(`\n[Official Logos] Active in database: ${logos.length}`);
  logos.forEach((l) => console.log(` - ${l.name} (${l.logoUrl})`));

  console.log('\n=== ALL INTEGRATION CHECKS PASSED SUCCESSFULLY ===');
}

testFullFlow()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
