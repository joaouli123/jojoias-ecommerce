import Link from "next/link";
import { cookies } from "next/headers";
import { Heart } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { getProductsByIds } from "@/lib/store-data";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStoreSettings } from "@/lib/store-settings";

const FAVORITES_COOKIE = "ecommerce_favorites";

function parseFavorites(value: string | undefined): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const productId = (item as { productId?: unknown }).productId;
        return typeof productId === "string" ? productId : null;
      })
      .filter((item): item is string => Boolean(item));
  } catch {
    return [];
  }
}

export default async function FavoritesPage() {
  const session = await auth();
  const store = await cookies();
  const cookieIds = parseFavorites(store.get(FAVORITES_COOKIE)?.value);
  const databaseIds = session?.user?.id
    ? (await prisma.favorite.findMany({
        where: { userId: session.user.id },
        select: { productId: true },
        orderBy: { createdAt: "desc" },
      })).map((favorite) => favorite.productId)
    : [];
  const ids = Array.from(new Set([...databaseIds, ...cookieIds]));
  const [products, settings] = await Promise.all([getProductsByIds(ids), getStoreSettings()]);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full border border-zinc-200 bg-white flex items-center justify-center">
          <Heart className="w-5 h-5 text-[#D4AF37]" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">Favoritos</h1>
          <p className="text-zinc-500">Seus produtos salvos para comprar depois.</p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="rounded-[20px] border border-zinc-200 bg-white p-10 text-center">
          <p className="text-zinc-600 font-semibold">Você ainda não salvou nenhum produto.</p>
          <Link href="/" className="mt-4 inline-flex h-11 px-6 rounded-[20px] bg-[#111111] text-white font-bold items-center justify-center hover:bg-[#111111]/90 transition-colors">
            Ver produtos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                comparePrice: product.comparePrice,
                image: product.image || "",
                category: product.category,
                variantId: product.variants.length === 1 ? product.variants[0]?.id ?? null : null,
                requiresSelection: product.variants.length > 1,
                whatsappBaseUrl: settings.whatsappUrl,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
