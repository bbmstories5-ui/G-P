const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, status: true },
    take: 10
  });
  console.log('Registered Users:');
  console.table(users);
}
main().catch(console.error).finally(() => prisma.$disconnect());
