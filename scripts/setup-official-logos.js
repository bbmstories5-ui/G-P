const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const srcDir = path.join(__dirname, '..', 'public', 'logos', 'jito');
const targetDir = path.join(__dirname, '..', 'public', 'logos', 'official');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const logoMap = [
  {
    src: '01_JITO_International_Trade_Organisation.png',
    dest: 'jito-crest.png',
    name: 'JITO Crest (Jain International Trade Organisation)',
    slug: 'jito-crest',
    sortOrder: 1,
    isDefault: false
  },
  {
    src: '02_JITO_Ahmedabad.png',
    dest: 'jito-ahmedabad.png',
    name: 'JITO Ahmedabad',
    slug: 'jito-ahmedabad',
    sortOrder: 2,
    isDefault: true
  },
  {
    src: '03_JITO_Business_Network.png',
    dest: 'jito-business-network.png',
    name: 'JITO Business Network (JBN)',
    slug: 'jito-business-network',
    sortOrder: 3,
    isDefault: false
  },
  {
    src: '06_Pagariya_Group.png',
    dest: 'sponsor-pagariya-group.png',
    name: 'Title Sponsor — Pagariya Group',
    slug: 'sponsor-pagariya-group',
    sortOrder: 4,
    isDefault: false
  },
  {
    src: '05_Bonica_Jewels.png',
    dest: 'sponsor-bonica-jewels.png',
    name: 'Referral Main Sponsor — Bonica Jewels',
    slug: 'sponsor-bonica-jewels',
    sortOrder: 5,
    isDefault: false
  },
  {
    src: '04_DHS_Multi_Speciality_Hospital.png',
    dest: 'sponsor-dhs-hospital.png',
    name: 'Referral Co-Sponsor — DHS Multi Speciality Hospital',
    slug: 'sponsor-dhs-hospital',
    sortOrder: 6,
    isDefault: false
  }
];

async function setup() {
  console.log('--- Setting up Official 6 Logos ---');
  for (const item of logoMap) {
    const srcPath = path.join(srcDir, item.src);
    const destPath = path.join(targetDir, item.dest);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied ${item.src} -> ${item.dest}`);
    } else {
      console.warn(`File not found: ${srcPath}`);
    }

    const publicUrl = `/logos/official/${item.dest}`;
    await prisma.brandLogo.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        logoUrl: publicUrl,
        isActive: true,
        sortOrder: item.sortOrder,
        isDefault: item.isDefault
      },
      create: {
        name: item.name,
        slug: item.slug,
        logoUrl: publicUrl,
        isActive: true,
        sortOrder: item.sortOrder,
        isDefault: item.isDefault
      }
    });
    console.log(`Database BrandLogo synchronized: ${item.name}`);
  }
  console.log('✅ Official Logos setup complete.');
}

setup().catch(console.error).finally(() => prisma.$disconnect());
