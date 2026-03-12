import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { metaTitle: null },
        { metaDescription: null },
        { metaTitle: "" },
        { metaDescription: "" },
      ],
    },
    include: {
      category: { select: { name: true, slug: true } },
      brand: { select: { name: true, slug: true } },
      variants: { select: { name: true, price: true, quantity: true } },
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  console.log(JSON.stringify(products.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    category: product.category.name,
    brand: product.brand?.name ?? null,
    descriptionSnippet: product.description?.split("\n").slice(0, 14),
    variants: product.variants.map((variant) => variant.name),
  })), null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
