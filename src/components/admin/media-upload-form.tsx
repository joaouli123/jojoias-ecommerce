"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { UploadCloud } from "lucide-react";

type UploadedAsset = {
  id: string;
  url: string;
  alt: string | null;
  originalName: string;
};

export function MediaUploadForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [uploadedAssets, setUploadedAssets] = useState<UploadedAsset[]>([]);
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

          const payload = (await response.json().catch(() => ({}))) as { message?: string; error?: string; assets?: UploadedAsset[] };
          setMessage(payload.message || payload.error || null);

          if (response.ok) {
            setUploadedAssets(payload.assets ?? []);
            event.currentTarget.reset();
          }
        });
      }}
    >
      <div>
        <h2 className="text-base font-semibold text-gray-900">Upload nativo de mídia</h2>
        <p className="mt-1 text-sm text-gray-600">Envie imagens da galeria, banners e catálogo direto para a plataforma.</p>
      </div>
      <input name="alt" placeholder="Texto alternativo opcional" className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
      <input name="files" type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml" multiple className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-700" />
      <button type="submit" disabled={isPending} className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70">
        <UploadCloud className="h-4 w-4" />
        Enviar arquivos
      </button>
      {message ? <p className="text-sm text-gray-600">{message}</p> : null}
      {uploadedAssets.length ? (
        <div className="grid gap-3 md:grid-cols-3">
          {uploadedAssets.map((asset) => (
            <div key={asset.id} className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                <Image src={asset.url} alt={asset.alt || asset.originalName} fill sizes="200px" className="object-cover" />
              </div>
              <p className="mt-2 line-clamp-1 text-xs font-medium text-gray-700">{asset.originalName}</p>
              <input readOnly value={asset.url} className="mt-2 h-10 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 text-xs text-gray-700" />
            </div>
          ))}
        </div>
      ) : null}
    </form>
  );
}
