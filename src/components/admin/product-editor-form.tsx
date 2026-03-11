"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Sparkles, Plus, Trash2, UploadCloud } from "lucide-react";
import { ProductMediaManager } from "@/components/admin/product-media-manager";

type CategoryOption = {
  id: string;
  name: string;
};

type BrandOption = {
  id: string;
  name: string;
};

type ProductFormVariant = {
  name: string;
  price: number;
  quantity: number;
  sku?: string | null;
  image?: string | null;
  isActive?: boolean;
};

type VariantDraft = {
  id: string;
  type: string;
  label: string;
  price: string;
  quantity: number;
  sku: string;
  image: string;
  isActive: boolean;
};

type ProductInitialValues = {
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
  galleryImages?: string[];
  price?: number;
  comparePrice?: number | null;
  sku?: string;
  quantity?: number;
  categoryId?: string;
  brandId?: string;
  status?: string;
  variants?: ProductFormVariant[];
};

type ProductEditorFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  categories: CategoryOption[];
  brands: BrandOption[];
  backHref: string;
  submitLabel: string;
  initialValues?: ProductInitialValues;
};

const variantTypeOptions = [
  { value: "cor", label: "Cor", presets: ["Dourado", "Prata", "Rosé", "Preto", "Cristal"] },
  { value: "tamanho", label: "Tamanho", presets: ["P", "M", "G", "18 cm", "20 cm", "22 cm"] },
  { value: "kit", label: "Kit", presets: ["Unidade", "Kit 2 peças", "Kit 3 peças", "Kit presente"] },
  { value: "modelo", label: "Modelo", presets: ["Clássico", "Premium", "Delicado", "Elegance"] },
  { value: "personalizada", label: "Variação única", presets: [] },
] as const;

function makeDraftId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function generateSlug(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function formatCurrencyInput(value: string | number | null | undefined) {
  const raw = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(/\./g, "").replace(/,/g, ".").replace(/[^0-9.-]/g, "")) : Number.NaN;
  if (!Number.isFinite(raw)) return "";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(raw);
}

function parseCurrencyFromInput(value: string) {
  const cleaned = value.replace(/\s/g, "").replace(/R\$/gi, "").replace(/\./g, "").replace(/,/g, ".");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function inferVariantType(name: string) {
  const normalized = name.trim();
  const match = normalized.match(/^([^:]+):\s*(.+)$/);
  if (!match) {
    return { type: "personalizada", label: normalized };
  }

  const [, rawType, rawValue] = match;
  const normalizedType = rawType.toLowerCase();
  const mapped = variantTypeOptions.find((option) => option.value === normalizedType || option.label.toLowerCase() === normalizedType);

  return {
    type: mapped?.value ?? "personalizada",
    label: rawValue.trim(),
  };
}

function buildVariantName(type: string, label: string) {
  const normalizedLabel = label.trim();
  if (!normalizedLabel) return "";

  if (type === "personalizada") {
    return normalizedLabel;
  }

  const option = variantTypeOptions.find((entry) => entry.value === type);
  return option ? `${option.label}: ${normalizedLabel}` : normalizedLabel;
}

function createVariantDraft(partial?: Partial<VariantDraft>): VariantDraft {
  return {
    id: makeDraftId(),
    type: partial?.type ?? "cor",
    label: partial?.label ?? "",
    price: partial?.price ?? "",
    quantity: partial?.quantity ?? 0,
    sku: partial?.sku ?? "",
    image: partial?.image ?? "",
    isActive: partial?.isActive ?? true,
  };
}

export function ProductEditorForm(props: ProductEditorFormProps) {
  const { action, categories, brands, backHref, submitLabel, initialValues } = props;
  const [name, setName] = useState(initialValues?.name ?? "");
  const [slug, setSlug] = useState(initialValues?.slug ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [mainImage, setMainImage] = useState(initialValues?.image ?? "");
  const [galleryImages, setGalleryImages] = useState<string[]>(initialValues?.galleryImages ?? []);
  const [price, setPrice] = useState(formatCurrencyInput(initialValues?.price));
  const [comparePrice, setComparePrice] = useState(formatCurrencyInput(initialValues?.comparePrice ?? ""));
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [mediaMessage, setMediaMessage] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(Boolean(initialValues?.slug));
  const [quickVariantType, setQuickVariantType] = useState<string>("cor");
  const [customVariantLabel, setCustomVariantLabel] = useState("");
  const [variants, setVariants] = useState<VariantDraft[]>(() => {
    if (!initialValues?.variants?.length) return [];

    return initialValues.variants.map((variant) => {
      const inferred = inferVariantType(variant.name);
      return createVariantDraft({
        type: inferred.type,
        label: inferred.label,
        price: formatCurrencyInput(variant.price),
        quantity: variant.quantity,
        sku: variant.sku ?? "",
        image: variant.image ?? "",
        isActive: variant.isActive ?? true,
      });
    });
  });

  useEffect(() => {
    if (slugTouched) return;
    setSlug(generateSlug(name));
  }, [name, slugTouched]);

  const quickPresets = useMemo(() => {
    return variantTypeOptions.find((option) => option.value === quickVariantType)?.presets ?? [];
  }, [quickVariantType]);

  const variantsJson = JSON.stringify(
    variants
      .filter((variant) => variant.label.trim())
      .map((variant) => ({
        name: buildVariantName(variant.type, variant.label),
        price: parseCurrencyFromInput(variant.price),
        quantity: variant.quantity,
        sku: variant.sku.trim() || undefined,
        image: variant.image.trim() || "",
        isActive: variant.isActive,
      })),
  );

  async function uploadVariantImage(variantId: string, files: FileList | null) {
    if (!files?.length) {
      return;
    }

    setMediaMessage(null);
    const formData = new FormData();
    formData.append("files", files[0]);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => ({}))) as {
        assets?: Array<{ url: string }>;
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Falha ao enviar imagem da variação.");
      }

      const nextUrl = payload.assets?.[0]?.url;
      if (!nextUrl) {
        throw new Error("O upload não retornou uma URL válida.");
      }

      setVariants((current) => current.map((entry) => entry.id === variantId ? { ...entry, image: nextUrl } : entry));
      setMediaMessage(payload.message || "Imagem da variação enviada com sucesso.");
    } catch (error) {
      setMediaMessage(error instanceof Error ? error.message : "Falha ao enviar imagem da variação.");
    }
  }

  async function improveWithAi() {
    setAiError(null);
    setAiLoading(true);

    try {
      const response = await fetch("/api/admin/products/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      const payload = (await response.json()) as { error?: string; title?: string; slug?: string; description?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Não foi possível gerar o conteúdo com IA.");
      }

      if (payload.title) {
        setName(payload.title);
      }
      if (payload.slug) {
        setSlug(payload.slug);
        setSlugTouched(true);
      }
      if (payload.description) {
        setDescription(payload.description);
      }
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Não foi possível gerar o conteúdo com IA.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <form action={action} className="p-8 space-y-6">
      <input type="hidden" name="variantsJson" value={variantsJson} />

      <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Assistente de IA</p>
            <p className="text-xs text-gray-500">Melhora nome, slug e descrição com base no que você já preencheu.</p>
          </div>
          <button
            type="button"
            onClick={() => void improveWithAi()}
            disabled={aiLoading || !name.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" /> {aiLoading ? "Gerando..." : "Melhorar com IA"}
          </button>
        </div>
        {aiError ? <p className="mt-3 text-sm font-medium text-rose-600">{aiError}</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-gray-700">Nome do Produto *</label>
          <input value={name} onChange={(event) => setName(event.target.value)} type="text" id="name" name="name" required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Ex: Kit Colar + Pulseira Elegance" />
        </div>

        <div className="space-y-2">
          <label htmlFor="slug" className="text-sm font-medium text-gray-700">Slug URL *</label>
          <input value={slug} onChange={(event) => { setSlug(event.target.value); setSlugTouched(true); }} type="text" id="slug" name="slug" required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="kit-colar-pulseira-elegance" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="description" className="text-sm font-medium text-gray-700">Descrição</label>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} id="description" name="description" rows={4} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>

        <ProductMediaManager
          mainImage={mainImage}
          galleryImages={galleryImages}
          onMainImageChange={setMainImage}
          onGalleryImagesChange={setGalleryImages}
        />

        <div className="space-y-2">
          <label htmlFor="price" className="text-sm font-medium text-gray-700">Preço (R$) *</label>
          <input value={price} onChange={(event) => setPrice(event.target.value)} onBlur={() => setPrice(formatCurrencyInput(parseCurrencyFromInput(price)))} type="text" id="price" name="price" required inputMode="decimal" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="R$ 289,90" />
        </div>

        <div className="space-y-2">
          <label htmlFor="comparePrice" className="text-sm font-medium text-gray-700">Preço Comparação (R$)</label>
          <input value={comparePrice} onChange={(event) => setComparePrice(event.target.value)} onBlur={() => setComparePrice(comparePrice ? formatCurrencyInput(parseCurrencyFromInput(comparePrice)) : "")} type="text" id="comparePrice" name="comparePrice" inputMode="decimal" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="R$ 389,90" />
        </div>

        <div className="space-y-2">
          <label htmlFor="sku" className="text-sm font-medium text-gray-700">Código SKU</label>
          <input defaultValue={initialValues?.sku ?? ""} type="text" id="sku" name="sku" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="KIT-COLAR-001" />
        </div>

        <div className="space-y-2">
          <label htmlFor="quantity" className="text-sm font-medium text-gray-700">Qtd. Estoque *</label>
          <input defaultValue={initialValues?.quantity ?? 0} type="number" id="quantity" name="quantity" required min="0" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>

        <div className="space-y-2">
          <label htmlFor="categoryId" className="text-sm font-medium text-gray-700">Categoria *</label>
          <select id="categoryId" name="categoryId" defaultValue={initialValues?.categoryId ?? ""} required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
            <option value="" disabled hidden>Selecione uma categoria</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="brandId" className="text-sm font-medium text-gray-700">Marca</label>
          <select id="brandId" name="brandId" defaultValue={initialValues?.brandId ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
            <option value="">Sem marca</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>{brand.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium text-gray-700">Status *</label>
          <select id="status" name="status" defaultValue={initialValues?.status ?? "ACTIVE"} required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
            <option value="ACTIVE">Ativo (Público)</option>
            <option value="DRAFT">Rascunho</option>
            <option value="ARCHIVED">Arquivado</option>
          </select>
        </div>

        <div className="space-y-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Variações estruturadas</label>
              <p className="text-xs text-gray-500">Trabalhe com cor, tamanho, kit, modelo ou uma variação única totalmente personalizada.</p>
            </div>
            <button type="button" onClick={() => setVariants((current) => [...current, createVariantDraft()])} className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Plus className="h-4 w-4" /> Nova variação
            </button>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[180px_1fr_auto]">
              <select value={quickVariantType} onChange={(event) => setQuickVariantType(event.target.value)} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                {variantTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <input value={customVariantLabel} onChange={(event) => setCustomVariantLabel(event.target.value)} placeholder="Digite uma variação customizada ou escolha um preset abaixo" className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" />
              <button
                type="button"
                onClick={() => {
                  if (!customVariantLabel.trim()) return;
                  setVariants((current) => [...current, createVariantDraft({ type: quickVariantType, label: customVariantLabel.trim() })]);
                  setCustomVariantLabel("");
                }}
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Adicionar
              </button>
            </div>
            {quickPresets.length ? (
              <div className="flex flex-wrap gap-2">
                {quickPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setVariants((current) => [...current, createVariantDraft({ type: quickVariantType, label: preset })])}
                    className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-100"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            {variants.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-sm text-gray-500">
                Nenhuma variação cadastrada. Você pode salvar sem variação ou começar adicionando cor, tamanho, kit ou uma opção personalizada.
              </div>
            ) : (
              variants.map((variant) => (
                <div key={variant.id} className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tipo</label>
                      <select value={variant.type} onChange={(event) => setVariants((current) => current.map((entry) => entry.id === variant.id ? { ...entry, type: event.target.value } : entry))} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                        {variantTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Nome / valor da variação</label>
                      <input value={variant.label} onChange={(event) => setVariants((current) => current.map((entry) => entry.id === variant.id ? { ...entry, label: event.target.value } : entry))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Ex: Dourado, 18 cm, Kit 3 peças" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Preço</label>
                      <input value={variant.price} onChange={(event) => setVariants((current) => current.map((entry) => entry.id === variant.id ? { ...entry, price: event.target.value } : entry))} onBlur={() => setVariants((current) => current.map((entry) => entry.id === variant.id ? { ...entry, price: entry.price ? formatCurrencyInput(parseCurrencyFromInput(entry.price)) : "" } : entry))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="R$ 149,90" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Estoque</label>
                      <input type="number" min={0} value={variant.quantity} onChange={(event) => setVariants((current) => current.map((entry) => entry.id === variant.id ? { ...entry, quantity: Number(event.target.value) } : entry))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">SKU</label>
                      <input value={variant.sku} onChange={(event) => setVariants((current) => current.map((entry) => entry.id === variant.id ? { ...entry, sku: event.target.value } : entry))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="KIT-COLAR-DOURADO" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</label>
                      <label className="inline-flex h-[42px] w-full items-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700">
                        <input type="checkbox" checked={variant.isActive} onChange={(event) => setVariants((current) => current.map((entry) => entry.id === variant.id ? { ...entry, isActive: event.target.checked } : entry))} />
                        Ativa
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Imagem da variação</label>
                      <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-white">
                          {variant.image ? (
                            <Image src={variant.image} alt={`Prévia da variação ${variant.label || variant.id}`} fill sizes="240px" className="object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-gray-400">Sem imagem nesta variação</div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input value={variant.image} onChange={(event) => setVariants((current) => current.map((entry) => entry.id === variant.id ? { ...entry, image: event.target.value } : entry))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="https://... ou URL da biblioteca" />
                          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                            <UploadCloud className="h-4 w-4" /> Upload
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
                              className="hidden"
                              onChange={(event) => void uploadVariantImage(variant.id, event.target.files)}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                    <button type="button" onClick={() => setVariants((current) => current.filter((entry) => entry.id !== variant.id))} className="inline-flex items-center justify-center gap-2 self-end rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100">
                      <Trash2 className="h-4 w-4" /> Remover
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {mediaMessage ? <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">{mediaMessage}</p> : null}

      <div className="pt-4 border-t border-gray-100 flex justify-end gap-4">
        <Link href={backHref} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
          Cancelar
        </Link>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}