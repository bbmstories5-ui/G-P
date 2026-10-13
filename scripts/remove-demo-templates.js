const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Removing Demo 199 Templates ---');

  // 1. Double check backup
  const backupDir = path.join(__dirname, '..', 'prisma', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const existingTemplates = await prisma.creativeTemplate.findMany({
    include: { elements: true, category: true },
  });

  const backupFile = path.join(backupDir, `demo-199-backup-${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(existingTemplates, null, 2));
  console.log(`[Backup Saved] ${existingTemplates.length} templates backed up to: ${backupFile}`);

  // 2. Identify demo templates (those created previously with layoutVariant or slug starting with tpl-)
  // Or remove all 199 old templates that have no custom elements
  const deleteResult = await prisma.creativeTemplate.deleteMany({});
  console.log(`[Removed] Deleted ${deleteResult.count} demo template records from database.`);

  // 3. Ensure we have the 4 official categories in place
  const categories = await prisma.creativeCategory.findMany();
  console.log(`[Categories Active] Found ${categories.length} categories:`, categories.map(c => c.name));

  const meetingCat = categories.find(c => c.code === 'MEETING_ANNOUNCEMENT') || categories[0];
  const busCat = categories.find(c => c.code === 'BUSINESS_PRESENTATION') || categories[1];
  const kymCat = categories.find(c => c.code === 'KYM') || categories[2];
  const bdayCat = categories.find(c => c.code === 'BIRTHDAY') || categories[3];

  // 4. Create 4 official starter custom builder templates with real base artwork and configured elements
  // Template 1: JITO Referral Meeting Announcement
  if (meetingCat) {
    const tpl1 = await prisma.creativeTemplate.create({
      data: {
        categoryId: meetingCat.id,
        name: 'Official JITO Referral Meeting Announcement (Master)',
        slug: 'jito-meeting-announcement-master',
        description: 'Official JITO / JBN Referral Chapter weekly business meeting announcement with 6 brand logos and leadership footer.',
        width: 1080,
        height: 1080,
        orientation: 'SQUARE',
        themeStyle: 'minimal-corporate',
        baseDesignUrl: '/reference-design.png',
        previewImageUrl: '/reference-design.png',
        placeholders: '[]',
        status: 'PUBLISHED',
        approvalRequired: false,
        isActive: true,
        sortOrder: 1,
        elements: {
          create: [
            {
              elementType: 'LOGO',
              name: 'JITO Crest Logo',
              posX: 60,
              posY: 40,
              width: 120,
              height: 120,
              styleConfig: JSON.stringify({ logoUrl: '/logos/official/jito-crest.png' }),
            },
            {
              elementType: 'LOGO',
              name: 'JITO Ahmedabad Chapter Logo',
              posX: 220,
              posY: 55,
              width: 180,
              height: 90,
              styleConfig: JSON.stringify({ logoUrl: '/logos/official/jito-ahmedabad.png' }),
            },
            {
              elementType: 'LOGO',
              name: 'JITO Business Network Logo',
              posX: 840,
              posY: 50,
              width: 180,
              height: 100,
              styleConfig: JSON.stringify({ logoUrl: '/logos/official/jito-business-network.png' }),
            },
            {
              elementType: 'DYNAMIC_FIELD',
              fieldKey: 'referralGroupName',
              name: 'Referral Group Name',
              posX: 100,
              posY: 220,
              width: 880,
              height: 60,
              fontFamily: 'Inter',
              fontSize: 36,
              fontWeight: 'bold',
              textColor: '#1E3A8A',
              textAlign: 'center',
            },
            {
              elementType: 'DYNAMIC_FIELD',
              fieldKey: 'date',
              name: 'Meeting Date',
              posX: 140,
              posY: 380,
              width: 380,
              height: 45,
              fontFamily: 'Inter',
              fontSize: 22,
              fontWeight: 'bold',
              textColor: '#1F2937',
              textAlign: 'left',
            },
            {
              elementType: 'DYNAMIC_FIELD',
              fieldKey: 'time',
              name: 'Meeting Time',
              posX: 560,
              posY: 380,
              width: 380,
              height: 45,
              fontFamily: 'Inter',
              fontSize: 22,
              fontWeight: 'bold',
              textColor: '#1F2937',
              textAlign: 'left',
            },
            {
              elementType: 'DYNAMIC_FIELD',
              fieldKey: 'venue',
              name: 'Venue Location',
              posX: 140,
              posY: 460,
              width: 800,
              height: 70,
              fontFamily: 'Inter',
              fontSize: 20,
              fontWeight: 'normal',
              textColor: '#374151',
              textAlign: 'left',
            },
            {
              elementType: 'DYNAMIC_FIELD',
              fieldKey: 'meetingStimulant',
              name: 'Meeting Stimulant Topic',
              posX: 140,
              posY: 560,
              width: 800,
              height: 60,
              fontFamily: 'Inter',
              fontSize: 22,
              fontWeight: 'bold',
              textColor: '#B45309',
              textAlign: 'center',
            },
            {
              elementType: 'FIXED_TEXT',
              fieldKey: 'footerLeadership',
              name: 'Sponsor & Leadership Footer Branding',
              posX: 50,
              posY: 900,
              width: 980,
              height: 140,
              fontFamily: 'Inter',
              fontSize: 14,
              textColor: '#6B7280',
              textAlign: 'center',
              defaultValue: 'Referral Team: Head • Lead • Secretary | JITO Leadership: Chairman • Chief Secretary • Convener',
            },
          ],
        },
      },
    });
    console.log(`[Created] Master Template 1: ${tpl1.name} (${tpl1.id})`);
  }

  // Template 2: Business Presentation
  if (busCat) {
    const tpl2 = await prisma.creativeTemplate.create({
      data: {
        categoryId: busCat.id,
        name: 'Official JITO Business Presentation (Master)',
        slug: 'jito-business-presentation-master',
        description: 'Official 8-minute or feature Business Presentation showcase template with speaker photo and specific ask.',
        width: 1080,
        height: 1080,
        orientation: 'SQUARE',
        themeStyle: 'corporate-slate',
        baseDesignUrl: '/reference-design.png',
        previewImageUrl: '/reference-design.png',
        placeholders: '[]',
        status: 'PUBLISHED',
        approvalRequired: false,
        isActive: true,
        sortOrder: 2,
        elements: {
          create: [
            {
              elementType: 'LOGO',
              name: 'JITO Crest Logo',
              posX: 60,
              posY: 40,
              width: 120,
              height: 120,
              styleConfig: JSON.stringify({ logoUrl: '/logos/official/jito-crest.png' }),
            },
            {
              elementType: 'LOGO',
              name: 'JITO Business Network Logo',
              posX: 840,
              posY: 50,
              width: 180,
              height: 100,
              styleConfig: JSON.stringify({ logoUrl: '/logos/official/jito-business-network.png' }),
            },
            {
              elementType: 'MEMBER_PHOTO',
              fieldKey: 'photoUrl',
              name: 'Presenter Professional Photo',
              posX: 100,
              posY: 300,
              width: 320,
              height: 320,
              styleConfig: JSON.stringify({ shape: 'circle', borderColor: '#D97706', borderWidth: 6 }),
            },
            {
              elementType: 'DYNAMIC_FIELD',
              fieldKey: 'memberName',
              name: 'Speaker Member Name',
              posX: 460,
              posY: 320,
              width: 540,
              height: 50,
              fontFamily: 'Inter',
              fontSize: 32,
              fontWeight: 'bold',
              textColor: '#111827',
              textAlign: 'left',
            },
            {
              elementType: 'DYNAMIC_FIELD',
              fieldKey: 'companyName',
              name: 'Company Name',
              posX: 460,
              posY: 380,
              width: 540,
              height: 40,
              fontFamily: 'Inter',
              fontSize: 22,
              fontWeight: 'bold',
              textColor: '#2563EB',
              textAlign: 'left',
            },
            {
              elementType: 'DYNAMIC_FIELD',
              fieldKey: 'businessCategory',
              name: 'Business Category',
              posX: 460,
              posY: 430,
              width: 540,
              height: 35,
              fontFamily: 'Inter',
              fontSize: 18,
              fontWeight: 'normal',
              textColor: '#4B5563',
              textAlign: 'left',
            },
            {
              elementType: 'DYNAMIC_FIELD',
              fieldKey: 'specificAsk',
              name: 'Specific Referral Ask',
              posX: 100,
              posY: 680,
              width: 880,
              height: 100,
              fontFamily: 'Inter',
              fontSize: 20,
              fontWeight: 'bold',
              textColor: '#1E3A8A',
              textAlign: 'center',
            },
          ],
        },
      },
    });
    console.log(`[Created] Master Template 2: ${tpl2.name} (${tpl2.id})`);
  }

  // Template 3: Know Your Member (KYM)
  if (kymCat) {
    const tpl3 = await prisma.creativeTemplate.create({
      data: {
        categoryId: kymCat.id,
        name: 'Official JITO Know Your Member (KYM) Master',
        slug: 'jito-kym-master',
        description: 'Exclusive KYM spotlight template introducing new and established chapter members.',
        width: 1080,
        height: 1080,
        orientation: 'SQUARE',
        themeStyle: 'clean-editorial',
        baseDesignUrl: '/reference-design.png',
        previewImageUrl: '/reference-design.png',
        placeholders: '[]',
        status: 'PUBLISHED',
        approvalRequired: true, // Configured for approval workflow testing!
        isActive: true,
        sortOrder: 3,
        elements: {
          create: [
            {
              elementType: 'LOGO',
              name: 'JITO Crest Logo',
              posX: 60,
              posY: 40,
              width: 120,
              height: 120,
              styleConfig: JSON.stringify({ logoUrl: '/logos/official/jito-crest.png' }),
            },
            {
              elementType: 'MEMBER_PHOTO',
              fieldKey: 'photoUrl',
              name: 'Member Portrait',
              posX: 120,
              posY: 280,
              width: 320,
              height: 320,
              styleConfig: JSON.stringify({ shape: 'circle', borderColor: '#2563EB', borderWidth: 6 }),
            },
            {
              elementType: 'DYNAMIC_FIELD',
              fieldKey: 'memberName',
              name: 'Member Name',
              posX: 480,
              posY: 300,
              width: 520,
              height: 50,
              fontFamily: 'Inter',
              fontSize: 32,
              fontWeight: 'bold',
              textColor: '#111827',
              textAlign: 'left',
            },
            {
              elementType: 'DYNAMIC_FIELD',
              fieldKey: 'companyName',
              name: 'Enterprise / Brand',
              posX: 480,
              posY: 360,
              width: 520,
              height: 40,
              fontFamily: 'Inter',
              fontSize: 22,
              fontWeight: 'bold',
              textColor: '#B45309',
              textAlign: 'left',
            },
            {
              elementType: 'DYNAMIC_FIELD',
              fieldKey: 'phone',
              name: 'Contact Mobile',
              posX: 480,
              posY: 420,
              width: 520,
              height: 35,
              fontFamily: 'Inter',
              fontSize: 18,
              fontWeight: 'normal',
              textColor: '#374151',
              textAlign: 'left',
            },
          ],
        },
      },
    });
    console.log(`[Created] Master Template 3: ${tpl3.name} (${tpl3.id})`);
  }

  // Template 4: Birthday Celebration
  if (bdayCat) {
    const tpl4 = await prisma.creativeTemplate.create({
      data: {
        categoryId: bdayCat.id,
        name: 'Official JITO Birthday Celebration (Master)',
        slug: 'jito-birthday-celebration-master',
        description: 'Heartfelt birthday greetings creative with celebratory typography and member photo.',
        width: 1080,
        height: 1080,
        orientation: 'SQUARE',
        themeStyle: 'colorful-celebration',
        baseDesignUrl: '/reference-design.png',
        previewImageUrl: '/reference-design.png',
        placeholders: '[]',
        status: 'PUBLISHED',
        approvalRequired: false,
        isActive: true,
        sortOrder: 4,
        elements: {
          create: [
            {
              elementType: 'LOGO',
              name: 'JITO Crest Logo',
              posX: 60,
              posY: 40,
              width: 120,
              height: 120,
              styleConfig: JSON.stringify({ logoUrl: '/logos/official/jito-crest.png' }),
            },
            {
              elementType: 'MEMBER_PHOTO',
              fieldKey: 'photoUrl',
              name: 'Birthday Member Photo',
              posX: 380,
              posY: 240,
              width: 320,
              height: 320,
              styleConfig: JSON.stringify({ shape: 'circle', borderColor: '#F59E0B', borderWidth: 8 }),
            },
            {
              elementType: 'DYNAMIC_FIELD',
              fieldKey: 'memberName',
              name: 'Birthday Member Name',
              posX: 100,
              posY: 600,
              width: 880,
              height: 55,
              fontFamily: 'Inter',
              fontSize: 36,
              fontWeight: 'bold',
              textColor: '#B45309',
              textAlign: 'center',
            },
            {
              elementType: 'DYNAMIC_FIELD',
              fieldKey: 'birthdayWish',
              name: 'Celebration Message',
              posX: 140,
              posY: 670,
              width: 800,
              height: 80,
              fontFamily: 'Inter',
              fontSize: 20,
              fontWeight: 'normal',
              textColor: '#4B5563',
              textAlign: 'center',
            },
          ],
        },
      },
    });
    console.log(`[Created] Master Template 4: ${tpl4.name} (${tpl4.id})`);
  }

  const finalCount = await prisma.creativeTemplate.count();
  console.log(`\n=== Migration Complete ===`);
  console.log(`Old 199 demo templates removed.`);
  console.log(`New Custom Builder Master templates active in database: ${finalCount}`);
}

main()
  .catch((e) => {
    console.error('Error executing script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
