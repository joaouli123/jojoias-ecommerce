import codecs

with codecs.open('src/components/home/carousels.tsx', 'r', encoding='utf-8-sig') as f:
    content = f.read()

# Replace button visibility classes to hide them on mobile (add "hidden md:flex")

# In CategoriesCarousel: "flex ... xl:hidden"
content = content.replace(
    'className="absolute -left-4 md:left-0 top-[33%] -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-zinc-200/80 rounded-full z-10 text-zinc-700 xl:hidden"',
    'className="hidden md:flex absolute -left-4 md:left-0 top-[33%] -translate-y-1/2 w-12 h-12 items-center justify-center bg-zinc-200/80 rounded-full z-10 text-zinc-700 xl:hidden"'
)

content = content.replace(
    'className="absolute -right-4 md:right-0 top-[33%] -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-zinc-200/80 rounded-full z-10 text-zinc-700 xl:hidden"',
    'className="hidden md:flex absolute -right-4 md:right-0 top-[33%] -translate-y-1/2 w-12 h-12 items-center justify-center bg-zinc-200/80 rounded-full z-10 text-zinc-700 xl:hidden"'
)

# In SecondaryBanners: "flex md:hidden" -> we want to remove them entirely if they are purely for mobile, or just hide them.
# The user said "Substitua setas por Swipe (...) remover essas setas no celular"
# If they are `flex md:hidden`, it means they only showed on mobile. If we remove them from mobile, they never show. So replace `flex md:hidden` with `hidden`.
content = content.replace(
    'className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center bg-white/95 rounded-full shadow-lg z-20 text-zinc-900 flex md:hidden"',
    'className="hidden"'
)

content = content.replace(
    'className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center bg-white/95 rounded-full shadow-lg z-20 text-zinc-900 flex md:hidden"',
    'className="hidden"'
)

# In BannerHero/Carousel:
# `w-11 h-11 flex items-center justify-center bg-white/95 rounded-full shadow-lg z-20 text-zinc-900 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity`
content = content.replace(
    'w-11 h-11 flex items-center justify-center bg-white/95 rounded-full shadow-lg z-20 text-zinc-900 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity',
    'w-11 h-11 hidden md:flex items-center justify-center bg-white/95 rounded-full shadow-lg z-20 text-zinc-900 md:opacity-0 md:group-hover:opacity-100 transition-opacity'
)

# In BenefitsCarousel:
content = content.replace(
    'className="absolute left-2 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md z-20 text-zinc-900"',
    'className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full bg-white shadow-md z-20 text-zinc-900"'
)

content = content.replace(
    'className="absolute right-2 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md z-20 text-zinc-900"',
    'className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full bg-white shadow-md z-20 text-zinc-900"'
)

# Fix Category items cut circles (Dica de Ouro: Deixe os circulos cortados no canto direito) -> Native horizontal scroll handles it. We just need to ensure `pr-safe` or native scroll without snap lock at the end if it was snapping severely. Usually `overflow-x-auto` + `snap-x` allows half-cut naturally.

with codecs.open('src/components/home/carousels.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
