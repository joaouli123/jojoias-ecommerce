import codecs

with codecs.open('src/components/product/product-card.tsx', 'r', encoding='utf-8-sig') as f:
    content = f.read()

idx = content.find('  return (')

new_return = """  return (
    <div className="group relative flex flex-col bg-white rounded-[20px] border border-[#E5E5E5] p-3 sm:p-4 transition-all hover:shadow-lg">
      {/* Notificacoes */}
      {showCartNotice ? (
        <div className="absolute inset-x-2 bottom-16 z-40 rounded-[20px] border border-emerald-200 bg-white/95 p-3 shadow-lg backdrop-blur">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-emerald-700">Adicionado</p>
              <p className="mt-1 line-clamp-1 text-xs text-[#666666]">{product.name}</p>
              <Link href="/cart" className="mt-2 inline-flex h-9 items-center justify-center rounded-[20px] bg-[#1A1A1A] px-4 text-xs font-bold text-white">Ver carrinho</Link>
            </div>
          </div>
        </div>
      ) : null}

      {cartError ? (
        <div className="absolute inset-x-2 bottom-16 z-40 rounded-[20px] border border-rose-200 bg-white/95 p-3 shadow-lg backdrop-blur">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-rose-700">Erro</p>
              <p className="mt-1 text-xs text-[#666666]">{cartError}</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Ações de Topo -> Favorito */}
      <div className="pointer-events-auto absolute right-3 top-3 z-30 flex flex-col gap-2">
        <FavoriteButton productId={product.id} className="w-[44px] h-[44px] min-w-[44px] min-h-[44px] fill-transparent flex items-center justify-center bg-white/80 backdrop-blur rounded-full border border-[#E5E5E5] shadow-sm text-[#1A1A1A] hover:text-[#C19B54] mb-2" />
      </div>

      {hasDiscount && (
        <div className="absolute left-3 top-3 z-20">
          <span className="bg-[#C19B54] text-white text-[11px] font-bold px-2 py-1 rounded shadow-sm tracking-wide">
            {discountPercent}% OFF
          </span>
        </div>
      )}

      {/* Imagem Padrão 1:1 com respiro */}
      <Link href={`/produto/${product.slug}`} aria-label={`Ver detalhes de ${product.name}`} className="relative mb-4 block aspect-square w-full overflow-hidden rounded-[16px] bg-[#F9F8F6]">
        <Image
          src={product.image || "/demo-products/kit-elegance.svg"}
          alt={product.name}
          fill
          quality={50}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-center transition-transform duration-700 group-hover:scale-105 p-6"
        />
      </Link>

      {/* Infos Essenciais - Alinhadas à Esquerda */}
      <div className="flex flex-col flex-1 text-left">
        <Link href={`/produto/${product.slug}`} className="mb-2 block">
          <h3 className="h-[44px] text-[15px] font-medium leading-snug text-[#1A1A1A] line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Agrupamento de Preço Hierárquico */}
        <div className="flex flex-col mb-4">
          {hasDiscount && (
            <span className="text-sm text-[#666666] line-through decoration-[#666666]/50">
              {formatCurrency(oldPrice)}
            </span>
          )}
          <div className="flex flex-col justify-start">
            <span className="text-[20px] font-bold text-[#1A1A1A] leading-tight mt-1">
              {formatCurrency(product.price)}
            </span>
            <span className="text-xs font-normal text-[#666666] mt-0.5">
              até {parcelas}x {formatCurrency(valorParcela)} sem juros
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 mt-2 text-sm font-semibold text-[#32BCAD]">
            <PixIcon className="w-3.5 h-3.5 text-[#32BCAD] shrink-0" />
            {formatCurrency(pixPrice)} no Pix
          </div>
        </div>

        {/* Botões Bottom (WhatsApp e Compra) */}
        <div className="mt-auto grid grid-cols-[44px_1fr] gap-2 w-full">
          <Link
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            aria-label={`Comprar ${product.name} pelo WhatsApp`}
            className="flex h-[44px] w-[44px] items-center justify-center rounded-[12px] border border-[#E5E5E5] bg-white text-[#666666] transition-colors hover:border-[#25D366] hover:text-[#25D366]"
          >
            <WhatsAppIcon className="h-5 w-5" />
          </Link>
          <button
            type="button"
            onPointerDown={stopCardAction}
            onClick={(event) => {
              stopCardAction(event);
              void handleAddToCart();
            }}
            disabled={isPending}
            className="flex h-[44px] items-center justify-center rounded-[12px] bg-[#21352A] text-white font-bold text-sm transition-all hover:bg-[#1A1A1A] disabled:opacity-70 disabled:cursor-not-allowed w-full"
            aria-label={canAddDirectly ? `Adicionar ${product.name} ao carrinho` : `Escolher opções de ${product.name}`}
          >
            {isPending ? "Aguarde..." : (canAddDirectly ? "Comprar" : "Ver Opções")}
          </button>
        </div>
      </div>
    </div>
  )
}
"""

with codecs.open('src/components/product/product-card.tsx', 'w', encoding='utf-8') as f:
    f.write(content[:idx] + new_return)
