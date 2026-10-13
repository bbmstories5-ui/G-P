const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const templates = await prisma.creativeTemplate.findMany({
    include: { elements: true, category: true },
    orderBy: { updatedAt: 'desc' },
  });

  console.log(`=== CHECKING TEMPLATES FOR MEMBER_PHOTO (${templates.length} templates) ===`);
  for (const t of templates) {
    const photos = t.elements.filter(e => e.elementType === 'MEMBER_PHOTO');
    if (photos.length > 0) {
      console.log(`\nTemplate [${t.id}] "${t.name}" (${t.category?.code})`);
      photos.forEach(p => {
        console.log(`  Photo Element [${p.id}]:`);
        console.log(`    styleConfig:`, p.styleConfig);
        console.log(`    x=${p.posX}, y=${p.posY}, w=${p.width}, h=${p.height}`);
      });
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
