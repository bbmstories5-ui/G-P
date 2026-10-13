const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding SharedFixedContent...');

  const footerData = {
    referralGroup: 'JBN PEARL',
    chapterLocation: 'Ahmedabad',
    mainSponsor: {
      name: 'BONICA JEWELS',
      type: 'REFERRAL MAIN SPONSOR',
      logoUrl: '/logos/official/sponsor-bonica-jewels.png'
    },
    coSponsor: {
      name: 'DHS MULTI SPECIALITY HOSPITAL',
      tagline: 'HEALING TODAY FOR A BETTER TOMORROW',
      type: 'REFERRAL CO-SPONSOR',
      logoUrl: '/logos/official/sponsor-dhs-hospital.png'
    },
    titleSponsor: {
      name: 'PAGARIYA GROUP',
      tagline: 'SINCE 1985',
      type: 'Title Sponsor',
      logoUrl: '/logos/official/sponsor-pagariya-group.png'
    },
    referralTeam: [
      { role: 'Referral Head', name: 'Ketan Patel', phone: '+91 98250 12345' },
      { role: 'Referral Lead', name: 'Jigar Shah', phone: '+91 98251 23456' },
      { role: 'Referral Secretary', name: 'Bhavin Mehta', phone: '+91 98252 34567' }
    ],
    leadership: [
      { designation: 'Chairman', name: 'Sanjeev Chhajer', org: 'JITO Ahmedabad' },
      { designation: 'Chief Secretary', name: 'Asit Shah', org: 'JITO Ahmedabad' },
      { designation: 'JBN Convener', name: 'Rajesh Jain', org: 'JBN Apex' },
      { designation: 'Co-Convener', name: 'Nilesh Mehta', org: 'JBN Apex' }
    ],
    social: {
      website: 'www.jitoahmedabad.org',
      handle: '@jitoahmedabad'
    }
  };

  await prisma.sharedFixedContent.upsert({
    where: { key: 'global_footer_config' },
    update: {
      label: 'Global Footer & Sponsor Leadership Configuration',
      value: JSON.stringify(footerData, null, 2),
      scope: 'GLOBAL'
    },
    create: {
      key: 'global_footer_config',
      label: 'Global Footer & Sponsor Leadership Configuration',
      value: JSON.stringify(footerData, null, 2),
      scope: 'GLOBAL'
    }
  });

  console.log('✅ SharedFixedContent seeded successfully.');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
