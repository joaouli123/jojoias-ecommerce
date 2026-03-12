import Image from "next/image"
import { User, HeadphonesIcon, Menu, MessageCircle, Gem, Newspaper, BadgePercent, Link2, Circle, CreditCard, Phone, Mail, Clock, ChevronRight, ChevronDown, ArrowRight, Badge } from "lucide-react"
import Link from "next/link"
import { CartDrawer } from "@/components/cart/cart-drawer"
import { PixIcon } from "@/components/ui/icons"
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer"
import { SearchBar } from "@/components/layout/search-bar"
import { getStoreSettings } from "@/lib/store-settings"

const navigationItems = [
  { label: "Marcas", href: "/marcas", icon: Badge },
  { label: "Blog", href: "/blog", icon: Newspaper },
  { label: "Acessórios", href: "/categoria/acessorios", icon: Gem },
  { label: "Anéis", href: "/categoria/aneis", icon: Circle, hasChevron: true },
  { label: "Colares", href: "/categoria/colares", icon: Circle, hasChevron: true },
  { label: "Promoções", href: "/categoria/promocoes", icon: BadgePercent },
  { label: "Pulseiras", href: "/categoria/pulseiras", icon: Link2 },
];

export async function Header() {
  const settings = await getStoreSettings()
  const announcementMessages = [settings.announcementText, settings.announcementSecondaryText].filter(Boolean)

  return (
    <header className="w-full bg-white z-50 border-b border-zinc-100">
      {/* Top Banner - Fixed Mobile & Desktop */}
      {settings.announcementEnabled ? (
        <div className="bg-[#111111] text-[#D4AF37] text-[12px] font-medium py-2 overflow-hidden relative border-b border-[#D4AF37]/20">
          <div className="flex w-full whitespace-nowrap animate-[marquee_20s_linear_infinite] hover:[animation-play-state:paused]">
            <style
              dangerouslySetInnerHTML={{
                __html: `
                  @keyframes marquee {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(-50%); }
                  }
                `,
              }}
            />
            {[0, 1].map((duplicate) => (
              <div key={duplicate} className="flex shrink-0 items-center justify-around min-w-full gap-8 pr-8" aria-hidden={duplicate === 1}>
                {announcementMessages.map((message) => (
                  <span key={`${duplicate}-${message}`} className="flex items-center gap-2">
                    <PixIcon className="w-[14px] h-[14px] text-[#32BCAD]" />
                    <strong className="font-medium font-serif">{message}</strong>
                  </span>
                ))}
                {duplicate === 0 ? (
                  <Link href={settings.announcementLinkHref} className="flex items-center gap-2 underline decoration-transparent underline-offset-4 transition hover:decoration-current">
                    <CreditCard className="w-3.5 h-3.5" />
                    {settings.announcementLinkLabel}
                  </Link>
                ) : (
                  <span className="flex items-center gap-2 underline decoration-transparent underline-offset-4">
                    <CreditCard className="w-3.5 h-3.5" />
                    {settings.announcementLinkLabel}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Main Header Area */}
      <div className="mx-auto flex flex-col lg:flex-row h-auto lg:h-[90px] max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8 gap-4 py-4 lg:py-0">
        
        {/* Mobile Top Row: Burguer, Logo, Cart */}
        <div className="w-full flex items-center justify-between lg:w-auto">
          <MobileNavDrawer />

          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center justify-center group">
            <Image
              src="/logo-oficial.avif"
              alt="Luxijóias Semijoias"
              width={200}
              height={60}
              quality={50}
              priority
              sizes="(max-width: 640px) 150px, (max-width: 1024px) 170px, 200px"
              className="h-auto w-[150px] sm:w-[170px] lg:w-[200px]"
            />
          </Link>

          <div className="flex lg:hidden items-center text-[#1A1A1A]">
            <CartDrawer />
          </div>
        </div>

        {/* Search - Desktop & Mobile */}
        <div className="w-full flex-1 items-center px-0 lg:px-8 xl:px-16 flex max-w-3xl">
          <SearchBar />
        </div>

  {/* Actions - Desktop */}
        <div className="hidden lg:flex items-center gap-8 shrink-0">
          {/* Atendimento Dropdown */}
          <div className="relative group/atendimento z-50">
            <Link href="/atendimento" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity pb-8 -mb-8">
              <div className="w-10 h-10 rounded-full bg-[#FFFFFF] flex items-center justify-center border border-zinc-100">
                <HeadphonesIcon className="w-5 h-5 stroke-[1.5] text-[#D4AF37]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-[#666666] uppercase tracking-wide leading-tight mb-0.5">Atendimento</span>
                <span className="text-[13px] font-medium font-serif text-[#1A1A1A] leading-none">Central de Ajuda</span>
              </div>
            </Link>

            <div className="absolute right-0 top-[100%] mt-6 opacity-0 invisible group-hover/atendimento:opacity-100 group-hover/atendimento:visible transition-all duration-300">
              <div className="w-[320px] bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-zinc-100 p-5 flex flex-col relative before:content-[''] before:absolute before:-top-2 before:right-12 before:w-4 before:h-4 before:bg-white before:border-t before:border-l before:border-zinc-100 before:transform before:rotate-45">
                <div className="flex flex-col gap-4">
                  <Link href={settings.whatsappUrl} target="_blank" rel="noreferrer" className="flex gap-3 items-center rounded-2xl transition-colors hover:bg-[#FFFFFF] -mx-2 px-2 py-1.5">
                    <MessageCircle className="w-5 h-5 text-[#1A1A1A] shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[13px] font-medium font-serif text-[#1A1A1A] leading-none mb-1">WhatsApp:</span>
                      <span className="text-[14px] text-[#666666] leading-none">{settings.whatsappPhone}</span>
                    </div>
                  </Link>
                  <div className="w-full h-px bg-[#F9F8F6]"></div>
                  <Link href={`tel:${settings.supportPhone.replace(/\D/g, "")}`} className="flex gap-3 items-center rounded-2xl transition-colors hover:bg-[#FFFFFF] -mx-2 px-2 py-1.5">
                    <Phone className="w-5 h-5 text-[#1A1A1A] shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[13px] font-medium font-serif text-[#1A1A1A] leading-none mb-1">Telefone:</span>
                      <span className="text-[14px] text-[#666666] leading-none">{settings.supportPhone}</span>
                    </div>
                  </Link>
                  <div className="w-full h-px bg-[#F9F8F6]"></div>
                  <Link href="/contato" className="flex gap-3 items-center rounded-2xl transition-colors hover:bg-[#FFFFFF] -mx-2 px-2 py-1.5">
                    <Mail className="w-5 h-5 text-[#1A1A1A] shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[13px] font-medium font-serif text-[#1A1A1A] leading-none mb-1">E-mail:</span>
                      <span className="text-[14px] text-[#666666] leading-none">Abrir atendimento por e-mail</span>
                    </div>
                  </Link>
                  <div className="w-full h-px bg-[#F9F8F6]"></div>
                  <div className="flex gap-3 items-center">
                    <Clock className="w-5 h-5 text-[#1A1A1A] shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[13px] font-medium font-serif text-[#1A1A1A] leading-none mb-1">Horário de Atendimento</span>
                      <span className="text-[14px] text-[#666666] leading-none">{settings.businessHours}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 border-t border-zinc-100 pt-5">
                  <Link href="/atendimento" className="block w-full rounded-[20px] bg-[#111111] py-3.5 text-center text-[14px] font-medium font-serif text-white transition-colors hover:bg-[#666666]">Fale Conosco</Link>
                </div>
              </div>
            </div>
          </div>

          {/* Bem-vindo Dropdown */}
          <div className="relative group/user z-50">
            <Link href="/login" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity pb-8 -mb-8">
              <div className="w-10 h-10 rounded-full bg-[#FFFFFF] flex items-center justify-center border border-zinc-100">
                <User className="w-5 h-5 stroke-[1.5] text-[#D4AF37]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-[#666666] uppercase tracking-wide leading-tight mb-0.5">Bem-vindo(a)</span>
                <span className="text-[13px] font-medium font-serif text-[#1A1A1A] leading-none">Entre <span className="font-normal text-[#666666]">ou</span> Cadastre-se</span>
              </div>
            </Link>

            <div className="absolute right-0 top-[100%] mt-6 opacity-0 invisible group-hover/user:opacity-100 group-hover/user:visible transition-all duration-300">
              <div className="w-[300px] bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-zinc-100 p-5 flex flex-col relative before:content-[''] before:absolute before:-top-2 before:right-12 before:w-4 before:h-4 before:bg-white before:border-t before:border-l before:border-zinc-100 before:transform before:rotate-45">
                <Link href="/login" className="flex w-full items-center justify-between rounded-[20px] bg-[#111111] px-5 py-3.5 text-[15px] font-medium font-serif text-white transition-colors hover:bg-[#666666]">
                  Entrar <ChevronRight className="w-5 h-5" />
                </Link>
                <div className="flex flex-col mt-4 gap-2.5 px-1">
                  <Link href="/account/orders" className="text-[15px] font-medium text-[#1A1A1A] hover:text-[#D4AF37] transition-colors">Meus pedidos</Link>
                  <div className="text-[15px] text-[#1A1A1A]">
                    Cliente novo? <Link href="/register" className="font-medium font-serif border-b-2 border-[#111111] hover:text-[#D4AF37] hover:border-[#D4AF37] transition-colors pb-0.5">Cadastre-se</Link>
                  </div>
                </div>
                <div className="w-full h-px bg-[#F9F8F6] my-4"></div>
                <span className="text-[15px] font-medium text-[#1A1A1A] px-1 mb-2">Rastrear Pedido</span>
                <form action="/rastreio" className="relative">
                  <input name="pedido" type="text" placeholder="Pedido ou rastreio" className="w-full border border-zinc-200 rounded-full h-11 pl-4 pr-12 text-[14px] outline-none focus:border-[#D4AF37] transition-colors shadow-sm" />
                  <button type="submit" aria-label="Rastrear pedido" className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full text-[#1A1A1A] hover:text-[#D4AF37] transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="pb-8 -mb-8">
            <CartDrawer />
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="hidden lg:block w-full border-y border-zinc-200 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="flex items-center gap-0 h-14 text-[15px] font-medium font-serif text-[#1A1A1A]">
            <li className="h-full flex items-center pr-7 mr-1 border-r border-zinc-200 shrink-0">
              <Link href="/categoria/todos" className="flex items-center gap-2.5 h-full hover:text-[#D4AF37] transition-colors">
                <Menu className="w-4 h-4" />
                <span>Todas Categorias</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </Link>
            </li>

            {navigationItems.map((item, index) => {
              const Icon = item.icon;

              return (
                <li
                  key={item.label}
                  className={`h-full flex items-center ${index < navigationItems.length - 1 ? "mr-1" : ""}`}
                >
                  <Link
                    href={item.href}
                    className="flex items-center gap-2.5 h-full px-5 rounded-lg text-[#1A1A1A] hover:text-[#D4AF37] hover:bg-[#D4AF37]/[0.08] transition-all"
                  >
                    <Icon className="w-4 h-4" strokeWidth={1.8} />
                    <span>{item.label}</span>
                    {item.hasChevron ? <ChevronDown className="w-3.5 h-3.5" /> : null}
                  </Link>
                </li>
              );
            })}

            <li className="ml-auto pl-6">
              <Link href="/categoria/ofertas" className="inline-flex items-center gap-2 rounded-xl bg-[#111111] px-5 py-2 text-[14px] font-medium font-serif text-[#D4AF37] hover:bg-[#1a1a1a] transition-colors shadow-sm">
                <BadgePercent className="w-3.5 h-3.5" strokeWidth={2.1} />
                <span>Ofertas Especiais</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  )
}



