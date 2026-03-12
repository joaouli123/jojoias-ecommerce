import { normalizeInputText } from "@/lib/admin-display";
import { buildProductFocusKeyword, buildProductMetaDescription, buildProductSeoTitle, generateProductSlug } from "@/lib/product-seo";

type ProductSeoAiInput = {
  name: string;
  description?: string | null;
  brand?: string | null;
  category?: string | null;
  price?: number | null;
  comparePrice?: number | null;
};

type ProductSeoAiResult = {
  title: string;
  slug: string;
  description: string;
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
};

function extractJsonFromText(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) {
    return trimmed;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

function buildFallback(input: ProductSeoAiInput): ProductSeoAiResult {
  const normalizedName = normalizeInputText(input.name) || "Produto Luxijóias";
  const normalizedDescription = normalizeInputText(input.description) || "Produto com curadoria Luxijóias, compra segura e envio para todo o Brasil.";
  const seoInput = {
    name: normalizedName,
    description: normalizedDescription,
    brand: normalizeInputText(input.brand),
    category: normalizeInputText(input.category),
    price: typeof input.price === "number" ? input.price : undefined,
    comparePrice: typeof input.comparePrice === "number" ? input.comparePrice : undefined,
    siteName: "Luxijóias",
  };

  return {
    title: normalizedName,
    slug: generateProductSlug(normalizedName),
    description: normalizedDescription,
    seoTitle: buildProductSeoTitle(seoInput),
    metaDescription: buildProductMetaDescription(seoInput),
    focusKeyword: buildProductFocusKeyword(seoInput),
  };
}

export async function generateProductSeoWithAi(input: ProductSeoAiInput): Promise<ProductSeoAiResult> {
  const normalizedName = normalizeInputText(input.name);
  if (!normalizedName) {
    return buildFallback(input);
  }

  const fallback = buildFallback({
    ...input,
    name: normalizedName,
  });

  const apiKey = process.env.GEMINI_API_KEY;
  // OBRIGATÓRIO: usar EXCLUSIVAMENTE o gemini-3.1-pro-preview para máxima inteligência no SEO!
  const model = "gemini-3.1-pro-preview";
  if (!apiKey) {
    return fallback;
  }

  const normalizedDescription = normalizeInputText(input.description);
  const normalizedBrand = normalizeInputText(input.brand);
  const normalizedCategory = normalizeInputText(input.category);
  const price = typeof input.price === "number" && Number.isFinite(input.price) ? input.price : undefined;
  const comparePrice = typeof input.comparePrice === "number" && Number.isFinite(input.comparePrice) ? input.comparePrice : undefined;

  const prompt = [
    "Você é o maior especialista Sênior em SEO Técnico e Copywriting de Conversão do mundo, focado em atingir o TOP 1 do Google para e-commerces de joias e presentes premium no Brasil.",
    "Siga diretrizes rigorosas do Google Search Central e do Helpful Content Update: crie conteúdo rico, humano, altamente persuasivo e focado totalmente na experiência e intenção de busca do usuário (sem keyword stuffing).",
    "SEU OBJETIVO: Maximizar o CTR (Click-Through Rate), o ranqueamento orgânico de longo prazo e a conversão direta.",
    "Retorne EXCLUSIVAMENTE UM JSON VÁLIDO. Não adicione textos antes ou depois, não use formatação com crases (```json). Apenas o objeto JSON puro com as seguintes chaves exatas: title, slug, description, seoTitle, metaDescription, focusKeyword.",
    "",
    "INSTRUÇÕES OBRIGATÓRIAS PARA CADA CHAVE:",
    "- title: Nome do produto otimizado para vendas e atração. O texto deve ser comercial, elegante e manter a intenção de quem quer comprar o item.",
    "- slug: Uma URL amigável curta, contendo apenas letras minúsculas e hifens, sem acentos, focada diretamente na palavra-chave (exemplo perfeito: anel-solitario-ouro-18k). Evite preposições desnecessárias (de, para, com).",
    "- description: Descrição incrivelmente bem escrita e persuasiva, simulando um copywriter de elite focando em despertar o desejo de compra. Crie de 2 a 3 parágrafos envolventes. Quebre parágrafos e fale sobre os benefícios reais do uso, o diferencial e qualidade (se não houver especificações, crie um tom inspirador sem mentir sobre os materiais). Não inclua Emojis nem Markdown.",
    "- seoTitle: Título para a tag SEO <title>. CRÍTICO: Máximo de 65 caracteres. Coloque a palavra-chave principal no início e, se couber, algo atrativo no final. (ex: Colar de Ouro 18k Elegante | Luxijóias).",
    "- metaDescription: Snippet para a tag Meta Description. Teto rigoroso de 140 a 155 caracteres. Precisa ser extremamente atrativa, resumir a oferta e contar com uma Call To Action sutil no final (ex: 'Garanta o seu hoje!', 'Frete Grátis e segurança.').",
    "- focusKeyword: A Palavra-Chave Principal ('Cauda Longa' / Long-tail) com maior potencial de atração comercial para este produto específico (composta por 2 a 4 palavras fortes).",
    "",
    "DADOS TEMPLÁTICO DO PRODUTO A SER OTIMIZADO:",
    `Nome atual: ${normalizedName}`,
    `Descrição original: ${normalizedDescription || "Crie algo deslumbrante tendo como premissa apenas o Nome."}`,
    `Marca: ${normalizedBrand || "Luxijóias (Use como marca oficial se fizer sentido)"}`,
    `Categoria: ${normalizedCategory || "Mapeie inteligentemente a categoria cruzando dados do nome."}`,
    `Preço de venda focado: ${price ? `R$ ${price.toFixed(2)}` : "não informado"}`,
    `Ancoragem de preço (Preço original): ${comparePrice ? `R$ ${comparePrice.toFixed(2)}` : "não informado"}`,
  ].join("\n");

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.65, // Ajustado para ser assertivo mas ainda criativo
          responseMimeType: "application/json",
        },
      }),
    });

    const payload = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
          }>;
        };
      }>;
    };

    if (!response.ok) {
      return fallback;
    }

    const rawText = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n") || "";
    const jsonText = extractJsonFromText(rawText);
    if (!jsonText) {
      return fallback;
    }

    const parsed = JSON.parse(jsonText) as Partial<ProductSeoAiResult>;

    return {
      title: normalizeInputText(parsed.title) || fallback.title,
      slug: generateProductSlug(parsed.slug || parsed.title || fallback.title),
      description: (parsed.description || fallback.description)
        .replace(/\r/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim(),
      seoTitle: normalizeInputText(parsed.seoTitle) || fallback.seoTitle,
      metaDescription: normalizeInputText(parsed.metaDescription) || fallback.metaDescription,
      focusKeyword: normalizeInputText(parsed.focusKeyword) || fallback.focusKeyword,
    };
  } catch {
    return fallback;
  }
}