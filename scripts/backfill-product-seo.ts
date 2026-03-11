import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { generateProductSeoWithAi } from "@/lib/product-seo-ai";

async function main() {
  const overwrite = process.argv.includes("--overwrite");
  const products = await prisma.product.findMany({
    include: {
      category: { select: { name: true } },
      brand: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  let updatedCount = 0;
  let failedCount = 0;

  for (const product of products) {
    if (!overwrite && product.metaTitle && product.metaDescription) {
      continue;
    }

    try {
      const generated = await generateProductSeoWithAi({
        name: product.name,
        description: product.description,
        category: product.category.name,
        brand: product.brand?.name,
        price: product.price,
        comparePrice: product.comparePrice,
      });

      await prisma.product.update({
        where: { id: product.id },
        data: {
          metaTitle: generated.seoTitle,
          metaDescription: generated.metaDescription,
        },
      });

      updatedCount += 1;
      console.log(`[${updatedCount}/${products.length}] SEO atualizado para: ${product.name}`);
    } catch (error) {
      failedCount += 1;
      console.error(`Falha ao atualizar SEO do produto: ${product.name}`);
      console.error(error);
    }
  }

  console.log(`Concluído. ${updatedCount} produto(s) atualizados. ${failedCount} falha(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });