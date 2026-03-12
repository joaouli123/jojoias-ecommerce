import { Save } from "lucide-react";
import { saveStoreSettings } from "@/actions/settings";
import { getStoreSettings } from "@/lib/store-settings";
import { requireAdminPagePermission } from "@/lib/admin-auth";

export default async function AdminSettingsPage() {
  await requireAdminPagePermission("settings:manage");

  const settings = await getStoreSettings();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-medium font-serif tracking-tight text-gray-900">Configurações da loja</h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-600">
          Ajuste dados institucionais, contato e o conteúdo das páginas fixas exibidas no storefront.
        </p>
      </div>

      <form action={saveStoreSettings} className="space-y-8">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Marca e atendimento</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>Nome da loja</span>
              <input name="storeName" defaultValue={settings.storeName} className="h-11 w-full rounded-lg border border-gray-300 px-3 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
            </label>
            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>Tagline</span>
              <input name="tagline" defaultValue={settings.tagline} className="h-11 w-full rounded-lg border border-gray-300 px-3 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
            </label>
            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>E-mail de suporte</span>
              <input name="supportEmail" type="email" defaultValue={settings.supportEmail} className="h-11 w-full rounded-lg border border-gray-300 px-3 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
            </label>
            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>Telefone</span>
              <input name="supportPhone" defaultValue={settings.supportPhone} className="h-11 w-full rounded-lg border border-gray-300 px-3 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
            </label>
            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>WhatsApp</span>
              <input name="whatsappPhone" defaultValue={settings.whatsappPhone} className="h-11 w-full rounded-lg border border-gray-300 px-3 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
            </label>
            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>Link do WhatsApp</span>
              <input name="whatsappUrl" defaultValue={settings.whatsappUrl} className="h-11 w-full rounded-lg border border-gray-300 px-3 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
            </label>
            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>Endereço resumido</span>
              <input name="addressLine" defaultValue={settings.addressLine} className="h-11 w-full rounded-lg border border-gray-300 px-3 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
            </label>
            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>Cidade / estado</span>
              <input name="cityState" defaultValue={settings.cityState} className="h-11 w-full rounded-lg border border-gray-300 px-3 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
            </label>
            <label className="space-y-2 text-sm font-medium text-gray-700 md:col-span-2">
              <span>Horário de atendimento</span>
              <input name="businessHours" defaultValue={settings.businessHours} className="h-11 w-full rounded-lg border border-gray-300 px-3 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Barra de anúncio e captação</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 md:col-span-2">
              <input name="brandShowcaseEnabled" type="checkbox" defaultChecked={settings.brandShowcaseEnabled} className="h-4 w-4 rounded border-gray-300" />
              Exibir seção “Vitrines por marca” na home
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 md:col-span-2">
              <input name="announcementEnabled" type="checkbox" defaultChecked={settings.announcementEnabled} className="h-4 w-4 rounded border-gray-300" />
              Exibir barra superior de anúncio no storefront
            </label>
            <label className="space-y-2 text-sm font-medium text-gray-700 md:col-span-2">
              <span>Mensagem principal</span>
              <input name="announcementText" defaultValue={settings.announcementText} className="h-11 w-full rounded-lg border border-gray-300 px-3 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
            </label>
            <label className="space-y-2 text-sm font-medium text-gray-700 md:col-span-2">
              <span>Mensagem secundária</span>
              <input name="announcementSecondaryText" defaultValue={settings.announcementSecondaryText} className="h-11 w-full rounded-lg border border-gray-300 px-3 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
            </label>
            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>Texto do link</span>
              <input name="announcementLinkLabel" defaultValue={settings.announcementLinkLabel} className="h-11 w-full rounded-lg border border-gray-300 px-3 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
            </label>
            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>Destino do link</span>
              <input name="announcementLinkHref" defaultValue={settings.announcementLinkHref} className="h-11 w-full rounded-lg border border-gray-300 px-3 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Redes sociais</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>Instagram</span>
              <input name="instagramUrl" defaultValue={settings.instagramUrl} className="h-11 w-full rounded-lg border border-gray-300 px-3 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
            </label>
            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>Facebook</span>
              <input name="facebookUrl" defaultValue={settings.facebookUrl} className="h-11 w-full rounded-lg border border-gray-300 px-3 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
            </label>
            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>YouTube</span>
              <input name="youtubeUrl" defaultValue={settings.youtubeUrl} className="h-11 w-full rounded-lg border border-gray-300 px-3 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Conteúdo institucional</h2>
          <div className="mt-5 grid gap-4">
            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>Título do Quem Somos</span>
              <input name="aboutTitle" defaultValue={settings.aboutTitle} className="h-11 w-full rounded-lg border border-gray-300 px-3 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
            </label>
            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>Descrição curta</span>
              <textarea name="aboutDescription" rows={3} defaultValue={settings.aboutDescription} className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
            </label>
            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>Texto completo da marca</span>
              <textarea name="aboutContent" rows={6} defaultValue={settings.aboutContent} className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
            </label>
            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>Entregas</span>
              <textarea name="shippingContent" rows={5} defaultValue={settings.shippingContent} className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
            </label>
            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>Trocas e devoluções</span>
              <textarea name="exchangesContent" rows={5} defaultValue={settings.exchangesContent} className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
            </label>
            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>Privacidade</span>
              <textarea name="privacyContent" rows={5} defaultValue={settings.privacyContent} className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
            </label>
            <label className="space-y-2 text-sm font-medium text-gray-700">
              <span>Termos de uso</span>
              <textarea name="termsContent" rows={5} defaultValue={settings.termsContent} className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
            </label>
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800">
            <Save className="h-4 w-4" />
            Salvar configurações
          </button>
        </div>
      </form>
    </div>
  );
}
