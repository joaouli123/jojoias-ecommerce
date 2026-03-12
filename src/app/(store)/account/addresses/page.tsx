import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { deleteAddressAction, createAddressAction } from "@/actions/addresses";
import { prisma } from "@/lib/prisma";

export default async function AccountAddressesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-medium font-serif tracking-tight text-[#1A1A1A]">Meus endereços</h1>
        <p className="mt-2 text-sm text-[#666666]">Cadastre e remova endereços para agilizar futuras compras.</p>

        {addresses.length ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {addresses.map((address) => (
              <div key={address.id} className="rounded-2xl border border-zinc-100 bg-[#FFFFFF] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-[#666666]">{address.label || "Endereço salvo"}</p>
                    <h2 className="mt-1 text-lg font-medium font-serif text-[#1A1A1A]">{address.recipient}</h2>
                  </div>
                  <form action={deleteAddressAction}>
                    <input type="hidden" name="id" value={address.id} />
                    <button type="submit" className="text-sm font-medium font-serif text-rose-600 hover:text-rose-700">
                      Remover
                    </button>
                  </form>
                </div>

                <div className="mt-4 space-y-1 text-sm text-[#666666]">
                  <p>{address.street}, {address.number}</p>
                  <p>{address.district} • {address.city}/{address.state}</p>
                  <p>CEP {address.zipcode}</p>
                  {address.complement ? <p>{address.complement}</p> : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-[#FFFFFF] p-8 text-center text-[#666666]">
            Você ainda não possui endereços cadastrados.
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-medium font-serif text-[#1A1A1A]">Adicionar novo endereço</h2>

        <form action={createAddressAction} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="label" placeholder="Apelido (ex.: Casa, Trabalho)" className="h-11 rounded-xl border border-zinc-200 px-4 text-sm outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]" />
          <input name="recipient" required placeholder="Destinatário" className="h-11 rounded-xl border border-zinc-200 px-4 text-sm outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]" />
          <input name="zipcode" required placeholder="CEP" className="h-11 rounded-xl border border-zinc-200 px-4 text-sm outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]" />
          <input name="street" required placeholder="Rua" className="h-11 rounded-xl border border-zinc-200 px-4 text-sm outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]" />
          <input name="number" required placeholder="Número" className="h-11 rounded-xl border border-zinc-200 px-4 text-sm outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]" />
          <input name="district" required placeholder="Bairro" className="h-11 rounded-xl border border-zinc-200 px-4 text-sm outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]" />
          <input name="city" required placeholder="Cidade" className="h-11 rounded-xl border border-zinc-200 px-4 text-sm outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]" />
          <input name="state" required placeholder="UF" maxLength={2} className="h-11 rounded-xl border border-zinc-200 px-4 text-sm uppercase outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]" />
          <input name="complement" placeholder="Complemento (opcional)" className="h-11 rounded-xl border border-zinc-200 px-4 text-sm outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] md:col-span-2" />

          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="inline-flex h-11 items-center justify-center rounded-xl bg-[#111111] px-5 text-sm font-medium font-serif text-white hover:bg-[#111111]/90">
              Salvar endereço
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}