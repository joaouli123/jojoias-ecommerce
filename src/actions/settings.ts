"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { defaultStoreSettings } from "@/lib/store-settings";
import { storeSettingsSchema } from "@/lib/validators";
import { requireAdminPermission } from "@/lib/admin-auth";
import { logAdminAudit } from "@/lib/audit-log";

async function checkAdmin() {
  return requireAdminPermission("settings:manage");
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function saveStoreSettings(formData: FormData) {
  const actor = await checkAdmin();

  const payload = {
    storeName: readString(formData, "storeName") || defaultStoreSettings.storeName,
    tagline: readString(formData, "tagline") || defaultStoreSettings.tagline,
    brandShowcaseEnabled: formData.get("brandShowcaseEnabled") === "on",
    announcementEnabled: formData.get("announcementEnabled") === "on",
    announcementText: readString(formData, "announcementText") || defaultStoreSettings.announcementText,
    announcementSecondaryText: readString(formData, "announcementSecondaryText") || defaultStoreSettings.announcementSecondaryText,
    announcementLinkLabel: readString(formData, "announcementLinkLabel") || defaultStoreSettings.announcementLinkLabel,
    announcementLinkHref: readString(formData, "announcementLinkHref") || defaultStoreSettings.announcementLinkHref,
    supportEmail: readString(formData, "supportEmail") || defaultStoreSettings.supportEmail,
    supportPhone: readString(formData, "supportPhone") || defaultStoreSettings.supportPhone,
    whatsappPhone: readString(formData, "whatsappPhone") || defaultStoreSettings.whatsappPhone,
    whatsappUrl: readString(formData, "whatsappUrl") || defaultStoreSettings.whatsappUrl,
    addressLine: readString(formData, "addressLine") || defaultStoreSettings.addressLine,
    cityState: readString(formData, "cityState") || defaultStoreSettings.cityState,
    businessHours: readString(formData, "businessHours") || defaultStoreSettings.businessHours,
    instagramUrl: readString(formData, "instagramUrl") || defaultStoreSettings.instagramUrl,
    facebookUrl: readString(formData, "facebookUrl") || defaultStoreSettings.facebookUrl,
    youtubeUrl: readString(formData, "youtubeUrl") || defaultStoreSettings.youtubeUrl,
    aboutTitle: readString(formData, "aboutTitle") || defaultStoreSettings.aboutTitle,
    aboutDescription: readString(formData, "aboutDescription") || defaultStoreSettings.aboutDescription,
    aboutContent: readString(formData, "aboutContent") || defaultStoreSettings.aboutContent,
    shippingContent: readString(formData, "shippingContent") || defaultStoreSettings.shippingContent,
    exchangesContent: readString(formData, "exchangesContent") || defaultStoreSettings.exchangesContent,
    privacyContent: readString(formData, "privacyContent") || defaultStoreSettings.privacyContent,
    termsContent: readString(formData, "termsContent") || defaultStoreSettings.termsContent,
  };

  const parsed = storeSettingsSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Configurações inválidas");
  }

  await prisma.integrationSetting.upsert({
    where: { provider: "store_settings" },
    update: {
      name: "Configurações da Loja",
      isEnabled: true,
      environment: "production",
      extraConfig: JSON.stringify(parsed.data),
    },
    create: {
      provider: "store_settings",
      name: "Configurações da Loja",
      isEnabled: true,
      environment: "production",
      extraConfig: JSON.stringify(parsed.data),
    },
  });

  await logAdminAudit({
    actor,
    action: "settings.store.update",
    entityType: "settings",
    entityId: "store_settings",
    summary: "Configurações institucionais da loja atualizadas.",
    metadata: {
      storeName: parsed.data.storeName,
      brandShowcaseEnabled: parsed.data.brandShowcaseEnabled,
      announcementEnabled: parsed.data.announcementEnabled,
      supportEmail: parsed.data.supportEmail,
      supportPhone: parsed.data.supportPhone,
    },
  });

  revalidatePath("/");
  revalidatePath("/quem-somos");
  revalidatePath("/atendimento");
  revalidatePath("/contato");
  revalidatePath("/faq");
  revalidatePath("/trocas-e-devolucoes");
  revalidatePath("/privacidade");
  revalidatePath("/termos-de-uso");
  revalidatePath("/admin/settings");
}
