const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const published = await prisma.creativeTemplate.count({ where: { status: 'PUBLISHED' } });
  const drafts = await prisma.creativeTemplate.count({ where: { status: 'DRAFT' } });
  const total = await prisma.creativeTemplate.count();
  const byCat = await prisma.creativeCategory.findMany({
    include: {
      _count: {
        select: { templates: true }
      }
    }
  });

  console.log({ published, drafts, total, byCat: byCat.map(c => ({ name: c.name, code: c.code, count: c._count.templates })) });
}

main().finally(() => prisma.$disconnect());
