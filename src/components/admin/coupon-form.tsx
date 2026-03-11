import Link from "next/link";

type CouponFormValues = {
  code?: string;
  name?: string;
  description?: string | null;
  type?: "PERCENTAGE" | "FIXED";
  value?: number;
  minSubtotal?: number | null;
  maxDiscount?: number | null;
  startsAt?: string;
  expiresAt?: string;
  isActive?: boolean;
  usageLimit?: number | null;
  appliesToBrandSlugs?: string | null;
  appliesToCategorySlugs?: string | null;
  firstOrderOnly?: boolean;
  allowWithPixDiscount?: boolean;
};

type CouponFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref: string;
  submitLabel: string;
  initialValues?: CouponFormValues;
};

function datetimeLocalValue(value?: string) {
  return value ?? "";
}

export function CouponForm({ action, cancelHref, submitLabel, initialValues }: CouponFormProps) {
  return (
    <form action={action} className="space-y-6 p-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="code" className="text-sm font-medium text-gray-700">Código *</label>
          <input id="code" name="code" required defaultValue={initialValues?.code} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="PRIM10" />
        </div>
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-gray-700">Nome interno *</label>
          <input id="name" name="name" required defaultValue={initialValues?.name} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Primeira compra" />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium text-gray-700">Descrição</label>
        <textarea id="description" name="description" rows={3} defaultValue={initialValues?.description ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Mensagem exibida ao validar o cupom." />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <label htmlFor="type" className="text-sm font-medium text-gray-700">Tipo *</label>
          <select id="type" name="type" defaultValue={initialValues?.type ?? "PERCENTAGE"} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="PERCENTAGE">Percentual (%)</option>
            <option value="FIXED">Valor fixo (R$)</option>
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="value" className="text-sm font-medium text-gray-700">Valor *</label>
          <input id="value" name="value" type="number" step="0.01" min="0.01" required defaultValue={initialValues?.value ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="10" />
        </div>
        <div className="space-y-2">
          <label htmlFor="usageLimit" className="text-sm font-medium text-gray-700">Limite de uso</label>
          <input id="usageLimit" name="usageLimit" type="number" min="1" step="1" defaultValue={initialValues?.usageLimit ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Opcional" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="minSubtotal" className="text-sm font-medium text-gray-700">Subtotal mínimo</label>
          <input id="minSubtotal" name="minSubtotal" type="number" step="0.01" min="0" defaultValue={initialValues?.minSubtotal ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Opcional" />
        </div>
        <div className="space-y-2">
          <label htmlFor="maxDiscount" className="text-sm font-medium text-gray-700">Desconto máximo</label>
          <input id="maxDiscount" name="maxDiscount" type="number" step="0.01" min="0" defaultValue={initialValues?.maxDiscount ?? ""} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Opcional" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="appliesToBrandSlugs" className="text-sm font-medium text-gray-700">Marcas permitidas</label>
          <textarea
            id="appliesToBrandSlugs"
            name="appliesToBrandSlugs"
            rows={3}
            defaultValue={initialValues?.appliesToBrandSlugs ?? ""}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Ex.: propria,atelier-luxe"
          />
          <p className="text-xs text-gray-500">Opcional. Informe slugs separados por vírgula, ponto e vírgula ou quebra de linha.</p>
        </div>
        <div className="space-y-2">
          <label htmlFor="appliesToCategorySlugs" className="text-sm font-medium text-gray-700">Categorias permitidas</label>
          <textarea
            id="appliesToCategorySlugs"
            name="appliesToCategorySlugs"
            rows={3}
            defaultValue={initialValues?.appliesToCategorySlugs ?? ""}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Ex.: aneis,brincos"
          />
          <p className="text-xs text-gray-500">Deixe em branco para aceitar qualquer categoria.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="startsAt" className="text-sm font-medium text-gray-700">Início</label>
          <input id="startsAt" name="startsAt" type="datetime-local" defaultValue={datetimeLocalValue(initialValues?.startsAt)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div className="space-y-2">
          <label htmlFor="expiresAt" className="text-sm font-medium text-gray-700">Expiração</label>
          <input id="expiresAt" name="expiresAt" type="datetime-local" defaultValue={datetimeLocalValue(initialValues?.expiresAt)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
        <input type="checkbox" name="isActive" defaultChecked={initialValues?.isActive ?? true} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
        Cupom ativo para uso no checkout
      </label>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
          <input type="checkbox" name="firstOrderOnly" defaultChecked={initialValues?.firstOrderOnly ?? false} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
          Restringir para primeira compra
        </label>
        <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
          <input type="checkbox" name="allowWithPixDiscount" defaultChecked={initialValues?.allowWithPixDiscount ?? true} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
          Permitir acumular com desconto Pix
        </label>
      </div>

      <div className="flex justify-end gap-4 border-t border-gray-100 pt-4">
        <Link href={cancelHref} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
          Cancelar
        </Link>
        <button type="submit" className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}