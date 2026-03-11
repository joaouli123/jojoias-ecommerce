import { prisma } from "@/lib/prisma";

export type CmsPage = {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

export async function getPublishedPageBySlug(slug: string): Promise<CmsPage | null> {
  if (!hasDatabaseUrl()) return null;

  try {
    return await prisma.page.findFirst({
      where: {
        slug,
        isPublished: true,
      },
    });
  } catch {
    return null;
  }
}

export async function getPageByIdentifier(identifier: string): Promise<CmsPage | null> {
  if (!hasDatabaseUrl()) return null;

  try {
    return await prisma.page.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
      },
    });
  } catch {
    return null;
  }
}

export async function listPublishedPages(): Promise<CmsPage[]> {
  if (!hasDatabaseUrl()) return [];

  try {
    return await prisma.page.findMany({
      where: { isPublished: true },
      orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
    });
  } catch {
    return [];
  }
}
