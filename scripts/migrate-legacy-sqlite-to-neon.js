/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("node:path");
const sqlite3 = require("sqlite3");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const sources = [
  {
    key: "catalog",
    filePath: path.join(process.cwd(), "prisma", "prisma", "dev.db"),
  },
  {
    key: "legacy",
    filePath: path.join(process.cwd(), "prisma", "dev.db"),
  },
];

function openSqlite(filePath) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(filePath, sqlite3.OPEN_READONLY, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(db);
    });
  });
}

function closeSqlite(db) {
  return new Promise((resolve) => db.close(resolve));
}

function tableExists(db, tableName) {
  return new Promise((resolve, reject) => {
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name = ?", [tableName], (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(Boolean(row?.name));
    });
  });
}

function readRows(db, tableName) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM "${tableName}"`, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });
}

function asDate(value) {
  if (!value) return null;
  return new Date(value);
}

function toBoolean(value) {
  return Boolean(value);
}

function normalizeString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function loadSourceRows(source, tableName) {
  const exists = await tableExists(source.db, tableName);
  if (!exists) return [];

  const rows = await readRows(source.db, tableName);
  return rows.map((row) => ({ ...row, __source: source.key }));
}

async function upsertCategory(row) {
  return prisma.category.upsert({
    where: { slug: row.slug },
    update: {
      name: row.name,
      updatedAt: asDate(row.updatedAt) ?? undefined,
    },
    create: {
      id: row.id,
      name: row.name,
      slug: row.slug,
      createdAt: asDate(row.createdAt) ?? undefined,
      updatedAt: asDate(row.updatedAt) ?? undefined,
    },
  });
}

async function upsertBrand(row) {
  return prisma.brand.upsert({
    where: { slug: row.slug },
    update: {
      name: row.name,
      updatedAt: asDate(row.updatedAt) ?? undefined,
    },
    create: {
      id: row.id,
      name: row.name,
      slug: row.slug,
      createdAt: asDate(row.createdAt) ?? undefined,
      updatedAt: asDate(row.updatedAt) ?? undefined,
    },
  });
}

async function upsertUser(row) {
  return prisma.user.upsert({
    where: { email: row.email },
    update: {
      name: row.name,
      password: row.password ?? undefined,
      role: row.role,
      phone: row.phone ?? undefined,
      updatedAt: asDate(row.updatedAt) ?? undefined,
    },
    create: {
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password ?? null,
      role: row.role,
      phone: row.phone ?? null,
      createdAt: asDate(row.createdAt) ?? undefined,
      updatedAt: asDate(row.updatedAt) ?? undefined,
    },
  });
}

async function upsertProduct(row, mappedCategoryId, mappedBrandId) {
  const existingBySlug = row.slug ? await prisma.product.findUnique({ where: { slug: row.slug } }) : null;
  const existingBySku = !existingBySlug && row.sku ? await prisma.product.findUnique({ where: { sku: row.sku } }) : null;
  const existing = existingBySlug ?? existingBySku;

  if (existing) {
    return prisma.product.update({
      where: { id: existing.id },
      data: {
        name: row.name,
        slug: row.slug,
        description: row.description ?? null,
        price: row.price,
        comparePrice: row.comparePrice ?? null,
        sku: row.sku ?? null,
        quantity: row.quantity ?? 0,
        status: row.status,
        image: row.image ?? null,
        categoryId: mappedCategoryId,
        brandId: mappedBrandId,
        updatedAt: asDate(row.updatedAt) ?? undefined,
      },
    });
  }

  return prisma.product.create({
    data: {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description ?? null,
      price: row.price,
      comparePrice: row.comparePrice ?? null,
      sku: row.sku ?? null,
      quantity: row.quantity ?? 0,
      status: row.status,
      image: row.image ?? null,
      categoryId: mappedCategoryId,
      brandId: mappedBrandId,
      createdAt: asDate(row.createdAt) ?? undefined,
      updatedAt: asDate(row.updatedAt) ?? undefined,
    },
  });
}

async function main() {
  const openedSources = [];

  for (const source of sources) {
    try {
      const db = await openSqlite(source.filePath);
      openedSources.push({ ...source, db });
    } catch (error) {
      console.log(`Ignorando ${source.filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (!openedSources.length) {
    throw new Error("Nenhuma base SQLite legada encontrada.");
  }

  const categoryMap = new Map();
  const brandMap = new Map();
  const userMap = new Map();
  const productMap = new Map();
  const summary = [];

  try {
    const categoryRows = (await Promise.all(openedSources.map((source) => loadSourceRows(source, "Category")))).flat();
    for (const row of categoryRows) {
      if (!row.slug) continue;
      const category = await upsertCategory(row);
      categoryMap.set(`${row.__source}:${row.id}`, category.id);
    }
    summary.push(`Categorias: ${categoryRows.length}`);

    const brandRows = (await Promise.all(openedSources.map((source) => loadSourceRows(source, "Brand")))).flat();
    for (const row of brandRows) {
      if (!row.slug) continue;
      const brand = await upsertBrand(row);
      brandMap.set(`${row.__source}:${row.id}`, brand.id);
    }
    summary.push(`Marcas: ${brandRows.length}`);

    const userRows = (await Promise.all(openedSources.map((source) => loadSourceRows(source, "User")))).flat();
    for (const row of userRows) {
      if (!row.email) continue;
      const user = await upsertUser(row);
      userMap.set(`${row.__source}:${row.id}`, user.id);
    }
    summary.push(`Usuários: ${userRows.length}`);

    const couponRows = (await Promise.all(openedSources.map((source) => loadSourceRows(source, "Coupon")))).flat();
    for (const row of couponRows) {
      if (!row.code) continue;
      await prisma.coupon.upsert({
        where: { code: row.code },
        update: {
          name: row.name,
          description: row.description ?? undefined,
          type: row.type,
          value: row.value,
          minSubtotal: row.minSubtotal ?? undefined,
          maxDiscount: row.maxDiscount ?? undefined,
          startsAt: asDate(row.startsAt),
          expiresAt: asDate(row.expiresAt),
          isActive: toBoolean(row.isActive),
          usageLimit: row.usageLimit ?? undefined,
          usageCount: row.usageCount ?? 0,
          appliesToBrandSlugs: row.appliesToBrandSlugs ?? undefined,
          appliesToCategorySlugs: row.appliesToCategorySlugs ?? undefined,
          firstOrderOnly: toBoolean(row.firstOrderOnly),
          allowWithPixDiscount: row.allowWithPixDiscount == null ? true : toBoolean(row.allowWithPixDiscount),
          updatedAt: asDate(row.updatedAt) ?? undefined,
        },
        create: {
          id: row.id,
          code: row.code,
          name: row.name,
          description: row.description ?? null,
          type: row.type,
          value: row.value,
          minSubtotal: row.minSubtotal ?? null,
          maxDiscount: row.maxDiscount ?? null,
          startsAt: asDate(row.startsAt),
          expiresAt: asDate(row.expiresAt),
          isActive: toBoolean(row.isActive),
          usageLimit: row.usageLimit ?? null,
          usageCount: row.usageCount ?? 0,
          appliesToBrandSlugs: row.appliesToBrandSlugs ?? null,
          appliesToCategorySlugs: row.appliesToCategorySlugs ?? null,
          firstOrderOnly: toBoolean(row.firstOrderOnly),
          allowWithPixDiscount: row.allowWithPixDiscount == null ? true : toBoolean(row.allowWithPixDiscount),
          createdAt: asDate(row.createdAt) ?? undefined,
          updatedAt: asDate(row.updatedAt) ?? undefined,
        },
      });
    }
    summary.push(`Cupons: ${couponRows.length}`);

    const productRows = (await Promise.all(openedSources.map((source) => loadSourceRows(source, "Product")))).flat();
    for (const row of productRows) {
      const mappedCategoryId = categoryMap.get(`${row.__source}:${row.categoryId}`);
      if (!mappedCategoryId) {
        console.log(`Produto ignorado sem categoria mapeada: ${row.name}`);
        continue;
      }

      const mappedBrandId = row.brandId ? brandMap.get(`${row.__source}:${row.brandId}`) ?? null : null;
      const product = await upsertProduct(row, mappedCategoryId, mappedBrandId);
      productMap.set(`${row.__source}:${row.id}`, product.id);
    }
    summary.push(`Produtos: ${productRows.length}`);

    const imageRows = (await Promise.all(openedSources.map((source) => loadSourceRows(source, "ProductImage")))).flat();
    for (const row of imageRows) {
      const mappedProductId = productMap.get(`${row.__source}:${row.productId}`);
      if (!mappedProductId || !row.url) continue;

      const existing = await prisma.productImage.findFirst({
        where: {
          productId: mappedProductId,
          url: row.url,
        },
      });

      if (existing) continue;

      await prisma.productImage.create({
        data: {
          id: row.id,
          productId: mappedProductId,
          url: row.url,
          alt: row.alt ?? null,
          position: row.position ?? 0,
          createdAt: asDate(row.createdAt) ?? undefined,
        },
      });
    }
    summary.push(`Imagens de produto: ${imageRows.length}`);

    const favoriteRows = (await Promise.all(openedSources.map((source) => loadSourceRows(source, "Favorite")))).flat();
    for (const row of favoriteRows) {
      const mappedUserId = userMap.get(`${row.__source}:${row.userId}`);
      const mappedProductId = productMap.get(`${row.__source}:${row.productId}`);
      if (!mappedUserId || !mappedProductId) continue;

      await prisma.favorite.upsert({
        where: {
          userId_productId: {
            userId: mappedUserId,
            productId: mappedProductId,
          },
        },
        update: {},
        create: {
          id: row.id,
          userId: mappedUserId,
          productId: mappedProductId,
          createdAt: asDate(row.createdAt) ?? undefined,
        },
      });
    }
    summary.push(`Favoritos: ${favoriteRows.length}`);

    const blogRows = (await Promise.all(openedSources.map((source) => loadSourceRows(source, "BlogPost")))).flat();
    for (const row of blogRows) {
      if (!row.slug) continue;
      await prisma.blogPost.upsert({
        where: { slug: row.slug },
        update: {
          title: row.title,
          excerpt: row.excerpt,
          content: row.content,
          coverImage: row.coverImage ?? null,
          authorName: row.authorName ?? null,
          tags: row.tags ?? null,
          isPublished: toBoolean(row.isPublished),
          featured: toBoolean(row.featured),
          publishedAt: asDate(row.publishedAt),
          updatedAt: asDate(row.updatedAt) ?? undefined,
        },
        create: {
          id: row.id,
          title: row.title,
          slug: row.slug,
          excerpt: row.excerpt,
          content: row.content,
          coverImage: row.coverImage ?? null,
          authorName: row.authorName ?? null,
          tags: row.tags ?? null,
          isPublished: toBoolean(row.isPublished),
          featured: toBoolean(row.featured),
          publishedAt: asDate(row.publishedAt),
          createdAt: asDate(row.createdAt) ?? undefined,
          updatedAt: asDate(row.updatedAt) ?? undefined,
        },
      });
    }
    summary.push(`Posts do blog: ${blogRows.length}`);

    const bannerRows = (await Promise.all(openedSources.map((source) => loadSourceRows(source, "Banner")))).flat();
    for (const row of bannerRows) {
      const existing = await prisma.banner.findFirst({
        where: {
          title: row.title,
          placement: row.placement,
        },
      });

      if (existing) continue;

      await prisma.banner.create({
        data: {
          id: row.id,
          title: row.title,
          subtitle: row.subtitle ?? null,
          imageUrl: row.imageUrl,
          mobileUrl: row.mobileUrl ?? null,
          href: row.href ?? null,
          placement: row.placement,
          isActive: toBoolean(row.isActive),
          position: row.position ?? 0,
          startsAt: asDate(row.startsAt),
          endsAt: asDate(row.endsAt),
          createdAt: asDate(row.createdAt) ?? undefined,
          updatedAt: asDate(row.updatedAt) ?? undefined,
        },
      });
    }
    summary.push(`Banners: ${bannerRows.length}`);

    const newsletterRows = (await Promise.all(openedSources.map((source) => loadSourceRows(source, "NewsletterSubscriber")))).flat();
    for (const row of newsletterRows) {
      if (!row.email) continue;
      await prisma.newsletterSubscriber.upsert({
        where: { email: row.email },
        update: {
          name: row.name ?? null,
          status: row.status ?? "ACTIVE",
          source: row.source ?? null,
          tags: row.tags ?? null,
          subscribedAt: asDate(row.subscribedAt) ?? undefined,
          unsubscribedAt: asDate(row.unsubscribedAt),
          updatedAt: asDate(row.updatedAt) ?? undefined,
        },
        create: {
          id: row.id,
          email: row.email,
          name: row.name ?? null,
          status: row.status ?? "ACTIVE",
          source: row.source ?? null,
          tags: row.tags ?? null,
          subscribedAt: asDate(row.subscribedAt) ?? undefined,
          unsubscribedAt: asDate(row.unsubscribedAt),
          createdAt: asDate(row.createdAt) ?? undefined,
          updatedAt: asDate(row.updatedAt) ?? undefined,
        },
      });
    }
    summary.push(`Newsletter: ${newsletterRows.length}`);

    const mediaRows = (await Promise.all(openedSources.map((source) => loadSourceRows(source, "MediaAsset")))).flat();
    for (const row of mediaRows) {
      if (!row.url) continue;
      const existing = await prisma.mediaAsset.findUnique({ where: { url: row.url } });
      if (existing) continue;

      await prisma.mediaAsset.create({
        data: {
          id: row.id,
          fileName: row.fileName,
          originalName: row.originalName,
          mimeType: row.mimeType,
          size: row.size,
          path: row.path,
          url: row.url,
          alt: row.alt ?? null,
          width: row.width ?? null,
          height: row.height ?? null,
          createdAt: asDate(row.createdAt) ?? undefined,
          updatedAt: asDate(row.updatedAt) ?? undefined,
        },
      });
    }
    summary.push(`Mídias: ${mediaRows.length}`);

    const integrationRows = (await Promise.all(openedSources.map((source) => loadSourceRows(source, "IntegrationSetting")))).flat();
    for (const row of integrationRows) {
      if (!row.provider) continue;
      await prisma.integrationSetting.upsert({
        where: { provider: row.provider },
        update: {
          name: normalizeString(row.name) ?? row.provider,
          isEnabled: toBoolean(row.isEnabled),
          environment: row.environment ?? "production",
          publicKey: row.publicKey ?? null,
          secretKey: row.secretKey ?? null,
          webhookSecret: row.webhookSecret ?? null,
          endpointUrl: row.endpointUrl ?? null,
          extraConfig: row.extraConfig ?? null,
          updatedAt: asDate(row.updatedAt) ?? undefined,
        },
        create: {
          id: row.id,
          provider: row.provider,
          name: normalizeString(row.name) ?? row.provider,
          isEnabled: toBoolean(row.isEnabled),
          environment: row.environment ?? "production",
          publicKey: row.publicKey ?? null,
          secretKey: row.secretKey ?? null,
          webhookSecret: row.webhookSecret ?? null,
          endpointUrl: row.endpointUrl ?? null,
          extraConfig: row.extraConfig ?? null,
          createdAt: asDate(row.createdAt) ?? undefined,
          updatedAt: asDate(row.updatedAt) ?? undefined,
        },
      });
    }
    summary.push(`Integrações: ${integrationRows.length}`);

    console.log("Migração concluída.");
    for (const item of summary) {
      console.log(`- ${item}`);
    }
  } finally {
    await Promise.all(openedSources.map((source) => closeSqlite(source.db)));
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});