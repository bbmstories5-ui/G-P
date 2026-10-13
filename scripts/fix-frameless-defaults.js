const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- FIXING MEMBER_PHOTO ELEMENTS TO BE WITHOUT FRAME BY DEFAULT ---');

  const elements = await prisma.templateElement.findMany({
    where: { elementType: 'MEMBER_PHOTO' },
    include: { template: true },
  });

  console.log(`Found ${elements.length} member photo elements.`);

  for (const el of elements) {
    let styleObj = {};
    if (typeof el.styleConfig === 'string') {
      try { styleObj = JSON.parse(el.styleConfig); } catch {}
    } else if (typeof el.styleConfig === 'object' && el.styleConfig !== null) {
      styleObj = el.styleConfig;
    }

    // If hasFrame was not explicitly set to true, set to without frame
    if (styleObj.hasFrame !== true) {
      const updatedStyle = {
        ...styleObj,
        shape: 'none',
        hasFrame: false,
        borderWidth: 0,
        borderRadius: 0,
      };

      await prisma.templateElement.update({
        where: { id: el.id },
        data: {
          styleConfig: JSON.stringify(updatedStyle),
        },
      });

      console.log(`Updated element [${el.id}] in template "${el.template?.name}" to without frame.`);
    } else {
      console.log(`Element [${el.id}] has explicit frame ${styleObj.shape}, leaving untouched.`);
    }
  }

  console.log('--- ALL MEMBER_PHOTO ELEMENTS CHECKED & UPDATED ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
