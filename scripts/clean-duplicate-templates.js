const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const templates = await prisma.creativeTemplate.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, slug: true, createdAt: true, status: true },
  });

  console.log('Found templates:', templates);

  // Group by name
  const seen = new Map();
  const toDelete = [];

  for (const t of templates) {
    const key = t.name.trim().toLowerCase();
    if (seen.has(key)) {
      // It's a duplicate of an earlier (newer) one
      toDelete.push(t);
    } else {
      seen.set(key, t);
    }
  }

  console.log(`Duplicates to remove (${toDelete.length}):`, toDelete.map(t => `${t.name} (${t.id})`));

  for (const t of toDelete) {
    await prisma.$transaction(async (tx) => {
      await tx.generatedCreative.deleteMany({ where: { templateId: t.id } });
      await tx.creativeRequest.deleteMany({ where: { templateId: t.id } });
      await tx.templateElement.deleteMany({ where: { templateId: t.id } });
      await tx.creativeTemplate.delete({ where: { id: t.id } });
    });
    console.log(`Deleted duplicate template: ${t.name} (${t.id})`);
  }

  const remaining = await prisma.creativeTemplate.findMany({
    select: { id: true, name: true, slug: true, status: true },
  });
  console.log('Remaining clean templates:', remaining);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
