import { ResetPasswordForm } from "@/components/account/reset-password-form";
import { AuthShell } from "@/components/auth/auth-shell";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthShell
      eyebrow="Redefinição"
      title="Nova senha"
      description="Escolha uma nova senha para voltar a acessar sua conta com segurança."
      asideTitle="Última etapa da recuperação"
      asideDescription="Defina uma nova senha e use o mesmo e-mail da conta para entrar novamente. Depois disso, o link antigo deixa de servir."
    >
      {!token ? (
        <div className="rounded-[20px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Link inválido. Solicite uma nova recuperação de senha.
        </div>
      ) : (
        <ResetPasswordForm token={token} />
      )}
    </AuthShell>
  );
}