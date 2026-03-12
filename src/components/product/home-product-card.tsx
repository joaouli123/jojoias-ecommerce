import Image from "next/image";
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
    <Link href={`/produto/${product.slug}`} className="group relative flex flex-col rounded-none border border-transparent bg-white p-2 transition-all hover:scale-[1.01] sm:p-3">
      {hasDiscount ? (
        <div className="absolute left-2 top-2 z-20">
          <span className="rounded-sm bg-[#D4AF37] px-2 py-1 text-[10px] font-medium font-serif tracking-wide text-[#111111] shadow-sm">
            OFERTA
          </span>
        </div>
      ) : null}

      <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-none">
        <Image
          src={product.image || "/demo-products/kit-elegance.svg"}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col px-2 text-left">
        <h3 className="mb-3 min-h-[44px] line-clamp-2 text-base font-semibold leading-snug text-[#1A1A1A]">{product.name}</h3>

        <div className="mt-auto flex flex-col items-start space-y-1">
          {hasDiscount ? (
            <span className="text-sm font-medium text-[#E5E5E5] line-through decoration-zinc-400/50">{formatCurrency(oldPrice)}</span>
          ) : null}

          <span className="mb-1 text-2xl font-medium font-serif leading-none tracking-tight text-[#1A1A1A]">{formatCurrency(product.price)}</span>

          <span className="mb-3 text-xs font-medium text-[#1A1A1A]">até {parcelas}x de {formatCurrency(valorParcela)} sem juros</span>

          <div className="mt-2 flex w-full items-start justify-start gap-1.5 border-t border-zinc-100 pt-3">
            <PixIcon className="h-[14px] w-[14px] shrink-0 text-[#32BCAD]" />
            <span className="text-sm font-medium font-serif text-[#1A1A1A]">ou {formatCurrency(pixPrice)} via Pix</span>
          </div>
        </div>

          <div className="mt-4 w-full">
            <button className="flex w-full items-center justify-center bg-[#21352A] text-white min-h-[44px] text-sm font-medium transition-colors hover:bg-[#1A2A21] uppercase tracking-wider">
              Comprar
            </button>
          </div>
      </div>
    </Link>
  );
}