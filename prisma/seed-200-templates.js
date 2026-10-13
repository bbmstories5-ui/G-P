const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== SEEDING 200 MODERN CREATIVE TEMPLATES & 6 BRAND LOGOS ===');

  // 1. Categories
  const categories = [
    {
      code: 'MEETING_ANNOUNCEMENT',
      name: 'Referral Meeting Announcement',
      description: 'Announce chapter meetings with date, time, venue, stimulants, dress code, and visitor fees.',
      icon: 'Calendar',
      sortOrder: 1,
    },
    {
      code: 'BUSINESS_PRESENTATION',
      name: 'Business Presentation',
      description: 'Highlight 8-min or 10-min member feature presentation, credentials, and specific asks.',
      icon: 'Presentation',
      sortOrder: 2,
    },
    {
      code: 'KYM',
      name: 'Know Your Member (KYM)',
      description: 'Official member profile showcase with clear portrait, company, business category, and contact details.',
      icon: 'UserCheck',
      sortOrder: 3,
    },
    {
      code: 'BIRTHDAY',
      name: 'Birthday Creative',
      description: 'Celebrate member birthdays with single member creatives, monthly multi-member directories, and exportable Word (.docx) rosters.',
      icon: 'Cake',
      sortOrder: 4,
    },
  ];

  const categoryMap = {};
  for (const cat of categories) {
    const upserted = await prisma.creativeCategory.upsert({
      where: { code: cat.code },
      update: {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
      create: {
        code: cat.code,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
    });
    categoryMap[cat.code] = upserted.id;
  }
  console.log('✓ 4 Creative Categories configured');

  // 2. Six Brand Logos
  const logos = [
    {
      name: 'Apex Referral Chapter',
      slug: 'apex-referral-chapter',
      logoUrl: '/logos/logo-1-apex-crest.svg',
      darkLogoUrl: '/logos/logo-1-apex-crest-dark.svg',
      isDefault: true,
      sortOrder: 1,
    },
    {
      name: 'Titans Executive Network',
      slug: 'titans-executive-network',
      logoUrl: '/logos/logo-2-titans-network.svg',
      darkLogoUrl: '/logos/logo-2-titans-network-dark.svg',
      isDefault: false,
      sortOrder: 2,
    },
    {
      name: 'Synergy Business Alliance',
      slug: 'synergy-business-alliance',
      logoUrl: '/logos/logo-3-synergy-alliance.svg',
      darkLogoUrl: '/logos/logo-3-synergy-alliance-dark.svg',
      isDefault: false,
      sortOrder: 3,
    },
    {
      name: 'Vanguard Commerce Club',
      slug: 'vanguard-commerce-club',
      logoUrl: '/logos/logo-4-vanguard-circle.svg',
      darkLogoUrl: '/logos/logo-4-vanguard-circle-dark.svg',
      isDefault: false,
      sortOrder: 4,
    },
    {
      name: 'Nexus Global Leaders',
      slug: 'nexus-global-leaders',
      logoUrl: '/logos/logo-5-nexus-global.svg',
      darkLogoUrl: '/logos/logo-5-nexus-global-dark.svg',
      isDefault: false,
      sortOrder: 5,
    },
    {
      name: 'Empower Enterprise Circle',
      slug: 'empower-enterprise-circle',
      logoUrl: '/logos/logo-6-empower-circle.svg',
      darkLogoUrl: '/logos/logo-6-empower-circle-dark.svg',
      isDefault: false,
      sortOrder: 6,
    },
  ];

  for (const l of logos) {
    await prisma.brandLogo.upsert({
      where: { slug: l.slug },
      update: {
        name: l.name,
        logoUrl: l.logoUrl,
        darkLogoUrl: l.darkLogoUrl,
        isDefault: l.isDefault,
        sortOrder: l.sortOrder,
        isActive: true,
      },
      create: {
        name: l.name,
        slug: l.slug,
        logoUrl: l.logoUrl,
        darkLogoUrl: l.darkLogoUrl,
        isDefault: l.isDefault,
        sortOrder: l.sortOrder,
        isActive: true,
      },
    });
  }
  console.log('✓ 6 Brand Logos seeded into Logo Library');

  // 3. Import 200 Template Definitions
  // We can load from TypeScript via compiled/transpiled JS or define helper
  const { ALL_200_TEMPLATES } = require('../src/lib/templatesCatalog.ts');

  console.log(`Starting upsert of ${ALL_200_TEMPLATES.length} templates...`);

  let seededCount = 0;
  for (const tpl of ALL_200_TEMPLATES) {
    const catId = categoryMap[tpl.categoryCode];
    if (!catId) continue;

    await prisma.creativeTemplate.upsert({
      where: { slug: tpl.slug },
      update: {
        categoryId: catId,
        name: tpl.name,
        description: tpl.description,
        width: tpl.width,
        height: tpl.height,
        orientation: tpl.orientation,
        themeStyle: tpl.themeStyle,
        logoPosition: tpl.logoPosition,
        logoMaxWidth: tpl.logoMaxWidth,
        logoMaxHeight: tpl.logoMaxHeight,
        layoutVariant: tpl.layoutVariant,
        placeholders: JSON.stringify(tpl.placeholders),
        stylingConfig: JSON.stringify(tpl.stylingConfig),
        isActive: true,
        isDefault: Boolean(tpl.isDefault),
        sortOrder: tpl.sortOrder,
      },
      create: {
        categoryId: catId,
        name: tpl.name,
        slug: tpl.slug,
        description: tpl.description,
        width: tpl.width,
        height: tpl.height,
        orientation: tpl.orientation,
        themeStyle: tpl.themeStyle,
        logoPosition: tpl.logoPosition,
        logoMaxWidth: tpl.logoMaxWidth,
        logoMaxHeight: tpl.logoMaxHeight,
        layoutVariant: tpl.layoutVariant,
        placeholders: JSON.stringify(tpl.placeholders),
        stylingConfig: JSON.stringify(tpl.stylingConfig),
        isActive: true,
        isDefault: Boolean(tpl.isDefault),
        sortOrder: tpl.sortOrder,
      },
    });
    seededCount++;
  }

  console.log(`✓ Exactly ${seededCount} templates seeded across 4 categories!`);

  // Clean up any old templates that are not in the 200 catalog
  const validSlugs = ALL_200_TEMPLATES.map((t) => t.slug);
  const deletedOld = await prisma.creativeTemplate.deleteMany({
    where: {
      slug: { notIn: validSlugs },
    },
  });
  if (deletedOld.count > 0) {
    console.log(`✓ Cleaned up ${deletedOld.count} obsolete legacy templates`);
  }

  // Verify exact counts per category
  for (const cat of categories) {
    const c = await prisma.creativeTemplate.count({
      where: { categoryId: categoryMap[cat.code] },
    });
    console.log(`   - ${cat.name}: ${c} templates`);
  }

  const totalActive = await prisma.creativeTemplate.count({ where: { isActive: true } });
  console.log(`Total Active Templates in DB: ${totalActive} (Must be exactly 200)`);

  console.log('=== COMPLETE ===');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
