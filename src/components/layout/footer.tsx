import Link from "next/link"
import Image from "next/image"
import { Instagram, Facebook, Youtube, Mail, Phone, MapPin } from "lucide-react"
import { getStoreSettings } from "@/lib/store-settings"
import { NewsletterSubscribeForm } from "@/components/layout/newsletter-subscribe-form"
import { WhatsAppIcon } from "@/components/ui/icons"

export async function Footer() {
  const settings = await getStoreSettings()

  return (
    <footer className="w-full border-t border-zinc-200 bg-[linear-gradient(180deg,#fcfcfc_0%,#f8f6f1_100%)] pt-16 pb-28 md:pb-8">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-12 border-b border-zinc-200 pb-16 lg:grid-cols-12 lg:gap-10">
          
          {/* Brand & Newsletter Column */}
          <div className="flex flex-col space-y-8 lg:col-span-5">
            <div>
              <Image src="/logo-oficial.avif" alt="Luxijóias Semijoias" width={220} height={66} quality={50} sizes="(max-width: 640px) 180px, 220px" className="h-auto w-[180px] sm:w-[220px]" />
              <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-zinc-600" style={{ color: "#666666" }}>
                {settings.tagline}
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-serif text-[clamp(2rem,3.1vw,2.5rem)] font-medium tracking-[-0.03em] text-zinc-900" style={{ color: "#1A1A1A" }}>Acompanhe as Novidades</h3>
              <p className="max-w-sm text-sm text-zinc-600" style={{ color: "#666666" }}>Inscreva-se para receber tendências, lançamentos e ofertas exclusivas no seu e-mail.</p>
              <NewsletterSubscribeForm />
            </div>

            <div className="flex gap-3 pt-2">
              <Link href={settings.instagramUrl} target="_blank" aria-label="Instagram" className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-[#666666] transition-all hover:border-[#D4AF37] hover:bg-[#D4AF37] hover:text-white">
                <Instagram className="w-4 h-4 stroke-[1.8]" />
              </Link>
              <Link href={settings.facebookUrl} target="_blank" aria-label="Facebook" className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-[#666666] transition-all hover:border-[#D4AF37] hover:bg-[#D4AF37] hover:text-white">
                <Facebook className="w-4 h-4 stroke-[1.8]" />
              </Link>
              <Link href={settings.youtubeUrl} target="_blank" aria-label="YouTube" className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-[#666666] transition-all hover:border-[#D4AF37] hover:bg-[#D4AF37] hover:text-white">
                <Youtube className="w-4 h-4 stroke-[1.8]" />
              </Link>
              <Link href={settings.whatsappUrl} target="_blank" aria-label="WhatsApp" className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-[#666666] transition-all hover:border-[#D4AF37] hover:bg-[#D4AF37] hover:text-white">
                <WhatsAppIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:gap-10 md:grid-cols-3 lg:col-span-7 lg:max-w-[860px] lg:justify-self-end lg:gap-x-12">
            {/* Links Columns */}
            <div className="hidden md:block">
              <h3 className="mb-6 text-xs font-semibold uppercase tracking-wider text-zinc-900" style={{ color: "#1A1A1A" }}>A Luxijóias</h3>
              <ul className="space-y-4">
                <li><Link href="/quem-somos" className="text-[15px] text-zinc-600 transition-all hover:pl-1 hover:text-[#D4AF37]" style={{ color: "#666666" }}>Quem Somos</Link></li>
                <li><Link href="/marcas" className="text-[15px] text-zinc-600 transition-all hover:pl-1 hover:text-[#D4AF37]" style={{ color: "#666666" }}>Marcas</Link></li>
                <li><Link href="/blog" className="text-[15px] text-zinc-600 transition-all hover:pl-1 hover:text-[#D4AF37]" style={{ color: "#666666" }}>Blog</Link></li>
                <li><Link href="/search?q=lancamentos" className="text-[15px] text-zinc-600 transition-all hover:pl-1 hover:text-[#D4AF37]" style={{ color: "#666666" }}>Lançamentos</Link></li>
                <li><Link href="/categoria/ofertas" className="text-[15px] text-zinc-600 transition-all hover:pl-1 hover:text-[#D4AF37]" style={{ color: "#666666" }}>Ofertas</Link></li>
                <li><Link href="/favorites" className="text-[15px] text-zinc-600 transition-all hover:pl-1 hover:text-[#D4AF37]" style={{ color: "#666666" }}>Favoritos</Link></li>
                <li><Link href="/account" className="text-[15px] text-zinc-600 transition-all hover:pl-1 hover:text-[#D4AF37]" style={{ color: "#666666" }}>Minha Conta</Link></li>
              </ul>
            </div>

            <div className="hidden md:block">
              <h3 className="mb-6 text-xs font-semibold uppercase tracking-wider text-zinc-900" style={{ color: "#1A1A1A" }}>Suporte</h3>
              <ul className="space-y-4">
                <li><Link href="/contato" className="text-[15px] text-zinc-600 transition-all hover:pl-1 hover:text-[#D4AF37]" style={{ color: "#666666" }}>Central de Ajuda</Link></li>
                <li><Link href="/trocas-e-devolucoes" className="text-[15px] text-zinc-600 transition-all hover:pl-1 hover:text-[#D4AF37]" style={{ color: "#666666" }}>Trocas e Devoluções</Link></li>
                <li><Link href="/rastreio" className="text-[15px] text-zinc-600 transition-all hover:pl-1 hover:text-[#D4AF37]" style={{ color: "#666666" }}>Rastrear Pedido</Link></li>
                <li><Link href="/checkout" className="text-[15px] text-zinc-600 transition-all hover:pl-1 hover:text-[#D4AF37]" style={{ color: "#666666" }}>Entregas</Link></li>
                <li><Link href="/faq" className="text-[15px] text-zinc-600 transition-all hover:pl-1 hover:text-[#D4AF37]" style={{ color: "#666666" }}>FAQ</Link></li>
              </ul>
            </div>

            <div className="hidden md:block">
              <h3 className="mb-6 text-xs font-semibold uppercase tracking-wider text-zinc-900" style={{ color: "#1A1A1A" }}>Legal</h3>
              <ul className="space-y-4">
                <li><Link href="/termos-de-uso" className="text-[15px] text-zinc-600 transition-all hover:pl-1 hover:text-[#D4AF37]" style={{ color: "#666666" }}>Termos de Uso</Link></li>
                <li><Link href="/privacidade" className="text-[15px] text-zinc-600 transition-all hover:pl-1 hover:text-[#D4AF37]" style={{ color: "#666666" }}>Privacidade</Link></li>
                <li><Link href="/trocas-e-devolucoes" className="text-[15px] text-zinc-600 transition-all hover:pl-1 hover:text-[#D4AF37]" style={{ color: "#666666" }}>Políticas de Compras</Link></li>
                <li><Link href="/privacidade" className="text-[15px] text-zinc-600 transition-all hover:pl-1 hover:text-[#D4AF37]" style={{ color: "#666666" }}>Cookies</Link></li>
              </ul>
            </div>

            <div className="space-y-3 md:hidden">
              <details className="group rounded-2xl border border-zinc-200 bg-white px-5 py-4" open>
                <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.24em] text-[#1A1A1A] marker:hidden">A Luxijóias</summary>
                <ul className="mt-4 space-y-3">
                  <li><Link href="/quem-somos" className="text-[15px] text-[#555555] transition-colors hover:text-[#D4AF37]">Quem Somos</Link></li>
                  <li><Link href="/marcas" className="text-[15px] text-[#555555] transition-colors hover:text-[#D4AF37]">Marcas</Link></li>
                  <li><Link href="/blog" className="text-[15px] text-[#555555] transition-colors hover:text-[#D4AF37]">Blog</Link></li>
                  <li><Link href="/search?q=lancamentos" className="text-[15px] text-[#555555] transition-colors hover:text-[#D4AF37]">Lançamentos</Link></li>
                  <li><Link href="/categoria/ofertas" className="text-[15px] text-[#555555] transition-colors hover:text-[#D4AF37]">Ofertas</Link></li>
                  <li><Link href="/favorites" className="text-[15px] text-[#555555] transition-colors hover:text-[#D4AF37]">Favoritos</Link></li>
                  <li><Link href="/account" className="text-[15px] text-[#555555] transition-colors hover:text-[#D4AF37]">Minha Conta</Link></li>
                </ul>
              </details>

              <details className="group rounded-2xl border border-zinc-200 bg-white px-5 py-4">
                <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.24em] text-[#1A1A1A] marker:hidden">Suporte</summary>
                <ul className="mt-4 space-y-3">
                  <li><Link href="/contato" className="text-[15px] text-[#555555] transition-colors hover:text-[#D4AF37]">Central de Ajuda</Link></li>
                  <li><Link href="/trocas-e-devolucoes" className="text-[15px] text-[#555555] transition-colors hover:text-[#D4AF37]">Trocas e Devoluções</Link></li>
                  <li><Link href="/rastreio" className="text-[15px] text-[#555555] transition-colors hover:text-[#D4AF37]">Rastrear Pedido</Link></li>
                  <li><Link href="/checkout" className="text-[15px] text-[#555555] transition-colors hover:text-[#D4AF37]">Entregas</Link></li>
                  <li><Link href="/faq" className="text-[15px] text-[#555555] transition-colors hover:text-[#D4AF37]">FAQ</Link></li>
                </ul>
              </details>

              <details className="group rounded-2xl border border-zinc-200 bg-white px-5 py-4">
                <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.24em] text-[#1A1A1A] marker:hidden">Legal</summary>
                <ul className="mt-4 space-y-3">
                  <li><Link href="/termos-de-uso" className="text-[15px] text-[#555555] transition-colors hover:text-[#D4AF37]">Termos de Uso</Link></li>
                  <li><Link href="/privacidade" className="text-[15px] text-[#555555] transition-colors hover:text-[#D4AF37]">Privacidade</Link></li>
                  <li><Link href="/trocas-e-devolucoes" className="text-[15px] text-[#555555] transition-colors hover:text-[#D4AF37]">Políticas de Compras</Link></li>
                  <li><Link href="/privacidade" className="text-[15px] text-[#555555] transition-colors hover:text-[#D4AF37]">Cookies</Link></li>
                </ul>
              </details>
            </div>
            
            <div className="pt-4 md:col-span-3 lg:pt-2">
              <h3 className="mb-5 font-serif text-[clamp(2rem,3vw,2.45rem)] font-medium uppercase tracking-[0.14em] text-zinc-900" style={{ color: "#1A1A1A" }}>Fale com a gente</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-10">
                <div>
                  <h4 className="text-base font-medium text-zinc-900 md:text-[1.1rem]" style={{ color: "#1A1A1A" }}>Telefone / WhatsApp</h4>
                  <p className="mt-2 text-base text-zinc-600 transition-colors cursor-pointer hover:text-[#D4AF37]" style={{ color: "#666666" }}>{settings.supportPhone}</p>
                </div>
                <div>
                  <h4 className="text-base font-medium text-zinc-900 md:text-[1.1rem]" style={{ color: "#1A1A1A" }}>E-mail</h4>
                  <Link href="/contato" className="mt-2 inline-flex text-base text-zinc-600 transition-colors hover:text-[#D4AF37]" style={{ color: "#666666" }}>Abrir atendimento por e-mail</Link>
                </div>
                <div>
                  <h4 className="text-base font-medium text-zinc-900 md:text-[1.1rem]" style={{ color: "#1A1A1A" }}>Escritório</h4>
                  <p className="mt-2 text-base text-zinc-600" style={{ color: "#666666" }}>{settings.addressLine}<br />{settings.businessHours}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Payment, Trust & Copyright */}
        <div className="pt-10 flex flex-col xl:flex-row items-center xl:items-start justify-between gap-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 md:gap-14">
            <div>
              <span className="block text-[11px] font-medium font-serif uppercase tracking-widest text-[#666666] mb-4 text-center sm:text-left">Pagamento Seguro</span>
              <div className="flex items-center justify-center sm:justify-start">
                <Image
                  src="/formas-pagamento-luxijoias.avif"
                  alt="Bandeiras e formas de pagamento aceitas pela Luxijóias"
                  width={643}
                  height={188}
                  sizes="(max-width: 640px) 80vw, 500px"
                  className="h-20 sm:h-24 w-auto object-contain mix-blend-multiply opacity-90 grayscale hover:grayscale-0 transition-all duration-300"
                />
              </div>
            </div>

            <div>
              <span className="block text-[11px] font-medium font-serif uppercase tracking-widest text-[#666666] mb-4 text-center sm:text-left">Compra Garantida</span>
              <div className="flex items-center justify-center sm:justify-start">
                <Image
                  src="/selos-seguranca-google.avif"
                  alt="Selos de segurança e validação exibidos pela loja"
                  width={752}
                  height={141}
                  sizes="(max-width: 640px) 60vw, 320px"
                  className="h-14 sm:h-12 w-auto object-contain mix-blend-multiply opacity-90 grayscale hover:grayscale-0 transition-all duration-300"
                />
              </div>
            </div>
          </div>

          <p className="text-sm text-[#666666]">
            © {new Date().getFullYear()} Luxijóias. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
