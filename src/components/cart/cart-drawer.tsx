"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ShoppingCart, X, Trash2, ArrowRight, Minus, Plus } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { CART_UPDATED_EVENT, dispatchCartUpdated, type CartStatePayload } from "@/lib/cart-sync"

type CartDrawerProps = {
  initialCart?: CartStatePayload
}

export function CartDrawer({ initialCart = { items: [], subtotal: 0, shipping: 0, total: 0 } }: CartDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isHoverOpen, setIsHoverOpen] = useState(false)
  const [cart, setCart] = useState<CartStatePayload>(initialCart)
  const [isLoading, setIsLoading] = useState(false)

  const itemCount = useMemo(
    () => cart.items.reduce((acc, item) => acc + item.quantity, 0),
    [cart.items],
  )

  const syncCart = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/cart", { method: "GET", cache: "no-store" })
      if (!response.ok) return
      const payload = (await response.json()) as CartStatePayload
      setCart(payload)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateQuantity = useCallback(async (productId: string, quantity: number, variantId?: string | null) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity, variantId: variantId ?? undefined }),
      })

      if (!response.ok) return
      const payload = (await response.json()) as CartStatePayload
      setCart(payload)
      dispatchCartUpdated(payload)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const removeItem = useCallback(async (productId: string, variantId?: string | null) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ productId })
      if (variantId) {
        params.set("variantId", variantId)
      }

      const response = await fetch(`/api/cart?${params.toString()}`, {
        method: "DELETE",
      })

      if (!response.ok) return
      const payload = (await response.json()) as CartStatePayload
      setCart(payload)
      dispatchCartUpdated(payload)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void syncCart()
  }, [syncCart])

  useEffect(() => {
    if (!isOpen) return
    void syncCart()
  }, [isOpen, syncCart])

  useEffect(() => {
    if (!isHoverOpen) return
    void syncCart()
  }, [isHoverOpen, syncCart])

  useEffect(() => {
    const handleCartUpdated = (event: Event) => {
      const payload = (event as CustomEvent<CartStatePayload>).detail
      if (!payload) return
      setCart(payload)
    }

    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated)
    return () => window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated)
  }, [])

  return (
    <>
      <div
        className="relative"
        onMouseEnter={() => setIsHoverOpen(true)}
        onMouseLeave={() => setIsHoverOpen(false)}
      >
        <button 
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2 hover:opacity-80 transition-opacity"
          aria-label={itemCount > 0 ? `Abrir carrinho com ${itemCount} item(ns)` : "Abrir carrinho"}
        >
          <div className="relative">
            <ShoppingCart className="h-7 w-7 text-zinc-800" strokeWidth={1.5} />
          </div>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D4AF37] text-xs font-bold text-white">
            {itemCount}
          </span>
        </button>

        <div className={`absolute right-0 top-full z-40 hidden w-80 pt-4 lg:block ${isHoverOpen && !isOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
          <div className={`rounded-[20px] border border-zinc-200 bg-white p-4 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.25)] transition-all duration-200 ${isHoverOpen && !isOpen ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-zinc-950">Seu carrinho</p>
              <span className="text-xs text-zinc-500">{itemCount} item(ns)</span>
            </div>

            {!cart.items.length && !isLoading ? (
              <p className="rounded-[20px] border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">Seu carrinho está vazio.</p>
            ) : (
              <div className="space-y-3">
                {cart.items.slice(0, 3).map((item) => (
                  <div key={`${item.productId}-${item.variantId ?? "base"}`} className="flex gap-3">
                    <div className="h-14 w-14 overflow-hidden rounded-[20px] border border-zinc-200 bg-zinc-50">
                      <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${item.image || "https://images.unsplash.com/photo-1611095567219-79caa80c5980?q=80&w=300"})` }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900">{item.name}</p>
                      {item.variantName ? <p className="truncate text-xs text-zinc-500">{item.variantName}</p> : null}
                      <p className="mt-1 text-xs text-zinc-500">Qtd: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-bold text-zinc-950">{formatCurrency(item.lineTotal)}</span>
                  </div>
                ))}

                {cart.items.length > 3 ? <p className="text-xs text-zinc-500">+ {cart.items.length - 3} item(ns) no carrinho</p> : null}
              </div>
            )}

            <div className="mt-4 border-t border-zinc-200 pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Subtotal</span>
                <span className="font-bold text-zinc-950">{formatCurrency(cart.total)}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link href="/cart" className="inline-flex h-11 items-center justify-center rounded-[20px] border border-zinc-200 px-4 text-sm font-semibold text-zinc-900 hover:border-[#D4AF37] hover:text-[#D4AF37]">
                  Ver carrinho
                </Link>
                <button type="button" onClick={() => setIsOpen(true)} className="inline-flex h-11 items-center justify-center rounded-[20px] bg-[#111111] px-4 text-sm font-semibold text-white hover:bg-[#111111]/90">
                  Abrir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
            <h2 className="text-lg font-bold text-zinc-950 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" /> Seu Carrinho
            </h2>
            <button 
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
              aria-label="Fechar carrinho"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {!cart.items.length && !isLoading ? (
              <div className="rounded-[20px] border border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-zinc-500">
                Seu carrinho está vazio.
              </div>
            ) : (
              cart.items.map((item) => (
                <div key={`${item.productId}-${item.variantId ?? "base"}`} className="flex gap-4">
                  <div className="h-20 w-20 flex-shrink-0 rounded-[20px] border border-zinc-200 bg-zinc-50 overflow-hidden">
                    <div
                      className="w-full h-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${item.image || "https://images.unsplash.com/photo-1611095567219-79caa80c5980?q=80&w=300"})` }}
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <Link href={`/produto/${item.slug}`} className="text-sm font-medium text-zinc-900 line-clamp-1 hover:text-[#D4AF37] transition-colors" onClick={() => setIsOpen(false)}>
                        {item.name}
                      </Link>
                      {item.variantName ? <p className="mt-1 text-xs text-zinc-500">{item.variantName}</p> : null}
                      <p className="mt-1 text-sm font-bold text-zinc-950">{formatCurrency(item.unitPrice)}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center rounded-[20px] border border-zinc-200">
                        <button
                          onClick={() => void updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                          className="px-2 py-1 text-zinc-500 hover:text-zinc-900 disabled:opacity-50"
                          disabled={isLoading}
                          aria-label="Diminuir quantidade"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="px-2 text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => void updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                          className="px-2 py-1 text-zinc-500 hover:text-zinc-900 disabled:opacity-50"
                          disabled={isLoading}
                          aria-label="Aumentar quantidade"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => void removeItem(item.productId, item.variantId)}
                        className="text-sm text-red-500 hover:text-red-700 hover:underline flex items-center gap-1 disabled:opacity-50"
                        disabled={isLoading}
                      >
                        <Trash2 className="h-3 w-3" /> Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer - Checkout */}
          <div className="border-t border-zinc-100 bg-zinc-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-medium text-zinc-500">Subtotal</span>
              <span className="text-xl font-black text-zinc-950">{formatCurrency(cart.total)}</span>
            </div>
            <p className="text-sm text-zinc-500 mb-6">Frete e impostos calculados no checkout.</p>
            <Link
              href="/cart"
              onClick={() => setIsOpen(false)}
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-[20px] bg-[#111111] px-8 text-base font-medium text-zinc-50 transition-colors hover:bg-[#111111]/90"
            >
              Finalizar Compra <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

