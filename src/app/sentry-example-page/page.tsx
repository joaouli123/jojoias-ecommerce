"use client";

export default function SentryExamplePage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col justify-center px-6 py-16">
      <div className="rounded-[24px] border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">Sentry</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-950">Página de verificação do monitoramento</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-600">
          Clique no botão abaixo para disparar um erro de teste no cliente e confirmar que o Sentry está recebendo eventos corretamente.
        </p>
        <button
          type="button"
          onClick={() => {
            throw new Error("Sentry Test Error");
          }}
          className="mt-8 inline-flex w-fit items-center justify-center rounded-[20px] bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          Disparar erro de teste
        </button>
      </div>
    </div>
  );
}