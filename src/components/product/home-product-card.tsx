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
    <Link href={`/produto/${product.slug}`} className="group relative flex h-full select-none flex-col rounded-[18px] border border-zinc-200 bg-white p-2 transition-colors hover:border-zinc-300 sm:p-3">
      {hasDiscount ? (
        <div className="absolute left-2 top-2 z-20">
          <span className="rounded-full bg-[#D4AF37] px-2 py-1 text-[10px] font-medium tracking-wide text-[#111111]">
            OFERTA
          </span>
        </div>
      ) : null}

      <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-[14px] bg-[#F7F5F2] select-none">
        <Image
          src={product.image || "/demo-products/kit-elegance.svg"}
          alt={product.name}
          fill
          draggable={false}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-3 transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col px-2 pb-2 text-left">
        <div className="mb-3 min-h-[64px]">
          <h3 className="line-clamp-2 font-serif text-[clamp(1.08rem,1.45vw,1.24rem)] font-medium leading-[1.1] tracking-[-0.015em] text-[#1A1A1A]">
            {product.name}
          </h3>
        </div>

        <div className="mt-auto flex flex-col items-start gap-1">
          {hasDiscount ? (
            <span className="text-sm font-medium text-zinc-400 line-through decoration-zinc-400/80">{formatCurrency(oldPrice)}</span>
          ) : null}

          <span className="mb-1 text-[1.65rem] font-semibold leading-none tracking-tight text-[#1A1A1A]">{formatCurrency(product.price)}</span>

          <span className="mb-3 text-xs font-medium text-[#1A1A1A]">até {parcelas}x de {formatCurrency(valorParcela)} sem juros</span>

          <div className="mt-2 flex w-full items-center justify-start gap-2 border-t border-zinc-200 pt-3">
            <PixIcon className="h-[13px] w-[13px] shrink-0 translate-y-px text-[#32BCAD]" />
            <span className="text-sm font-medium leading-none text-[#1A1A1A]">ou {formatCurrency(pixPrice)} via Pix</span>
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