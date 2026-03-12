type InstitutionalHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function InstitutionalHero({ eyebrow, title, description }: InstitutionalHeroProps) {
  return (
    <section className="border-b border-zinc-100 bg-white">
      <div className="mx-auto max-w-5xl px-6 py-10 sm:px-8 lg:px-10 lg:py-12">
        <span className="inline-flex text-[11px] font-medium font-serif uppercase tracking-[0.28em] text-[#666666]">
          {eyebrow}
        </span>
        <h1 className="mt-3 max-w-3xl text-4xl font-medium font-serif tracking-tight text-[#1A1A1A] sm:text-5xl">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-[#666666] sm:text-lg">
          {description}
        </p>
      </div>
    </section>
  );
}
