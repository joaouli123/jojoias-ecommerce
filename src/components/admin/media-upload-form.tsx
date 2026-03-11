"use client";

import { useState, useTransition } from "react";
import { UploadCloud } from "lucide-react";

export function MediaUploadForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          const payload = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
          setMessage(payload.message || payload.error || null);

          if (response.ok) {
            event.currentTarget.reset();
            window.location.reload();
          }
        });
      }}
    >
      <div>
        <h2 className="text-base font-semibold text-gray-900">Upload nativo de mídia</h2>
        <p className="mt-1 text-sm text-gray-600">Envie imagens da galeria, banners e catálogo direto para a plataforma.</p>
      </div>
      <input name="alt" placeholder="Texto alternativo opcional" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
      <input name="files" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" multiple className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-700" />
      <button type="submit" disabled={isPending} className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70">
        <UploadCloud className="h-4 w-4" />
        Enviar arquivos
      </button>
      {message ? <p className="text-sm text-gray-600">{message}</p> : null}
    </form>
  );
}
