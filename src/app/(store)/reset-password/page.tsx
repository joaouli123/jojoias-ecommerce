import { ResetPasswordForm } from "@/components/account/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <section className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-black tracking-tight text-zinc-950">Nova senha</h1>
        <p className="mt-2 text-sm text-zinc-500">Escolha uma nova senha para sua conta.</p>

        {!token ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Link inválido. Solicite uma nova recuperação de senha.
          </div>
        ) : (
          <ResetPasswordForm token={token} />
        )}
      </section>
    </div>
  );
}