import { PrismaClient, ProductStatus } from "@prisma/client";
import { buildProductMetaDescription, buildProductSeoTitle, generateProductSlug } from "../src/lib/product-seo";
import { generateProductSeoWithAi } from "../src/lib/product-seo-ai";

const prisma = new PrismaClient();
const DEFAULT_IMPORTED_VARIANT_QUANTITY = 20;

function buildImageAlt(productTitle: string, position: number) {
  return position === 0
    ? `${productTitle} da Luxijóias`
    : `${productTitle} da Luxijóias - imagem ${position + 1}`;
}

type SourceProduct = {
  sourceUrl: string;
  sourceTitle: string;
  sourceDescription: string;
  categoryName: string;
  categorySlug: string;
  brandName: string;
  brandSlug: string;
  price: number;
  comparePrice?: number;
  image: string;
  images?: string[];
  variants: Array<{ type: string; label: string }>;
  variantImages?: Record<string, string>;
  sku: string;
};

const products: SourceProduct[] = [
  {
    sourceUrl: "https://www.lunaacessorios.com.br/conjunto-princess-cravejado/",
    sourceTitle: "Conjunto Princess cravejado",
    sourceDescription: "Conjunto com colar e brincos em semijoia banhada a 70 milésimos de prata, com acabamento delicado e visual cravejado. Peça hipoalergênica, pensada para compor looks femininos com brilho elegante no dia a dia ou em ocasiões especiais.",
    categoryName: "Colares",
    categorySlug: "colares",
    brandName: "Luna Acessórios",
    brandSlug: "luna-acessorios",
    price: 34.9,
    image: "https://cdn.sistemawbuy.com.br/arquivos/33db406b2455e7081597938a9aec7257/produtos/69adad46e136d/52326-69adad4d69dee.jpg",
    images: [
      "https://cdn.sistemawbuy.com.br/arquivos/33db406b2455e7081597938a9aec7257/produtos/69adad46e136d/52326-69adad4d69dee.jpg",
    ],
    variants: [
      { type: "Cor", label: "Rosa" },
      { type: "Cor", label: "Azul" },
      { type: "Cor", label: "Cristal" },
    ],
    sku: "LUNA-CO665",
  },
  {
    sourceUrl: "https://www.lunaacessorios.com.br/anel-regulavel-letra-cravejada/",
    sourceTitle: "Anel regulável letra cravejada",
    sourceDescription: "Anel regulável em semijoia banhada a 70 milésimos de prata, com letra cravejada em destaque e acabamento hipoalergênico. Modelo versátil para presentear ou personalizar a composição com a inicial desejada.",
    categoryName: "Anéis",
    categorySlug: "aneis",
    brandName: "Luna Acessórios",
    brandSlug: "luna-acessorios",
    price: 39.9,
    image: "https://cdn.sistemawbuy.com.br/arquivos/33db406b2455e7081597938a9aec7257/produtos/69adbc5d95a4d/52256-69adbc8fcdf54.jpg",
    images: [
      "https://cdn.sistemawbuy.com.br/arquivos/33db406b2455e7081597938a9aec7257/produtos/69adbc5d95a4d/52256-69adbc8fcdf54.jpg",
    ],
    variants: [
      "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "P", "R", "S", "T", "V",
    ].map((letter) => ({ type: "Letra cravejada", label: letter })),
    sku: "LUNA-AN7273",
  },
  {
    sourceUrl: "https://www.lunaacessorios.com.br/bolsa-moon/",
    sourceTitle: "Bolsa moon Ester",
    sourceDescription: "Bolsa confortável para levar o essencial, com alça única e fecho de zíper. Modelo em couro sintético com largura aproximada de 5 cm, altura de 20 cm e comprimento de 24 cm, ideal para uso diário com proposta prática e elegante.",
    categoryName: "Bolsas",
    categorySlug: "bolsas",
    brandName: "Luna Acessórios",
    brandSlug: "luna-acessorios",
    price: 39.9,
    image: "https://cdn.sistemawbuy.com.br/arquivos/33db406b2455e7081597938a9aec7257/produtos/69880c960a32f/screenshot_20260208_011427_gallery-69880dbaa0163.jpg",
    images: [
      "https://cdn.sistemawbuy.com.br/arquivos/33db406b2455e7081597938a9aec7257/produtos/69880c960a32f/screenshot_20260208_011427_gallery-69880dbaa0163.jpg",
      "https://cdn.sistemawbuy.com.br/arquivos/33db406b2455e7081597938a9aec7257/produtos/69880c960a32f/screenshot_20260208_011436_gallery-69880dba908de.jpg",
    ],
    variants: [
      { type: "Cor", label: "Preto" },
      { type: "Cor", label: "Marrom" },
      { type: "Cor", label: "Branca" },
    ],
    sku: "LUNA-BL61509",
  },
];

function parseJsonCandidate(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) return trimmed;
  const match = trimmed.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

async function generateSeo(product: SourceProduct) {
  const fallbackTitle = buildProductSeoTitle({
    name: product.sourceTitle,
    category: product.categoryName,
    brand: product.brandName,
    price: product.price,
    siteName: "Luxijóias",
  });
  const fallbackDescription = buildProductMetaDescription({
    name: product.sourceTitle,
    description: product.sourceDescription,
    category: product.categoryName,
    brand: product.brandName,
    price: product.price,
    siteName: "Luxijóias",
  });

  try {
    const parsed = await generateProductSeoWithAi({
      name: product.sourceTitle,
      description: product.sourceDescription,
      brand: product.brandName,
      category: product.categoryName,
      price: product.price,
      comparePrice: product.comparePrice,
    });

    return {
      title: (parsed.title || product.sourceTitle).trim(),
      slug: generateProductSlug(parsed.slug || parsed.title || product.sourceTitle),
      description: (parsed.description || product.sourceDescription).trim(),
      metaTitle: (parsed.seoTitle || fallbackTitle).trim(),
      metaDescription: (parsed.metaDescription || fallbackDescription).trim(),
    };
  } catch {
    return {
      title: product.sourceTitle,
      slug: generateProductSlug(product.sourceTitle),
      description: product.sourceDescription,
      metaTitle: fallbackTitle,
      metaDescription: fallbackDescription,
    };
  }
}

async function main() {
  console.log("[luna-pilot] Iniciando reset seguro do catálogo...");

  await prisma.product.updateMany({
    data: {
      status: ProductStatus.ARCHIVED,
    },
  });

  const categoryMap = new Map<string, string>();
  for (const entry of Array.from(new Set(products.map((item) => `${item.categorySlug}|${item.categoryName}`)))) {
    const [slug, name] = entry.split("|");
    const category = await prisma.category.upsert({
      where: { slug },
      update: { name },
      create: { slug, name },
    });
    categoryMap.set(slug, category.id);
  }

  const brandMap = new Map<string, string>();
  for (const entry of Array.from(new Set(products.map((item) => `${item.brandSlug}|${item.brandName}`)))) {
    const [slug, name] = entry.split("|");
    const brand = await prisma.brand.upsert({
      where: { slug },
      update: { name },
      create: { slug, name },
    });
    brandMap.set(slug, brand.id);
  }

  for (const source of products) {
    const seo = await generateSeo(source);
    const importedVariantQuantity = source.variants.length * DEFAULT_IMPORTED_VARIANT_QUANTITY;
    const galleryImages = Array.from(new Set([source.image, ...(source.images ?? [])]));
    const primaryImage = galleryImages[0] ?? source.image;
    const productData = {
      name: seo.title,
      slug: seo.slug,
      description: seo.description,
      metaTitle: seo.metaTitle,
      metaDescription: seo.metaDescription,
      image: primaryImage,
      price: source.price,
      comparePrice: source.comparePrice ?? null,
      sku: source.sku,
      quantity: importedVariantQuantity || DEFAULT_IMPORTED_VARIANT_QUANTITY,
      status: ProductStatus.ACTIVE,
      categoryId: categoryMap.get(source.categorySlug)!,
      brandId: brandMap.get(source.brandSlug)!,
    };

    const existing = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: source.sku },
          { slug: seo.slug },
        ],
      },
      select: { id: true },
    });

    const created = existing
      ? await prisma.product.update({
          where: { id: existing.id },
          data: productData,
        })
      : await prisma.product.create({
          data: productData,
        });

    await prisma.productImage.deleteMany({ where: { productId: created.id } });
    await prisma.productImage.createMany({
      data: galleryImages.map((url, index) => ({
        productId: created.id,
        url,
        position: index,
        alt: buildImageAlt(seo.title, index),
      })),
    });

    await prisma.productVariant.deleteMany({ where: { productId: created.id } });
    await prisma.productVariant.createMany({
      data: source.variants.map((variant, index) => ({
        productId: created.id,
        name: `${variant.type}: ${variant.label}`,
        sku: `${source.sku}-${String(index + 1).padStart(2, "0")}`,
        price: source.price,
        quantity: DEFAULT_IMPORTED_VARIANT_QUANTITY,
        image: source.variantImages?.[variant.label.toLowerCase()] ?? primaryImage,
        isActive: true,
      })),
    });

    console.log(`[luna-pilot] Produto importado: ${seo.title} (${seo.slug})`);
  }

  console.log("[luna-pilot] Importação piloto concluída com 3 produtos ativos.");
}

main().catch((error) => {
  console.error("[luna-pilot] Falha:", error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});