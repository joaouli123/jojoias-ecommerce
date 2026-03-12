import re

with open('src/components/product/product-card.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# I want to remove the floating right buttons and add a footer button
# Replace the floating add to cart block with empty.

# Wait, the floating buttons div is:
# <div className="pointer-events-auto absolute right-2 top-2 z-50 flex flex-col gap-2"> ... </div>
import re

text = re.sub(r'<div className="pointer-events-auto absolute right-2 top-2 z-50 flex flex-col gap-2">.*?</button>\s*</div>', '', text, flags=re.DOTALL)

# And inject w-full Comprar button before the end of Link or card
# The user wants "Comprar" to do handleAddToCart instead of Link
# Since card has 'handleAddToCart' function, we can put it there.
