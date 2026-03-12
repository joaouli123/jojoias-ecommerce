import Link from "next/link";
import { Gem, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-white px-6 py-16">
      <div className="w-full max-w-2xl rounded-[2rem] border border-zinc-200 bg-white p-8 text-center shadow-xl shadow-zinc-200/40 sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#1A1A1A] text-[#D4AF37] shadow-lg">
          <Gem className="h-7 w-7" />
        </div>
        <p className="mt-6 text-sm font-medium font-serif uppercase tracking-[0.35em] text-[#E5E5E5]">Erro 404</p>
        <h1 className="mt-4 text-4xl font-medium font-serif tracking-tight text-[#1A1A1A] sm:text-5xl">Página não encontrada</h1>
        <p className="mt-4 text-base leading-8 text-[#666666]">
          O conteúdo que você tentou acessar pode ter sido removido, renomeado ou está temporariamente indisponível.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#1A1A1A] px-5 text-sm font-medium font-serif text-white transition-colors hover:bg-[#666666]">
            <ArrowLeft className="h-4 w-4" />
            Voltar para a loja
          </Link>
          <Link href="/search" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-5 text-sm font-medium font-serif text-[#1A1A1A] transition-colors hover:bg-[#FFFFFF]">
            <Search className="h-4 w-4" />
            Buscar produtos
          </Link>
        </div>
      </div>
    </div>
  );
}
