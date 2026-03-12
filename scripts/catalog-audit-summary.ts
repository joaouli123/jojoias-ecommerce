import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const [activeCount, withSpecsHeading, withInfoHeading, missingMeta, recentlyUpdated] = await Promise.all([
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.product.count({ where: { status: "ACTIVE", description: { contains: "Especificações técnicas:" } } }),
    prisma.product.count({ where: { status: "ACTIVE", description: { contains: "Informações importantes:" } } }),
    prisma.product.count({ where: { status: "ACTIVE", OR: [{ metaTitle: null }, { metaDescription: null }] } }),
    prisma.product.count({ where: { status: "ACTIVE", updatedAt: { gte: new Date(Date.now() - 1000 * 60 * 30) } } }),
  ]);

  console.log(JSON.stringify({ activeCount, withSpecsHeading, withInfoHeading, missingMeta, recentlyUpdated }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
