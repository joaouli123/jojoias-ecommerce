import codecs

content = """import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { PixIcon } from "@/components/ui/icons";

type HomeProductCardProps = {
  product: {
    name: string;
    slug: string;
    price: number;
    comparePrice?: number | null;
    image: string;
  };
};

export function HomeProductCard({ product }: HomeProductCardProps) {
  const hasDiscount = typeof product.comparePrice === "number" && product.comparePrice > product.price;
  const oldPrice = hasDiscount ? (product.comparePrice as number) : product.price * 1.15;
  const pixPrice = product.price * 0.9;
  const parcelas = 6;
  const valorParcela = product.price / parcelas;

  return (
    <div className="group relative flex flex-col rounded-[20px] border border-[#E5E5E5] bg-white p-3 sm:p-4 transition-all hover:shadow-lg">
      {hasDiscount ? (
        <div className="absolute left-3 top-3 z-20">
          <span className="rounded bg-[#C19B54] px-2 py-1 text-[11px] font-bold tracking-wide text-white shadow-sm">
            OFERTA
          </span>
        </div>
      ) : null}

      <Link href={`/produto/${product.slug}`} className="relative mb-4 block aspect-square w-full overflow-hidden rounded-[16px] bg-[#F9F8F6]">
        <Image
          src={product.image || "/demo-products/kit-elegance.svg"}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105 p-6"
        />
      </Link>

      <div className="flex flex-1 flex-col px-1 text-left">
        <Link href={`/produto/${product.slug}`} className="mb-2 block">
          <h3 className="min-h-[44px] line-clamp-2 text-[15px] font-medium leading-snug text-[#1A1A1A]">
            {product.name}
          </h3>
        </Link>

        <div className="flex flex-col mb-4">
          {hasDiscount && (
            <span className="text-sm text-[#666666] line-through decoration-[#666666]/50">
              {formatCurrency(oldPrice)}
            </span>
          )}
          <div className="flex flex-col justify-start">
            <span className="mt-1 text-[20px] font-bold leading-tight text-[#1A1A1A]">
              {formatCurrency(product.price)}
            </span>
            <span className="mt-0.5 text-xs font-normal text-[#666666]">
              até {parcelas}x {formatCurrency(valorParcela)} sem juros
            </span>
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-[#32BCAD]">
            <PixIcon className="h-3.5 w-3.5 shrink-0 text-[#32BCAD]" />
            {formatCurrency(pixPrice)} no Pix
          </div>
        </div>

        <Link
          href={`/produto/${product.slug}`}
          className="mt-auto flex min-h-[44px] w-full items-center justify-center rounded-[12px] bg-[#21352A] text-sm font-bold text-white transition-all hover:bg-[#1A1A1A]"
        >
          Ver Detalhes
        </Link>
      </div>
    </div>
  );
}
"""

with codecs.open('src/components/product/home-product-card.tsx', 'w', encoding='utf-8-sig') as f:
    f.write(content)
