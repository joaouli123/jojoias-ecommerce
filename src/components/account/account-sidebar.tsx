import Link from "next/link";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

type AccountSidebarProps = {
  userName?: string | null;
  userEmail?: string | null;
};

export function AccountSidebar({ userName, userEmail }: AccountSidebarProps) {
  return (
    <aside className="w-full lg:w-72 shrink-0 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="border-b border-zinc-100 pb-4">
        <p className="text-sm text-[#666666]">Minha conta</p>
        <h2 className="text-xl font-medium font-serif text-[#1A1A1A] mt-1">{userName || "Cliente"}</h2>
        <p className="text-sm text-[#666666] mt-1 break-all">{userEmail}</p>
      </div>

      <nav className="mt-4 space-y-2 text-sm font-semibold">
        <Link href="/account" className="block rounded-xl px-4 py-3 text-[#1A1A1A] hover:bg-[#FFFFFF] hover:text-[#1A1A1A]">
          Visão geral
        </Link>
        <Link href="/account/profile" className="block rounded-xl px-4 py-3 text-[#1A1A1A] hover:bg-[#FFFFFF] hover:text-[#1A1A1A]">
          Meu perfil
        </Link>
        <Link href="/account/orders" className="block rounded-xl px-4 py-3 text-[#1A1A1A] hover:bg-[#FFFFFF] hover:text-[#1A1A1A]">
          Meus pedidos
        </Link>
        <Link href="/account/addresses" className="block rounded-xl px-4 py-3 text-[#1A1A1A] hover:bg-[#FFFFFF] hover:text-[#1A1A1A]">
          Meus endereços
        </Link>
      </nav>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
        className="mt-5"
      >
        <Button type="submit" variant="outline" className="w-full h-11">
          Sair da conta
        </Button>
      </form>
    </aside>
  );
}