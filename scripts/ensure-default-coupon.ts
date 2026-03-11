import { prisma } from "../src/lib/prisma";

async function main() {
  const coupon = await prisma.coupon.upsert({
    where: { code: "PRIM" },
    update: {
      name: "Primeira compra",
      description: "10% de desconto na primeira compra.",
      type: "PERCENTAGE",
      value: 10,
      isActive: true,
    },
    create: {
      code: "PRIM",
      name: "Primeira compra",
      description: "10% de desconto na primeira compra.",
      type: "PERCENTAGE",
      value: 10,
      isActive: true,
    },
    select: {
      code: true,
      name: true,
      type: true,
      value: true,
      isActive: true,
    },
  });

  console.log(JSON.stringify({ coupon }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });