type InstitutionalHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function InstitutionalHero({ eyebrow, title, description }: InstitutionalHeroProps) {
  return (
    <section className="border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white">
      <div className="mx-auto max-w-5xl px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
        <span className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-[#9a7b18]">
          {eyebrow}
        </span>
        <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-600 sm:text-lg">
          {description}
        </p>
      </div>
    </section>
  );
}
