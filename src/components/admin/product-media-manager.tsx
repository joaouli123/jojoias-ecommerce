"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Check, ChevronLeft, ChevronRight, ImagePlus, LoaderCircle, Star, Trash2, UploadCloud } from "lucide-react";

type MediaAsset = {
  id: string;
  url: string;
  alt: string | null;
  originalName: string;
  width?: number | null;
  height?: number | null;
};

type ProductMediaManagerProps = {
  mainImage: string;
  galleryImages: string[];
  onMainImageChange: (value: string) => void;
  onGalleryImagesChange: (value: string[]) => void;
};

function uniqueUrls(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

export function ProductMediaManager(props: ProductMediaManagerProps) {
  const { mainImage, galleryImages, onMainImageChange, onGalleryImagesChange } = props;
  const [recentAssets, setRecentAssets] = useState<MediaAsset[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const uploadMainRef = useRef<HTMLInputElement | null>(null);
  const uploadGalleryRef = useRef<HTMLInputElement | null>(null);

  const previewItems = useMemo(() => {
    const urls = uniqueUrls([mainImage, ...galleryImages]);
    return urls.map((url) => ({
      url,
      isMain: url === mainImage,
    }));
  }, [galleryImages, mainImage]);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/upload", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          return { assets: [] as MediaAsset[] };
        }

        return response.json() as Promise<{ assets?: MediaAsset[] }>;
      })
      .then((payload) => {
        if (cancelled) return;
        setRecentAssets(payload.assets ?? []);
      })
      .catch(() => {
        if (!cancelled) {
          setRecentAssets([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function syncNewAssets(assets: MediaAsset[], mode: "main" | "gallery") {
    setRecentAssets((current) => {
      const next = [...assets, ...current];
      const map = new Map<string, MediaAsset>();
      for (const asset of next) {
        map.set(asset.id, asset);
      }
      return Array.from(map.values());
    });

    if (mode === "main" && assets[0]) {
      onMainImageChange(assets[0].url);
      return;
    }

    if (assets.length) {
      onGalleryImagesChange(uniqueUrls([...galleryImages, ...assets.map((asset) => asset.url)]));
      if (!mainImage) {
        onMainImageChange(assets[0].url);
      }
    }
  }

  function handleUpload(files: FileList | null, mode: "main" | "gallery") {
    if (!files?.length) {
      return;
    }

    setMessage(null);
    const formData = new FormData();

    for (const file of Array.from(files)) {
      formData.append("files", file);
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const payload = (await response.json().catch(() => ({}))) as {
          assets?: MediaAsset[];
          message?: string;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || "Não foi possível enviar as imagens.");
        }

        const assets = payload.assets ?? [];
        syncNewAssets(assets, mode);
        setMessage(payload.message || `${assets.length} imagem(ns) enviada(s) com sucesso.`);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Falha ao enviar imagens.");
      } finally {
        if (uploadMainRef.current) uploadMainRef.current.value = "";
        if (uploadGalleryRef.current) uploadGalleryRef.current.value = "";
      }
    });
  }

  function addToGallery(url: string) {
    onGalleryImagesChange(uniqueUrls([...galleryImages, url]));
    if (!mainImage) {
      onMainImageChange(url);
    }
  }

  function removeFromGallery(url: string) {
    onGalleryImagesChange(galleryImages.filter((item) => item !== url));
    if (mainImage === url) {
      const nextMain = galleryImages.find((item) => item !== url) || "";
      onMainImageChange(nextMain);
    }
  }

  function moveGalleryImage(url: string, direction: -1 | 1) {
    const currentIndex = galleryImages.findIndex((item) => item === url);
    if (currentIndex === -1) return;

    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= galleryImages.length) return;

    const next = [...galleryImages];
    [next[currentIndex], next[nextIndex]] = [next[nextIndex], next[currentIndex]];
    onGalleryImagesChange(next);
  }

  return (
    <div className="space-y-5 rounded-2xl border border-gray-200 bg-gray-50 p-5 md:col-span-2">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Imagens do produto</h3>
          <p className="text-xs text-gray-500">Envie imagens direto aqui, escolha a capa do produto e monte a ordem da galeria sem depender de colar URLs.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => uploadMainRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            <Star className="h-4 w-4" /> Enviar capa
          </button>
          <button
            type="button"
            onClick={() => uploadGalleryRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            <UploadCloud className="h-4 w-4" /> Enviar galeria
          </button>
          <button
            type="button"
            onClick={() => setLibraryOpen((current) => !current)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            <ImagePlus className="h-4 w-4" /> {libraryOpen ? "Ocultar biblioteca" : "Biblioteca recente"}
          </button>
        </div>
      </div>

      <input
        ref={uploadMainRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
        className="hidden"
        onChange={(event) => handleUpload(event.target.files, "main")}
      />
      <input
        ref={uploadGalleryRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
        className="hidden"
        multiple
        onChange={(event) => handleUpload(event.target.files, "gallery")}
      />

      <input type="hidden" name="image" value={mainImage} />
      <textarea readOnly hidden name="galleryImages" value={galleryImages.join("\n")} />

      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Imagem principal</p>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100">
            {mainImage ? (
              <Image src={mainImage} alt="Prévia da imagem principal do produto" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">Nenhuma imagem principal definida.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Galeria e ordem</p>
          {previewItems.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {previewItems.map((item) => {
                const galleryIndex = galleryImages.indexOf(item.url);
                const isInGallery = galleryIndex >= 0;

                return (
                  <div key={item.url} className="space-y-2 rounded-xl border border-gray-200 p-2">
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                      <Image src={item.url} alt="Prévia da galeria do produto" fill sizes="180px" className="object-cover" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.isMain ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700">
                          <Check className="h-3 w-3" /> Capa
                        </span>
                      ) : (
                        <button type="button" onClick={() => onMainImageChange(item.url)} className="rounded-full border border-gray-300 px-2 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-50">
                          Definir capa
                        </button>
                      )}
                      {!isInGallery ? (
                        <button type="button" onClick={() => addToGallery(item.url)} className="rounded-full border border-gray-300 px-2 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-50">
                          Adicionar galeria
                        </button>
                      ) : null}
                    </div>
                    {isInGallery ? (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => moveGalleryImage(item.url, -1)} disabled={galleryIndex === 0} className="rounded-lg border border-gray-300 p-1 text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => moveGalleryImage(item.url, 1)} disabled={galleryIndex === galleryImages.length - 1} className="rounded-lg border border-gray-300 p-1 text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                        <button type="button" onClick={() => removeFromGallery(item.url)} className="rounded-lg border border-rose-200 p-1 text-rose-600 hover:bg-rose-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              Nenhuma imagem enviada ainda. Use os botões acima para montar a galeria do produto.
            </div>
          )}
        </div>
      </div>

      {libraryOpen ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Biblioteca recente</p>
              <p className="text-xs text-gray-500">Selecione imagens já enviadas para reutilizar no produto.</p>
            </div>
            {isPending ? <LoaderCircle className="h-4 w-4 animate-spin text-gray-500" /> : null}
          </div>
          {recentAssets.length ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
              {recentAssets.map((asset) => {
                const used = previewItems.some((item) => item.url === asset.url);

                return (
                  <div key={asset.id} className="rounded-xl border border-gray-200 p-2">
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                      <Image src={asset.url} alt={asset.alt || asset.originalName} fill sizes="160px" className="object-cover" />
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs font-medium text-gray-700">{asset.alt || asset.originalName}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button type="button" onClick={() => onMainImageChange(asset.url)} className="rounded-full border border-gray-300 px-2 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-50">
                        Capa
                      </button>
                      <button type="button" onClick={() => addToGallery(asset.url)} disabled={used} className="rounded-full border border-gray-300 px-2 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                        {used ? "Já usada" : "Galeria"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              Nenhum upload recente encontrado.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
