# -*- coding: utf-8 -*-
with open('src/components/product/product-card.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

import re
text = re.sub(r'<div className="pointer-events-auto absolute right-2 top-2 z-50 flex flex-col gap-2">.*?</button>\s*</div>', '', text, flags=re.DOTALL)

btn_block = '''
      {/* Botao de Compra */}
      <div className="mt-4 flex w-full flex-col gap-2 pointer-events-auto">
        <button
          type="button"
          onPointerDown={stopCardAction}
          onClick={(event) => { stopCardAction(event); void handleAddToCart(); }}
          disabled={isPending}
          className="flex w-full items-center justify-center bg-[#21352A] text-white min-h-[44px] text-sm font-medium transition-colors hover:bg-[#1A2A21] uppercase tracking-wider disabled:opacity-50"
        >
          {isPending ? "Adicionando..." : (canAddDirectly ? "Comprar" : "Opçoes")}
        </button>
      </div>
'''

if 'Botao de Compra' not in text:
    text = text.replace('</Link>\n    </div>', '</Link>\n' + btn_block + '    </div>')
    with open('src/components/product/product-card.tsx', 'w', encoding='utf-8') as f:
        f.write(text)
