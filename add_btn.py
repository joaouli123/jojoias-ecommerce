with open('src/components/product/home-product-card.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

btn = '''
          <div className="mt-4 w-full">
            <button className="flex w-full items-center justify-center bg-[#21352A] text-white min-h-[44px] text-sm font-medium transition-colors hover:bg-[#1A2A21] uppercase tracking-wider">
              Comprar
            </button>
          </div>
'''
text = text.replace('</div>\n      </div>\n    </Link>', '</div>\n' + btn + '      </div>\n    </Link>')

with open('src/components/product/home-product-card.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
