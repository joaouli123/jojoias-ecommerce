import Link from "next/link";

type BlogPostFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref: string;
  submitLabel: string;
  initialValues?: {
    title?: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    coverImage?: string | null;
    authorName?: string | null;
    tags?: string | null;
    isPublished?: boolean;
    featured?: boolean;
    publishedAt?: string | null;
  };
};

function datetimeLocalValue(value?: string | null) {
  return value ?? "";
}

export function BlogPostForm({ action, cancelHref, submitLabel, initialValues }: BlogPostFormProps) {
  return (
    <form action={action} className="space-y-6 p-8">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium text-gray-700">Título *</label>
          <input id="title" name="title" required defaultValue={initialValues?.title} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div className="space-y-2">
          <label htmlFor="slug" className="text-sm font-medium text-gray-700">Slug *</label>
          <input id="slug" name="slug" required defaultValue={initialValues?.slug} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="excerpt" className="text-sm font-medium text-gray-700">Resumo *</label>
        <textarea id="excerpt" name="excerpt" rows={3} required defaultValue={initialValues?.excerpt} className="w-full rounded-md border border-gray-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="coverImage" className="text-sm font-medium text-gray-700">Imagem de capa</label>
          <input id="coverImage" name="coverImage" defaultValue={initialValues?.coverImage ?? ""} placeholder="https://... ou /uploads/..." className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div className="space-y-2">
          <label htmlFor="authorName" className="text-sm font-medium text-gray-700">Autor</label>
          <input id="authorName" name="authorName" defaultValue={initialValues?.authorName ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="tags" className="text-sm font-medium text-gray-700">Tags</label>
          <input id="tags" name="tags" defaultValue={initialValues?.tags ?? ""} placeholder="seo, presentes, cuidados" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div className="space-y-2">
          <label htmlFor="publishedAt" className="text-sm font-medium text-gray-700">Data de publicação</label>
          <input id="publishedAt" name="publishedAt" type="datetime-local" defaultValue={datetimeLocalValue(initialValues?.publishedAt)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="content" className="text-sm font-medium text-gray-700">Conteúdo *</label>
        <textarea id="content" name="content" rows={18} required defaultValue={initialValues?.content} className="w-full rounded-md border border-gray-300 px-3 py-3 text-sm leading-7 focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
          <input type="checkbox" name="isPublished" defaultChecked={initialValues?.isPublished ?? false} className="h-4 w-4 rounded border-gray-300" />
          Publicar post no blog
        </label>
        <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
          <input type="checkbox" name="featured" defaultChecked={initialValues?.featured ?? false} className="h-4 w-4 rounded border-gray-300" />
          Destacar na listagem principal
        </label>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        A URL pública será /blog/slug. Use o blog para conteúdo SEO, histórias da marca, tendências e guias editoriais.
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