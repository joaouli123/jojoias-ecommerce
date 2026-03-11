import Link from "next/link";

type PageFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref: string;
  submitLabel: string;
  initialValues?: {
    title?: string;
    slug?: string;
    content?: string;
    metaTitle?: string | null;
    metaDescription?: string | null;
    isPublished?: boolean;
  };
};

export function PageForm({ action, cancelHref, submitLabel, initialValues }: PageFormProps) {
  return (
    <form action={action} className="space-y-6 p-8">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium text-gray-700">Título *</label>
          <input id="title" name="title" required defaultValue={initialValues?.title} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div className="space-y-2">
          <label htmlFor="slug" className="text-sm font-medium text-gray-700">Slug *</label>
          <input id="slug" name="slug" required defaultValue={initialValues?.slug} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="ex: guia-de-cuidados" />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="content" className="text-sm font-medium text-gray-700">Conteúdo *</label>
        <textarea id="content" name="content" rows={14} required defaultValue={initialValues?.content} className="w-full rounded-md border border-gray-300 px-3 py-3 text-sm leading-7 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Escreva o conteúdo da página. Quebras de linha serão preservadas na loja." />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="metaTitle" className="text-sm font-medium text-gray-700">Meta title</label>
          <input id="metaTitle" name="metaTitle" defaultValue={initialValues?.metaTitle ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Até 70 caracteres" />
        </div>
        <div className="space-y-2">
          <label htmlFor="metaDescription" className="text-sm font-medium text-gray-700">Meta description</label>
          <textarea id="metaDescription" name="metaDescription" rows={3} defaultValue={initialValues?.metaDescription ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Até 160 caracteres" />
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
        <input type="checkbox" name="isPublished" defaultChecked={initialValues?.isPublished ?? false} className="h-4 w-4 rounded border-gray-300" />
        Publicar página na loja
      </label>

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        A URL pública será /pages/slug. Use esta área para campanhas, páginas institucionais, guias ou conteúdo SEO.
      </div>

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
