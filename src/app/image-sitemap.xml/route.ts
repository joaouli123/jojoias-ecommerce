import { hasDatabaseUrl, prisma } from "@/lib/prisma";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://luxijoias.com.br";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const entries = hasDatabaseUrl()
    ? await prisma.product.findMany({
        where: { status: "ACTIVE" },
        select: {
          slug: true,
          image: true,
          galleryImages: {
            select: { url: true },
            orderBy: { position: "asc" },
          },
        },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries
  .map((product) => {
    const images = Array.from(new Set([product.image, ...product.galleryImages.map((image) => image.url)].filter(Boolean))) as string[];
    if (!images.length) {
      return "";
    }

    return `  <url>
    <loc>${escapeXml(`${siteUrl}/produto/${product.slug}`)}</loc>
${images.map((imageUrl) => `    <image:image><image:loc>${escapeXml(imageUrl)}</image:loc></image:image>`).join("\n")}
  </url>`;
  })
  .filter(Boolean)
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}