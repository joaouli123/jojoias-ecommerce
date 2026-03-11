"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { ChevronRight, HeadphonesIcon, LogIn, Menu, Percent, User, X } from "lucide-react";

const mobileNavigationItems = [
  { label: "Marcas", href: "/marcas" },
  { label: "Blog", href: "/blog" },
  { label: "Acessórios", href: "/categoria/acessorios" },
  { label: "Anéis", href: "/categoria/aneis" },
  { label: "Colares", href: "/categoria/colares" },
  { label: "Pulseiras", href: "/categoria/pulseiras" },
  { label: "Promoções", href: "/categoria/promocoes" },
  { label: "Ofertas Especiais", href: "/categoria/ofertas" },
];

export function MobileNavDrawer() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="lg:hidden p-2 -ml-2 text-zinc-900 group"
        aria-label="Abrir menu"
      >
        <Menu className="w-6 h-6 group-hover:text-[#D4AF37] transition-colors" />
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      ) : null}

      {isOpen ? (
      <aside
        className="fixed inset-y-0 left-0 z-[60] flex w-full max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 translate-x-0"
        role="dialog"
        aria-modal="true"
        aria-label="Menu mobile"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div className="space-y-2">
            <Image src="/logo-oficial.avif" alt="Luxijóias Semijoias" width={170} height={50} quality={50} sizes="150px" className="h-auto w-[150px]" />
            <h2 className="text-lg font-black text-zinc-900">Menu</h2>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-zinc-100 bg-zinc-50 px-5 py-4">
          <p className="text-sm text-zinc-600">Acesso rápido</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-[20px] border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900"
              onClick={() => setIsOpen(false)}
            >
              <LogIn className="h-4 w-4 text-[#D4AF37]" /> Entrar
            </Link>
            <Link
              href="/account"
              className="flex items-center gap-2 rounded-[20px] border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900"
              onClick={() => setIsOpen(false)}
            >
              <User className="h-4 w-4 text-[#D4AF37]" /> Minha conta
            </Link>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-5 py-5">
          <div className="mb-6 rounded-[20px] bg-[#111111] px-4 py-4 text-[#D4AF37]">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
              <Percent className="h-4 w-4" /> Oferta ativa
            </div>
            <p className="mt-2 text-sm leading-6 text-white/90">Use o cupom PRIM e ganhe 10% na primeira compra.</p>
          </div>

          <div className="space-y-2">
            {mobileNavigationItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-between rounded-[20px] border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:border-[#D4AF37] hover:bg-[#D4AF37]/[0.08]"
                onClick={() => setIsOpen(false)}
              >
                <span>{item.label}</span>
                <ChevronRight className="h-4 w-4 text-zinc-400" />
              </Link>
            ))}
          </div>
        </nav>

        <div className="border-t border-zinc-200 px-5 py-4">
          <Link
            href="/contato"
            className="flex items-center gap-3 rounded-[20px] bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900"
            onClick={() => setIsOpen(false)}
          >
            <HeadphonesIcon className="h-4 w-4 text-[#D4AF37]" /> Central de ajuda
          </Link>
        </div>
      </aside>
      ) : null}
    </>
  );
}