import Link from "next/link";

type BannerFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref: string;
  submitLabel: string;
  initialValues?: {
    title?: string;
    subtitle?: string | null;
    imageUrl?: string;
    mobileUrl?: string | null;
    href?: string | null;
    placement?: "hero" | "secondary" | "sidebar";
    isActive?: boolean;
    position?: number;
    startsAt?: Date | string | null;
    endsAt?: Date | string | null;
  };
};

function formatDateTimeLocal(value?: Date | string | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function BannerForm({ action, cancelHref, submitLabel, initialValues }: BannerFormProps) {
  return (
    <form action={action} className="space-y-6 p-8">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium text-gray-700">Título *</label>
          <input id="title" name="title" required defaultValue={initialValues?.title} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div className="space-y-2">
          <label htmlFor="placement" className="text-sm font-medium text-gray-700">Posição *</label>
          <select id="placement" name="placement" defaultValue={initialValues?.placement ?? "hero"} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="hero">Hero principal</option>
            <option value="secondary">Banner secundário</option>
            <option value="sidebar">Sidebar / apoio</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="subtitle" className="text-sm font-medium text-gray-700">Subtítulo</label>
        <input id="subtitle" name="subtitle" defaultValue={initialValues?.subtitle ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="imageUrl" className="text-sm font-medium text-gray-700">Imagem desktop *</label>
          <input id="imageUrl" name="imageUrl" required defaultValue={initialValues?.imageUrl} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="https://..." />
          {initialValues?.imageUrl ? (
            <div
              aria-label="Preview desktop"
              className="h-32 w-full rounded-lg border border-gray-200 bg-cover bg-center"
              style={{ backgroundImage: `url(${initialValues.imageUrl})` }}
            />
          ) : null}
        </div>
        <div className="space-y-2">
          <label htmlFor="mobileUrl" className="text-sm font-medium text-gray-700">Imagem mobile</label>
          <input id="mobileUrl" name="mobileUrl" defaultValue={initialValues?.mobileUrl ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="https://..." />
          {initialValues?.mobileUrl ? (
            <div
              aria-label="Preview mobile"
              className="h-32 w-40 rounded-lg border border-gray-200 bg-cover bg-center"
              style={{ backgroundImage: `url(${initialValues.mobileUrl})` }}
            />
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="href" className="text-sm font-medium text-gray-700">Link de destino</label>
          <input id="href" name="href" defaultValue={initialValues?.href ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="https://... ou /categoria" />
        </div>
        <div className="space-y-2">
          <label htmlFor="position" className="text-sm font-medium text-gray-700">Ordem</label>
          <input id="position" name="position" type="number" min="0" defaultValue={initialValues?.position ?? 0} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="startsAt" className="text-sm font-medium text-gray-700">Início da exibição</label>
          <input id="startsAt" name="startsAt" type="datetime-local" defaultValue={formatDateTimeLocal(initialValues?.startsAt)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div className="space-y-2">
          <label htmlFor="endsAt" className="text-sm font-medium text-gray-700">Fim da exibição</label>
          <input id="endsAt" name="endsAt" type="datetime-local" defaultValue={formatDateTimeLocal(initialValues?.endsAt)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Use a programação para campanhas temporárias. Sem datas, o banner fica elegível sempre que estiver ativo.
      </div>

      <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
        <input type="checkbox" name="isActive" defaultChecked={initialValues?.isActive ?? true} className="h-4 w-4 rounded border-gray-300" />
        Banner ativo na loja
      </label>

      <div className="flex justify-end gap-4 border-t border-gray-100 pt-4">
        <Link href={cancelHref} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Cancelar
        </Link>
        <button type="submit" className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}