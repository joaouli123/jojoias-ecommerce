import Link from "next/link"
import Image from "next/image"
import { Instagram, Facebook, Youtube, Mail, Phone, MapPin } from "lucide-react"
import { getStoreSettings } from "@/lib/store-settings"
import { NewsletterSubscribeForm } from "@/components/layout/newsletter-subscribe-form"
import { WhatsAppIcon } from "@/components/ui/icons"

export async function Footer() {
  const settings = await getStoreSettings()

  return (
    <footer className="w-full border-t border-zinc-200 bg-[#FCFCFC] pt-16 pb-28 md:pb-8">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 pb-16 border-b border-zinc-200">
          
          {/* Brand & Newsletter Column */}
          <div className="lg:col-span-5 flex flex-col space-y-8">
            <div>
              <Image src="/logo-oficial.avif" alt="Luxijóias Semijoias" width={220} height={66} quality={50} sizes="(max-width: 640px) 180px, 220px" className="h-auto w-[180px] sm:w-[220px]" />
              <p className="mt-4 text-[15px] leading-relaxed text-[#666666] max-w-sm">
                {settings.tagline}
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-serif text-[clamp(2rem,3.1vw,2.5rem)] font-medium tracking-[-0.03em] text-[#1A1A1A]">Acompanhe as Novidades</h3>
              <p className="text-sm text-[#666666] max-w-sm">Inscreva-se para receber tendências, lançamentos e ofertas exclusivas no seu e-mail.</p>
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

          <div className="lg:col-span-7 grid grid-cols-1 gap-8 sm:gap-10 md:grid-cols-3">
            {/* Links Columns */}
            <div className="hidden md:block">
              <h3 className="font-semibold text-[#1A1A1A] mb-6 uppercase tracking-wider text-xs">A Luxijóias</h3>
              <ul className="space-y-4">
                <li><Link href="/quem-somos" className="text-[15px] text-[#666666] hover:text-[#D4AF37] hover:pl-1 transition-all">Quem Somos</Link></li>
                <li><Link href="/marcas" className="text-[15px] text-[#666666] hover:text-[#D4AF37] hover:pl-1 transition-all">Marcas</Link></li>
                <li><Link href="/blog" className="text-[15px] text-[#666666] hover:text-[#D4AF37] hover:pl-1 transition-all">Blog</Link></li>
                <li><Link href="/search?q=lancamentos" className="text-[15px] text-[#666666] hover:text-[#D4AF37] hover:pl-1 transition-all">Lançamentos</Link></li>
                <li><Link href="/categoria/ofertas" className="text-[15px] text-[#666666] hover:text-[#D4AF37] hover:pl-1 transition-all">Ofertas</Link></li>
                <li><Link href="/favorites" className="text-[15px] text-[#666666] hover:text-[#D4AF37] hover:pl-1 transition-all">Favoritos</Link></li>
                <li><Link href="/account" className="text-[15px] text-[#666666] hover:text-[#D4AF37] hover:pl-1 transition-all">Minha Conta</Link></li>
              </ul>
            </div>

            <div className="hidden md:block">
              <h3 className="font-semibold text-[#1A1A1A] mb-6 uppercase tracking-wider text-xs">Suporte</h3>
              <ul className="space-y-4">
                <li><Link href="/contato" className="text-[15px] text-[#666666] hover:text-[#D4AF37] hover:pl-1 transition-all">Central de Ajuda</Link></li>
                <li><Link href="/trocas-e-devolucoes" className="text-[15px] text-[#666666] hover:text-[#D4AF37] hover:pl-1 transition-all">Trocas e Devoluções</Link></li>
                <li><Link href="/rastreio" className="text-[15px] text-[#666666] hover:text-[#D4AF37] hover:pl-1 transition-all">Rastrear Pedido</Link></li>
                <li><Link href="/checkout" className="text-[15px] text-[#666666] hover:text-[#D4AF37] hover:pl-1 transition-all">Entregas</Link></li>
                <li><Link href="/faq" className="text-[15px] text-[#666666] hover:text-[#D4AF37] hover:pl-1 transition-all">FAQ</Link></li>
              </ul>
            </div>

            <div className="hidden md:block">
              <h3 className="font-semibold text-[#1A1A1A] mb-6 uppercase tracking-wider text-xs">Legal</h3>
              <ul className="space-y-4">
                <li><Link href="/termos-de-uso" className="text-[15px] text-[#666666] hover:text-[#D4AF37] hover:pl-1 transition-all">Termos de Uso</Link></li>
                <li><Link href="/privacidade" className="text-[15px] text-[#666666] hover:text-[#D4AF37] hover:pl-1 transition-all">Privacidade</Link></li>
                <li><Link href="/trocas-e-devolucoes" className="text-[15px] text-[#666666] hover:text-[#D4AF37] hover:pl-1 transition-all">Políticas de Compras</Link></li>
                <li><Link href="/privacidade" className="text-[15px] text-[#666666] hover:text-[#D4AF37] hover:pl-1 transition-all">Cookies</Link></li>
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
            
            <div className="col-span-2 md:col-span-3 pt-6 lg:pt-2">
              <h3 className="mb-5 font-serif text-[clamp(2rem,3vw,2.45rem)] font-medium uppercase tracking-[0.14em] text-[#1A1A1A]">Fale com a gente</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 stroke-[1.8] text-[#666666]" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-[#1A1A1A] md:text-[1.1rem]">Telefone / WhatsApp</h4>
                    <p className="mt-1 text-base text-[#666666] transition-colors cursor-pointer hover:text-[#D4AF37]">{settings.supportPhone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 stroke-[1.8] text-[#666666]" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-[#1A1A1A] md:text-[1.1rem]">E-mail</h4>
                    <Link href="/contato" className="mt-1 inline-flex text-base text-[#666666] transition-colors hover:text-[#D4AF37]">Abrir atendimento por e-mail</Link>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 stroke-[1.8] text-[#666666]" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-[#1A1A1A] md:text-[1.1rem]">Escritório</h4>
                    <p className="mt-1 text-base text-[#666666]">{settings.addressLine}<br />{settings.businessHours}</p>
                  </div>
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
