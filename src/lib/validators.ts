import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  email: z.email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  phone: z.string().optional(),
});

export const profileSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  email: z.email("E-mail inválido"),
  phone: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.email("E-mail inválido"),
});

export const newsletterSubscriptionSchema = z.object({
  email: z.email("E-mail inválido"),
  name: z.string().trim().min(2, "Nome muito curto").max(80, "Nome muito longo").optional().or(z.literal("")),
  source: z.string().trim().max(80, "Origem inválida").optional().or(z.literal("")),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, "Token inválido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
});

export const reviewSchema = z.object({
  productId: z.string().cuid("Produto inválido"),
  rating: z.number().int().min(1, "Avaliação mínima é 1 estrela").max(5, "Avaliação máxima é 5 estrelas"),
  title: z.string().trim().max(80, "Título muito longo").optional(),
  content: z.string().trim().min(10, "Conte um pouco mais sobre sua experiência").max(1000, "Comentário muito longo"),
});

export const categorySchema = z.object({
  name: z.string().min(2, "Nome da categoria é obrigatório"),
  slug: z.string().min(2, "Slug da categoria é obrigatório"),
});

export const brandSchema = z.object({
  name: z.string().min(2, "Nome da marca é obrigatório"),
  slug: z.string().min(2, "Slug da marca é obrigatório"),
});

export const productVariantSchema = z.object({
  name: z.string().min(2, "Nome da variação é obrigatório"),
  price: z.number().positive("Preço da variação deve ser maior que zero"),
  quantity: z.number().int().nonnegative("Estoque da variação não pode ser negativo"),
  sku: z.string().optional(),
  image: z.union([z.string().url("Imagem da variação inválida"), z.string().startsWith("/")]).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export const productSchema = z.object({
  name: z.string().min(2, "Nome do produto é obrigatório"),
  slug: z.string().min(2, "Slug do produto é obrigatório"),
  description: z.string().optional(),
  metaTitle: z.string().trim().max(70, "Meta title muito longo").optional(),
  metaDescription: z.string().trim().max(160, "Meta description muito longa").optional(),
  image: z.union([z.string().url("Imagem principal inválida"), z.string().startsWith("/")]).optional().or(z.literal("")),
  galleryImages: z.array(z.union([z.string().url("Uma das imagens da galeria é inválida"), z.string().startsWith("/")])).optional(),
  price: z.number().positive("Preço deve ser maior que zero"),
  comparePrice: z.number().nonnegative().optional(),
  sku: z.string().optional(),
  quantity: z.number().int().nonnegative("Estoque não pode ser negativo"),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]),
  categoryId: z.string().cuid("Categoria inválida"),
  brandId: z.string().cuid("Marca inválida").optional().or(z.literal("")),
  variants: z.array(productVariantSchema).optional(),
});

export const addressSchema = z.object({
  recipient: z.string().min(2, "Destinatário é obrigatório"),
  zipcode: z.string().min(8, "CEP inválido"),
  street: z.string().min(2, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  district: z.string().min(2, "Bairro é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório"),
  complement: z.string().optional(),
});

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().cuid("Produto inválido"),
        quantity: z.number().int().positive("Quantidade inválida"),
      }),
    )
    .min(1, "Carrinho vazio"),
  address: addressSchema,
  paymentMethod: z.string().min(2, "Método de pagamento inválido"),
  couponCode: z.string().optional(),
});

export const checkoutSubmissionSchema = z.object({
  checkoutToken: z.string().uuid("Token de checkout inválido"),
  name: z.string().min(2, "Nome muito curto"),
  email: z.email("E-mail inválido"),
  document: z.string().trim().min(11, "CPF inválido").max(18, "CPF inválido").optional(),
  phone: z.string().optional(),
  zipcode: z.string().min(8, "CEP inválido"),
  street: z.string().min(2, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  district: z.string().min(2, "Bairro é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório").max(2, "Estado inválido"),
  complement: z.string().optional(),
  shippingOptionId: z.enum(["standard", "express", "pickup"]),
  paymentMethod: z.enum(["PIX", "CARD", "BOLETO"]),
  couponCode: z.string().trim().max(50, "Cupom inválido").optional(),
  notes: z.string().max(500, "Observações muito longas").optional(),
});

export const shippingCalculationSchema = z.object({
  zipcode: z.string().min(8, "CEP inválido"),
  subtotal: z.number().nonnegative("Subtotal inválido"),
  itemsCount: z.number().int().positive("Quantidade de itens inválida"),
});

export const couponSchema = z.object({
  code: z.string().trim().min(3, "Código do cupom inválido").max(50, "Código do cupom inválido"),
  name: z.string().trim().min(2, "Nome do cupom é obrigatório").max(80, "Nome do cupom muito longo"),
  description: z.string().trim().max(200, "Descrição muito longa").optional(),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().positive("Valor do cupom deve ser maior que zero"),
  minSubtotal: z.number().nonnegative("Subtotal mínimo inválido").optional(),
  maxDiscount: z.number().nonnegative("Desconto máximo inválido").optional(),
  startsAt: z.date().optional(),
  expiresAt: z.date().optional(),
  isActive: z.boolean(),
  usageLimit: z.number().int().positive("Limite de uso inválido").optional(),
  appliesToBrandSlugs: z.string().trim().max(200, "Escopo de marcas muito longo").optional(),
  appliesToCategorySlugs: z.string().trim().max(200, "Escopo de categorias muito longo").optional(),
  firstOrderOnly: z.boolean().default(false),
  allowWithPixDiscount: z.boolean().default(true),
});

export const couponValidationSchema = z.object({
  code: z.string().trim().min(3, "Informe um cupom válido."),
  subtotal: z.number().nonnegative("Subtotal inválido"),
  brandSlugs: z.array(z.string().trim().min(1, "Marca inválida")).optional(),
  categorySlugs: z.array(z.string().trim().min(1, "Categoria inválida")).optional(),
  customerOrderCount: z.number().int().nonnegative("Histórico de pedidos inválido").optional(),
});

export const bannerSchema = z.object({
  title: z.string().trim().min(2, "Título do banner é obrigatório").max(120, "Título muito longo"),
  subtitle: z.string().trim().max(180, "Subtítulo muito longo").optional(),
  imageUrl: z.union([z.string().url("Imagem desktop inválida"), z.string().startsWith("/")]),
  mobileUrl: z.union([z.string().url("Imagem mobile inválida"), z.string().startsWith("/")]).optional().or(z.literal("")),
  href: z.union([z.string().url("Link do banner inválido"), z.string().startsWith("/"), z.literal("")]).optional(),
  placement: z.enum(["hero", "secondary", "sidebar"]),
  isActive: z.boolean(),
  position: z.number().int().nonnegative("Posição inválida"),
  startsAt: z.date().optional(),
  endsAt: z.date().optional(),
}).refine((data) => {
  if (!data.startsAt || !data.endsAt) return true;
  return data.endsAt >= data.startsAt;
}, {
  message: "A data final deve ser maior ou igual à inicial.",
  path: ["endsAt"],
});

export const pageSchema = z.object({
  title: z.string().trim().min(3, "Título da página é obrigatório").max(200, "Título muito longo"),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, "Slug inválido. Use apenas letras minúsculas, números e hífen."),
  content: z.string().trim().min(10, "Conteúdo da página é obrigatório").max(20000, "Conteúdo muito longo"),
  metaTitle: z.string().trim().max(70, "Meta title muito longo").optional(),
  metaDescription: z.string().trim().max(160, "Meta description muito longa").optional(),
  isPublished: z.boolean().default(false),
});

export const blogPostSchema = z.object({
  title: z.string().trim().min(3, "Título do post é obrigatório").max(200, "Título muito longo"),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, "Slug inválido. Use apenas letras minúsculas, números e hífen."),
  excerpt: z.string().trim().min(20, "Resumo muito curto").max(260, "Resumo muito longo"),
  content: z.string().trim().min(80, "Conteúdo do post muito curto").max(30000, "Conteúdo muito longo"),
  coverImage: z.union([z.string().url("Imagem de capa inválida"), z.string().startsWith("/")]).optional().or(z.literal("")),
  authorName: z.string().trim().min(2, "Autor inválido").max(80, "Autor muito longo").optional().or(z.literal("")),
  tags: z.string().trim().max(200, "Tags muito longas").optional().or(z.literal("")),
  isPublished: z.boolean().default(false),
  featured: z.boolean().default(false),
  publishedAt: z.date().optional(),
});

export const storeSettingsSchema = z.object({
  storeName: z.string().trim().min(2, "Nome da loja é obrigatório").max(80, "Nome da loja muito longo"),
  tagline: z.string().trim().min(10, "Tagline muito curta").max(180, "Tagline muito longa"),
  brandShowcaseEnabled: z.boolean().default(true),
  announcementEnabled: z.boolean().default(true),
  announcementText: z.string().trim().min(8, "Texto principal do aviso muito curto").max(180, "Texto principal do aviso muito longo"),
  announcementSecondaryText: z.string().trim().min(8, "Texto secundário do aviso muito curto").max(180, "Texto secundário do aviso muito longo"),
  announcementLinkLabel: z.string().trim().min(2, "Rótulo do aviso muito curto").max(40, "Rótulo do aviso muito longo"),
  announcementLinkHref: z.union([z.string().url("Link do aviso inválido"), z.string().startsWith("/")]),
  supportEmail: z.email("E-mail de suporte inválido"),
  supportPhone: z.string().trim().min(8, "Telefone inválido").max(40, "Telefone inválido"),
  whatsappPhone: z.string().trim().min(8, "WhatsApp inválido").max(40, "WhatsApp inválido"),
  whatsappUrl: z.string().url("Link do WhatsApp inválido"),
  addressLine: z.string().trim().min(4, "Endereço inválido").max(140, "Endereço muito longo"),
  cityState: z.string().trim().min(4, "Cidade/estado inválido").max(80, "Cidade/estado muito longo"),
  businessHours: z.string().trim().min(4, "Horário inválido").max(80, "Horário muito longo"),
  instagramUrl: z.string().url("Instagram inválido"),
  facebookUrl: z.string().url("Facebook inválido"),
  youtubeUrl: z.string().url("YouTube inválido"),
  aboutTitle: z.string().trim().min(10, "Título institucional muito curto").max(140, "Título institucional muito longo"),
  aboutDescription: z.string().trim().min(20, "Descrição institucional muito curta").max(260, "Descrição institucional muito longa"),
  aboutContent: z.string().trim().min(40, "Conteúdo de quem somos muito curto").max(3000, "Conteúdo de quem somos muito longo"),
  shippingContent: z.string().trim().min(40, "Conteúdo de entregas muito curto").max(3000, "Conteúdo de entregas muito longo"),
  exchangesContent: z.string().trim().min(40, "Conteúdo de trocas muito curto").max(3000, "Conteúdo de trocas muito longo"),
  privacyContent: z.string().trim().min(40, "Conteúdo de privacidade muito curto").max(3000, "Conteúdo de privacidade muito longo"),
  termsContent: z.string().trim().min(40, "Conteúdo de termos muito curto").max(3000, "Conteúdo de termos muito longo"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CheckoutSubmissionInput = z.infer<typeof checkoutSubmissionSchema>;
export type ShippingCalculationInput = z.infer<typeof shippingCalculationSchema>;
export type CouponInput = z.infer<typeof couponSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type BannerInput = z.infer<typeof bannerSchema>;
export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>;
export type BrandInput = z.infer<typeof brandSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
export type PageInput = z.infer<typeof pageSchema>;
export type NewsletterSubscriptionInput = z.infer<typeof newsletterSubscriptionSchema>;
export type BlogPostInput = z.infer<typeof blogPostSchema>;

