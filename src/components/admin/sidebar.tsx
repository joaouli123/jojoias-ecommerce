"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Package, Tags, PlugZap, Users, TicketPercent, Images, Settings, BarChart3, Star, FileText, BadgePercent, ShieldCheck, AlertTriangle, Activity, ImageUp, Newspaper, ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { hasAdminPermission, type AdminPermission } from "@/lib/admin-permissions";

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: AdminPermission;
};

type NavGroup = {
  id: string;
  label: string;
  description: string;
  items: NavItem[];
};

const navigationGroups = [
  {
    id: "overview",
    label: "Visão geral",
    description: "Painel e acompanhamento executivo.",
    items: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard, permission: "dashboard:view" },
      { name: "Relatórios", href: "/admin/reports", icon: BarChart3, permission: "reports:view" },
      { name: "Saúde", href: "/admin/health", icon: Activity, permission: "reports:view" },
      { name: "Incidentes", href: "/admin/incidents", icon: AlertTriangle, permission: "reports:view" },
      { name: "Auditoria", href: "/admin/audit-logs", icon: ShieldCheck, permission: "reports:view" },
    ],
  },
  {
    id: "catalog",
    label: "Catálogo",
    description: "Produtos, taxonomias e estrutura comercial.",
    items: [
      { name: "Produtos", href: "/admin/products", icon: Package, permission: "products:manage" },
      { name: "Marcas", href: "/admin/brands", icon: BadgePercent, permission: "catalog:manage" },
      { name: "Categorias", href: "/admin/categories", icon: Tags, permission: "catalog:manage" },
    ],
  },
  {
    id: "sales",
    label: "Vendas e clientes",
    description: "Pedidos, atendimento e base de clientes.",
    items: [
      { name: "Pedidos", href: "/admin/orders", icon: ShoppingCart, permission: "orders:view" },
      { name: "Clientes", href: "/admin/customers", icon: Users, permission: "customers:view" },
    ],
  },
  {
    id: "content",
    label: "Conteúdo e marketing",
    description: "Campanhas, mídia e conteúdo editorial.",
    items: [
      { name: "Avaliações", href: "/admin/reviews", icon: Star, permission: "marketing:manage" },
      { name: "Cupons", href: "/admin/coupons", icon: TicketPercent, permission: "marketing:manage" },
      { name: "Banners", href: "/admin/banners", icon: Images, permission: "marketing:manage" },
      { name: "Mídia", href: "/admin/media", icon: ImageUp, permission: "marketing:manage" },
      { name: "Páginas", href: "/admin/pages", icon: FileText, permission: "marketing:manage" },
      { name: "Blog", href: "/admin/blog", icon: Newspaper, permission: "marketing:manage" },
    ],
  },
  {
    id: "settings",
    label: "Configurações",
    description: "Ajustes da operação e integrações externas.",
    items: [
      { name: "Configurações", href: "/admin/settings", icon: Settings, permission: "settings:manage" },
      { name: "Integrações", href: "/admin/integrations", icon: PlugZap, permission: "settings:manage" },
    ],
  },
] satisfies NavGroup[];

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitialOpenGroups(pathname: string, groups: NavGroup[]) {
  return Object.fromEntries(
    groups.map((group) => [
      group.id,
      group.id === "overview" || group.id === "catalog" || group.items.some((item) => isActivePath(pathname, item.href)),
    ]),
  );
}

type SidebarProps = {
  role?: string | null;
  userName?: string | null;
};

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const visibleGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasAdminPermission(role, item.permission)),
    }))
    .filter((group) => group.items.length > 0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => getInitialOpenGroups(pathname, visibleGroups));

  function toggleGroup(groupId: string) {
    setOpenGroups((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }));
  }

  function renderNavigation() {
    return (
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-6">
          <Link href="/admin" className="text-xl font-bold font-serif italic tracking-tighter text-white">
            STORE<span className="text-primary-400 font-sans not-italic">Admin</span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-xl p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Fechar menu administrativo"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-3">
            {visibleGroups.map((group) => {
              const isOpen = openGroups[group.id] ?? getInitialOpenGroups(pathname, visibleGroups)[group.id] ?? true;
              const hasActiveItem = group.items.some((item) => isActivePath(pathname, item.href));

              return (
                <section key={group.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className={cn(
                      "flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors",
                      hasActiveItem ? "bg-white/10" : "hover:bg-white/10",
                    )}
                    aria-expanded={isOpen}
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{group.label}</p>
                      <p className="mt-1 text-xs text-gray-400">{group.description}</p>
                    </div>
                    {isOpen ? <ChevronDown className="mt-0.5 h-4 w-4 text-gray-400" /> : <ChevronRight className="mt-0.5 h-4 w-4 text-gray-400" />}
                  </button>

                  {isOpen ? (
                    <div className="space-y-1 border-t border-white/10 px-2 py-2">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = isActivePath(pathname, item.href);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                              isActive
                                ? "bg-white text-gray-950 shadow-sm"
                                : "text-gray-300 hover:bg-white/10 hover:text-white",
                            )}
                          >
                            <Icon className={cn("h-4 w-4", isActive ? "text-gray-950" : "text-gray-400")} />
                            <span>{item.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        </div>

        <div className="border-t border-white/10 p-4">
          <Link href="/" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-white/10 hover:text-white">
            &larr; Voltar para a loja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur md:hidden">
        <span className="font-bold font-serif italic tracking-tighter text-xl text-gray-950">
          STORE<span className="text-primary-500 font-sans not-italic">Admin</span>
        </span>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-xl border border-gray-200 p-2 text-gray-700 transition-colors hover:bg-gray-100"
          aria-label="Abrir menu administrativo"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      <aside className="hidden min-h-screen w-72 shrink-0 bg-gray-950 text-white md:flex md:flex-col">
        {renderNavigation()}
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-gray-950/55 transition-opacity md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[88vw] max-w-[360px] bg-gray-950 text-white shadow-2xl transition-transform md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-hidden={!mobileOpen}
      >
        {renderNavigation()}
      </aside>
    </>
  );
}

