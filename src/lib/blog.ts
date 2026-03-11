import { prisma } from "@/lib/prisma";

export type BlogPostSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  authorName: string | null;
  isPublished: boolean;
  featured: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  readingMinutes: number;
};

export type BlogPostDetail = BlogPostSummary & {
  content: string;
};

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

export function parseBlogTags(tags: string | null | undefined) {
  return (tags || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function estimateReadingMinutes(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
}

function mapPost<T extends { tags: string | null; content: string }>(post: T) {
  return {
    ...post,
    tags: parseBlogTags(post.tags),
    readingMinutes: estimateReadingMinutes(post.content),
  };
}

export async function listPublishedBlogPosts(): Promise<BlogPostSummary[]> {
  if (!hasDatabaseUrl()) return [];

  try {
    const posts = await prisma.blogPost.findMany({
      where: { isPublished: true },
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { updatedAt: "desc" }],
    });

    return posts.map((post) => {
      const mapped = mapPost(post);
      return {
        id: mapped.id,
        title: mapped.title,
        slug: mapped.slug,
        excerpt: mapped.excerpt,
        coverImage: mapped.coverImage,
        authorName: mapped.authorName,
        isPublished: mapped.isPublished,
        featured: mapped.featured,
        publishedAt: mapped.publishedAt,
        createdAt: mapped.createdAt,
        updatedAt: mapped.updatedAt,
        tags: mapped.tags,
        readingMinutes: mapped.readingMinutes,
      };
    });
  } catch {
    return [];
  }
}

export async function getPublishedBlogPostBySlug(slug: string): Promise<BlogPostDetail | null> {
  if (!hasDatabaseUrl()) return null;

  try {
    const post = await prisma.blogPost.findFirst({
      where: { slug, isPublished: true },
    });

    return post ? mapPost(post) : null;
  } catch {
    return null;
  }
}

export async function getBlogPostByIdentifier(identifier: string): Promise<BlogPostDetail | null> {
  if (!hasDatabaseUrl()) return null;

  try {
    const post = await prisma.blogPost.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
      },
    });

    return post ? mapPost(post) : null;
  } catch {
    return null;
  }
}