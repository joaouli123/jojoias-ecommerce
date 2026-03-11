import Link from "next/link"
import Image from "next/image"
import { Instagram, Facebook, Youtube, Mail, Phone, MapPin } from "lucide-react"
import { getStoreSettings } from "@/lib/store-settings"
import { NewsletterSubscribeForm } from "@/components/layout/newsletter-subscribe-form"
import { WhatsAppIcon } from "@/components/ui/icons"

export async function Footer() {
  const settings = await getStoreSettings()

  return (
    <footer className="w-full bg-[#FCFCFC] border-t border-zinc-200 pt-16 pb-8">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 pb-16 border-b border-zinc-200">
          
          {/* Brand & Newsletter Column */}
          <div className="lg:col-span-5 flex flex-col space-y-8">
            <div>
              <Image src="/logo-oficial.avif" alt="JoJoias Semijoias" width={220} height={66} sizes="(max-width: 640px) 180px, 220px" className="h-auto w-[180px] sm:w-[220px]" />
              <p className="mt-4 text-[15px] leading-relaxed text-zinc-600 max-w-sm">
                {settings.tagline}
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-zinc-900 font-serif">Acompanhe as Novidades</h3>
              <p className="text-sm text-zinc-500 max-w-sm">Inscreva-se para receber tendências, lançamentos e ofertas exclusivas no seu e-mail.</p>
              <NewsletterSubscribeForm />
            </div>

            <div className="flex gap-3 pt-2">
              <Link href={settings.instagramUrl} target="_blank" aria-label="Instagram" className="w-10 h-10 rounded-full border border-zinc-300 bg-white flex items-center justify-center text-zinc-700 hover:text-white hover:bg-[#D4AF37] hover:border-[#D4AF37] transition-all shadow-sm">
                <Instagram className="w-4 h-4" />
              </Link>
              <Link href={settings.facebookUrl} target="_blank" aria-label="Facebook" className="w-10 h-10 rounded-full border border-zinc-300 bg-white flex items-center justify-center text-zinc-700 hover:text-white hover:bg-[#D4AF37] hover:border-[#D4AF37] transition-all shadow-sm">
                <Facebook className="w-4 h-4" />
              </Link>
              <Link href={settings.youtubeUrl} target="_blank" aria-label="YouTube" className="w-10 h-10 rounded-full border border-zinc-300 bg-white flex items-center justify-center text-zinc-700 hover:text-white hover:bg-[#D4AF37] hover:border-[#D4AF37] transition-all shadow-sm">
                <Youtube className="w-4 h-4" />
              </Link>
              <Link href={settings.whatsappUrl} target="_blank" aria-label="WhatsApp" className="w-10 h-10 rounded-full border border-zinc-300 bg-white flex items-center justify-center text-zinc-700 hover:text-white hover:bg-[#D4AF37] hover:border-[#D4AF37] transition-all shadow-sm">
                <WhatsAppIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10">
            {/* Links Columns */}
            <div>
              <h3 className="font-semibold text-zinc-950 mb-6 uppercase tracking-wider text-xs">A JoJoias</h3>
              <ul className="space-y-4">
                <li><Link href="/quem-somos" className="text-[15px] text-zinc-500 hover:text-[#D4AF37] hover:pl-1 transition-all">Quem Somos</Link></li>
                <li><Link href="/marcas" className="text-[15px] text-zinc-500 hover:text-[#D4AF37] hover:pl-1 transition-all">Marcas</Link></li>
                <li><Link href="/blog" className="text-[15px] text-zinc-500 hover:text-[#D4AF37] hover:pl-1 transition-all">Blog</Link></li>
                <li><Link href="/search?q=lancamentos" className="text-[15px] text-zinc-500 hover:text-[#D4AF37] hover:pl-1 transition-all">Lançamentos</Link></li>
                <li><Link href="/categoria/ofertas" className="text-[15px] text-zinc-500 hover:text-[#D4AF37] hover:pl-1 transition-all">Ofertas</Link></li>
                <li><Link href="/favorites" className="text-[15px] text-zinc-500 hover:text-[#D4AF37] hover:pl-1 transition-all">Favoritos</Link></li>
                <li><Link href="/account" className="text-[15px] text-zinc-500 hover:text-[#D4AF37] hover:pl-1 transition-all">Minha Conta</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-950 mb-6 uppercase tracking-wider text-xs">Suporte</h3>
              <ul className="space-y-4">
                <li><Link href="/contato" className="text-[15px] text-zinc-500 hover:text-[#D4AF37] hover:pl-1 transition-all">Central de Ajuda</Link></li>
                <li><Link href="/trocas-e-devolucoes" className="text-[15px] text-zinc-500 hover:text-[#D4AF37] hover:pl-1 transition-all">Trocas e Devoluções</Link></li>
                <li><Link href="/rastreio" className="text-[15px] text-zinc-500 hover:text-[#D4AF37] hover:pl-1 transition-all">Rastrear Pedido</Link></li>
                <li><Link href="/checkout" className="text-[15px] text-zinc-500 hover:text-[#D4AF37] hover:pl-1 transition-all">Entregas</Link></li>
                <li><Link href="/faq" className="text-[15px] text-zinc-500 hover:text-[#D4AF37] hover:pl-1 transition-all">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-zinc-950 mb-6 uppercase tracking-wider text-xs">Legal</h3>
              <ul className="space-y-4">
                <li><Link href="/termos-de-uso" className="text-[15px] text-zinc-500 hover:text-[#D4AF37] hover:pl-1 transition-all">Termos de Uso</Link></li>
                <li><Link href="/privacidade" className="text-[15px] text-zinc-500 hover:text-[#D4AF37] hover:pl-1 transition-all">Privacidade</Link></li>
                <li><Link href="/trocas-e-devolucoes" className="text-[15px] text-zinc-500 hover:text-[#D4AF37] hover:pl-1 transition-all">Políticas de Compras</Link></li>
                <li><Link href="/privacidade" className="text-[15px] text-zinc-500 hover:text-[#D4AF37] hover:pl-1 transition-all">Cookies</Link></li>
              </ul>
            </div>
            
            <div className="col-span-2 md:col-span-3 pt-6 lg:pt-2">
              <h3 className="font-semibold text-zinc-950 mb-5 uppercase tracking-wider text-xs">Fale com a gente</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-zinc-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-zinc-900">Telefone / WhatsApp</h4>
                    <p className="text-sm text-zinc-500 mt-1 hover:text-[#D4AF37] transition-colors cursor-pointer">{settings.supportPhone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-zinc-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-zinc-900">E-mail</h4>
                    <Link href="/contato" className="mt-1 inline-flex text-sm text-zinc-500 transition-colors hover:text-[#D4AF37]">Abrir atendimento por e-mail</Link>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-zinc-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-zinc-900">Escritório</h4>
                    <p className="text-sm text-zinc-500 mt-1">{settings.addressLine}<br />{settings.businessHours}</p>
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
              <span className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-4 text-center sm:text-left">Pagamento Seguro</span>
              <div className="flex items-center justify-center sm:justify-start">
                <Image
                  src="/formas-pagamento-jojoias.avif"
                  alt="Bandeiras e formas de pagamento aceitas pela JoJoias"
                  width={643}
                  height={188}
                  sizes="(max-width: 640px) 80vw, 500px"
                  className="h-20 sm:h-24 w-auto object-contain mix-blend-multiply opacity-90 grayscale hover:grayscale-0 transition-all duration-300"
                />
              </div>
            </div>

            <div>
              <span className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-4 text-center sm:text-left">Compra Garantida</span>
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

          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} JoJoias. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
