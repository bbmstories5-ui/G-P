const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const templateCount = await prisma.creativeTemplate.count();
  const categoryCount = await prisma.creativeCategory.count();
  const userCount = await prisma.user.count();
  const logoCount = await prisma.brandLogo.count();
  console.log({ templateCount, categoryCount, userCount, logoCount });

  const categories = await prisma.creativeCategory.findMany({
    include: {
      _count: { select: { templates: true } }
    }
  });
  console.log('Categories:', categories.map(c => ({ code: c.code, name: c.name, templates: c._count.templates })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
