const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function backup() {
  console.log('--- Starting Template and Creative Backup ---');
  const backupDir = path.join(__dirname, '..', 'prisma', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const templates = await prisma.creativeTemplate.findMany();
  const categories = await prisma.creativeCategory.findMany();
  const logos = await prisma.brandLogo.findMany();
  const creatives = await prisma.generatedCreative.findMany();

  const backupData = {
    timestamp: new Date().toISOString(),
    templatesCount: templates.length,
    categoriesCount: categories.length,
    logosCount: logos.length,
    creativesCount: creatives.length,
    categories,
    logos,
    templates,
    creatives
  };

  const backupPath = path.join(backupDir, `templates-backup-${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`✅ Backup successfully saved to ${backupPath}`);
  console.log(`Summary: ${templates.length} templates, ${categories.length} categories, ${logos.length} logos, ${creatives.length} creatives.`);
}

backup()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
