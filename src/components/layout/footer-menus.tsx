"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { ChevronDown } from "lucide-react"

export function FooterMenus() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    luxi: true,
    suporte: true,
    legal: true
  })

  // Set all open on desktop, mobile can close them
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setOpenSections({ luxi: true, suporte: true, legal: true })
      } else {
        setOpenSections({ luxi: false, suporte: false, legal: false })
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSection = (section: string) => {
    if (window.innerWidth < 768) {
      setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-10 border-t border-[#E5E5E5] md:border-none mt-8 md:mt-0">
      {/* A Luxijóias */}
      <div className="border-b border-[#E5E5E5] md:border-none py-4 md:py-0">
        <button 
          onClick={() => toggleSection('luxi')}
          className="w-full flex items-center justify-between font-bold text-[#1A1A1A] uppercase tracking-wider text-[13px] md:mb-6"
        >
          A Luxijóias
          <ChevronDown className={`w-4 h-4 md:hidden transition-transform ${openSections.luxi ? 'rotate-180' : ''}`} />
        </button>
        {openSections.luxi && (
          <ul className="space-y-4 mt-4 md:mt-0">
            <li><Link href="/quem-somos" className="text-[15px] font-medium text-[#666666] hover:text-[#C19B54] transition-colors">Quem Somos</Link></li>
            <li><Link href="/marcas" className="text-[15px] font-medium text-[#666666] hover:text-[#C19B54] transition-colors">Marcas</Link></li>
            <li><Link href="/blog" className="text-[15px] font-medium text-[#666666] hover:text-[#C19B54] transition-colors">Blog</Link></li>
            <li><Link href="/search?q=lancamentos" className="text-[15px] font-medium text-[#666666] hover:text-[#C19B54] transition-colors">Lançamentos</Link></li>
            <li><Link href="/categoria/ofertas" className="text-[15px] font-medium text-[#666666] hover:text-[#C19B54] transition-colors">Ofertas</Link></li>
            <li><Link href="/favorites" className="text-[15px] font-medium text-[#666666] hover:text-[#C19B54] transition-colors">Favoritos</Link></li>
            <li><Link href="/account" className="text-[15px] font-medium text-[#666666] hover:text-[#C19B54] transition-colors">Minha Conta</Link></li>
          </ul>
        )}
      </div>

      {/* Suporte */}
      <div className="border-b border-[#E5E5E5] md:border-none py-4 md:py-0">
        <button 
          onClick={() => toggleSection('suporte')}
          className="w-full flex items-center justify-between font-bold text-[#1A1A1A] uppercase tracking-wider text-[13px] md:mb-6"
        >
          Suporte
          <ChevronDown className={`w-4 h-4 md:hidden transition-transform ${openSections.suporte ? 'rotate-180' : ''}`} />
        </button>
        {openSections.suporte && (
          <ul className="space-y-4 mt-4 md:mt-0">
            <li><Link href="/contato" className="text-[15px] font-medium text-[#666666] hover:text-[#C19B54] transition-colors">Central de Ajuda</Link></li>
            <li><Link href="/trocas-e-devolucoes" className="text-[15px] font-medium text-[#666666] hover:text-[#C19B54] transition-colors">Trocas e Devoluções</Link></li>
            <li><Link href="/rastreio" className="text-[15px] font-medium text-[#666666] hover:text-[#C19B54] transition-colors">Rastrear Pedido</Link></li>
            <li><Link href="/checkout" className="text-[15px] font-medium text-[#666666] hover:text-[#C19B54] transition-colors">Entregas</Link></li>
            <li><Link href="/faq" className="text-[15px] font-medium text-[#666666] hover:text-[#C19B54] transition-colors">FAQ</Link></li>
          </ul>
        )}
      </div>

      {/* Legal */}
      <div className="border-b border-[#E5E5E5] md:border-none py-4 md:py-0">
        <button 
          onClick={() => toggleSection('legal')}
          className="w-full flex items-center justify-between font-bold text-[#1A1A1A] uppercase tracking-wider text-[13px] md:mb-6"
        >
          Legal
          <ChevronDown className={`w-4 h-4 md:hidden transition-transform ${openSections.legal ? 'rotate-180' : ''}`} />
        </button>
        {openSections.legal && (
          <ul className="space-y-4 mt-4 md:mt-0">
            <li><Link href="/termos-de-uso" className="text-[15px] font-medium text-[#666666] hover:text-[#C19B54] transition-colors">Termos de Uso</Link></li>
            <li><Link href="/privacidade" className="text-[15px] font-medium text-[#666666] hover:text-[#C19B54] transition-colors">Privacidade</Link></li>
            <li><Link href="/trocas-e-devolucoes" className="text-[15px] font-medium text-[#666666] hover:text-[#C19B54] transition-colors">Políticas de Compras</Link></li>
            <li><Link href="/privacidade" className="text-[15px] font-medium text-[#666666] hover:text-[#C19B54] transition-colors">Cookies</Link></li>
          </ul>
        )}
      </div>
    </div>
  )
}
