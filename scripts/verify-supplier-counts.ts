import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const brands = await prisma.brand.findMany({
    where: {
      slug: { in: ["rd-carvalho-joias", "dmanu-semijoias"] },
    },
    select: {
      name: true,
      slug: true,
      _count: { select: { products: true } },
    },
    orderBy: { slug: "asc" },
  });

  console.log(JSON.stringify(brands, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
