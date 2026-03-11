import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const siteUrl = getSiteUrl();
  if (!hasDatabaseUrl()) {
    const xml = `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
    <channel>
      <title>Luxijóias</title>
      <link>${siteUrl}</link>
      <description>Feed de produtos Luxijóias</description>
    </channel>
  </rss>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  }

  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    include: { category: true, brand: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const items = products.map((product) => `
    <item>
      <g:id>${escapeXml(product.id)}</g:id>
      <title>${escapeXml(product.name)}</title>
      <description>${escapeXml(product.description || product.name)}</description>
      <link>${siteUrl}/produto/${product.slug}</link>
      <g:price>${product.price.toFixed(2)} BRL</g:price>
      <g:availability>${product.quantity > 0 ? "in_stock" : "out_of_stock"}</g:availability>
      <g:condition>new</g:condition>
      <g:image_link>${escapeXml(product.image ? `${siteUrl}${product.image}` : `${siteUrl}/next.svg`)}</g:image_link>
      <g:product_type>${escapeXml(product.category.name)}</g:product_type>
      <g:brand>${escapeXml(product.brand?.name || "Luxijóias")}</g:brand>
    </item>`).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
    <channel>
      <title>Luxijóias</title>
      <link>${siteUrl}</link>
      <description>Feed de produtos Luxijóias</description>
      ${items}
    </channel>
  </rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
