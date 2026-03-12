import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    include: {
      category: { select: { name: true, slug: true } },
      brand: { select: { name: true, slug: true } },
      variants: { select: { id: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  const summary = products.map((product) => ({
    name: product.name,
    slug: product.slug,
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    category: product.category.name,
    brand: product.brand?.name ?? null,
    variants: product.variants.length,
    descriptionSnippet: product.description?.split("\n").slice(0, 18),
    updatedAt: product.updatedAt,
  }));

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
