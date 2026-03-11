import { PrismaClient, ProductStatus } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "Anéis", slug: "aneis" },
  { name: "Colares", slug: "colares" },
  { name: "Pulseiras", slug: "pulseiras" },
  { name: "Acessórios", slug: "acessorios" },
  { name: "Ofertas", slug: "ofertas" },
];

const brands = [
  { name: "Luna Dourada", slug: "luna-dourada" },
  { name: "Ateliê Aurora", slug: "atelie-aurora" },
  { name: "Essenza", slug: "essenza" },
  { name: "Clássica Joias", slug: "classica-joias" },
];

const products = [
  ["anel-luna-cristal", "Anel Luna Cristal", "aneis", "luna-dourada", 149.9, 189.9, "ANEL-LUNA-01", 22, "/demo-products/anel-luna.svg"],
  ["anel-aura-vintage", "Anel Aura Vintage", "aneis", "atelie-aurora", 169.9, 209.9, "ANEL-AURA-02", 15, "/demo-products/anel-aura.svg"],
  ["colar-essenza-perola", "Colar Essenza Pérola", "colares", "essenza", 219.9, 269.9, "COLAR-ESS-01", 18, "/demo-products/colar-perola.svg"],
  ["colar-constelacao", "Colar Constelação Dourado", "colares", "luna-dourada", 199.9, 249.9, "COLAR-LUNA-02", 27, "/demo-products/colar-constelacao.svg"],
  ["pulseira-charme-elos", "Pulseira Charme Elos", "pulseiras", "classica-joias", 129.9, 169.9, "PULS-CLASS-01", 31, "/demo-products/pulseira-elos.svg"],
  ["pulseira-luz-zirconia", "Pulseira Luz Zircônia", "pulseiras", "essenza", 189.9, 239.9, "PULS-ESS-02", 20, "/demo-products/pulseira-zirconia.svg"],
  ["argola-aurora-glam", "Argola Aurora Glam", "acessorios", "atelie-aurora", 119.9, 149.9, "ACESS-AUR-01", 40, "/demo-products/argola-glam.svg"],
  ["brinco-gota-royal", "Brinco Gota Royal", "acessorios", "classica-joias", 139.9, 179.9, "ACESS-ROY-02", 25, "/demo-products/brinco-gota.svg"],
  ["mix-aneis-premium", "Mix de Anéis Premium", "ofertas", "luna-dourada", 249.9, 329.9, "OFERTA-MIX-01", 12, "/demo-products/mix-aneis.svg"],
  ["kit-colar-pulseira-elegance", "Kit Colar + Pulseira Elegance", "ofertas", "essenza", 289.9, 389.9, "OFERTA-KIT-02", 10, "/demo-products/kit-elegance.svg"],
] as const;

const posts = [
  {
    slug: "como-cuidar-das-semijoias",
    title: "Como cuidar das semijoias para manter brilho e durabilidade",
    excerpt: "Veja os cuidados simples que ajudam a preservar banho, pedras e acabamento das peças por muito mais tempo.",
    content:
      "Semijoias de qualidade merecem uma rotina de cuidado tão especial quanto o brilho que entregam. Evite contato com perfumes, cremes e produtos de limpeza antes de vestir a peça. Depois do uso, limpe com flanela macia e guarde em local seco, de preferência em compartimentos separados.\n\nOutro ponto importante é retirar anéis, pulseiras e colares antes do banho, piscina ou academia. O contato frequente com suor, cloro e umidade pode reduzir a vida útil do banho. Com atenção diária e armazenamento correto, suas peças continuam elegantes em diversas ocasiões.",
    coverImage: "/demo-products/banner-hero.svg",
    tags: "cuidados, semijoias, conservação",
    featured: true,
  },
  {
    slug: "tendencias-de-presentes-para-2026",
    title: "Tendências de presentes com semijoias para 2026",
    excerpt: "Descubra combinações elegantes para presentear com mais intenção em aniversários, datas românticas e celebrações especiais.",
    content:
      "Presentear com semijoias continua entre as escolhas mais sofisticadas e afetivas. Em 2026, conjuntos coordenados, argolas com presença e colares com significado ganham destaque por serem versáteis e fáceis de combinar.\n\nAo montar uma curadoria de presentes, vale considerar estilo pessoal, frequência de uso e a proposta da ocasião. Kits com colar e pulseira, por exemplo, elevam o valor percebido e ajudam a compor uma experiência mais memorável para quem recebe.",
    coverImage: "/demo-products/kit-elegance.svg",
    tags: "presentes, tendencias, kits",
    featured: false,
  },
  {
    slug: "guia-para-combinar-aneis-e-pulseiras",
    title: "Guia para combinar anéis e pulseiras sem exagero",
    excerpt: "Aprenda a equilibrar volumes, texturas e pontos de brilho para criar composições elegantes no dia a dia.",
    content:
      "A composição ideal começa pelo equilíbrio. Se o anel for protagonista, a pulseira pode seguir uma linha mais leve. Quando o objetivo é criar impacto, a dica é repetir o mesmo tom metálico para manter unidade visual.\n\nTambém funciona observar a proporção entre punho e dedos: peças muito robustas nos dois pontos ao mesmo tempo tendem a pesar o visual. Misturar texturas com coerência, alternando lisos e cravejados, entrega sofisticação sem excesso.",
    coverImage: "/demo-products/mix-aneis.svg",
    tags: "estilo, aneis, pulseiras",
    featured: false,
  },
] as const;

async function main() {
  const categoryMap = new Map<string, string>();
  for (const category of categories) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });
    categoryMap.set(category.slug, saved.id);
  }

  const brandMap = new Map<string, string>();
  for (const brand of brands) {
    const saved = await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: { name: brand.name },
      create: brand,
    });
    brandMap.set(brand.slug, saved.id);
  }

  for (const [slug, name, categorySlug, brandSlug, price, comparePrice, sku, quantity, image] of products) {
    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        name,
        description: `${name} com acabamento premium, brilho sofisticado e composição pensada para presentear e elevar a vitrine da loja.`,
        price,
        comparePrice,
        sku,
        quantity,
        image,
        status: ProductStatus.ACTIVE,
        categoryId: categoryMap.get(categorySlug)!,
        brandId: brandMap.get(brandSlug)!,
      },
      create: {
        slug,
        name,
        description: `${name} com acabamento premium, brilho sofisticado e composição pensada para presentear e elevar a vitrine da loja.`,
        price,
        comparePrice,
        sku,
        quantity,
        image,
        status: ProductStatus.ACTIVE,
        categoryId: categoryMap.get(categorySlug)!,
        brandId: brandMap.get(brandSlug)!,
      },
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: [
        { productId: product.id, url: image, position: 0 },
      ],
    });
  }

  await prisma.banner.upsert({
    where: { id: "demo-hero-banner" },
    update: {
      title: "Coleção Premium",
      subtitle: "Novidades com brilho, presença e preço especial no Pix.",
      imageUrl: "/demo-products/banner-hero.svg",
      mobileUrl: "/demo-products/banner-hero.svg",
      href: "/search?q=premium",
      placement: "hero",
      isActive: true,
      position: 0,
    },
    create: {
      id: "demo-hero-banner",
      title: "Coleção Premium",
      subtitle: "Novidades com brilho, presença e preço especial no Pix.",
      imageUrl: "/demo-products/banner-hero.svg",
      mobileUrl: "/demo-products/banner-hero.svg",
      href: "/search?q=premium",
      placement: "hero",
      isActive: true,
      position: 0,
    },
  });

  for (const post of posts) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        coverImage: post.coverImage,
        authorName: "Equipe JoJoias",
        tags: post.tags,
        featured: post.featured,
        isPublished: true,
        publishedAt: new Date("2026-03-07T10:00:00.000Z"),
      },
      create: {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        coverImage: post.coverImage,
        authorName: "Equipe JoJoias",
        tags: post.tags,
        featured: post.featured,
        isPublished: true,
        publishedAt: new Date("2026-03-07T10:00:00.000Z"),
      },
    });
  }

  console.log("Catálogo demo atualizado com sucesso.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
