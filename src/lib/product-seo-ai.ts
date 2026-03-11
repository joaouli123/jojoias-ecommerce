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
  const model = process.env.GEMINI_MODEL || "gemini-3.1-pro-preview";
  if (!apiKey) {
    return fallback;
  }

  const normalizedDescription = normalizeInputText(input.description);
  const normalizedBrand = normalizeInputText(input.brand);
  const normalizedCategory = normalizeInputText(input.category);
  const price = typeof input.price === "number" && Number.isFinite(input.price) ? input.price : undefined;
  const comparePrice = typeof input.comparePrice === "number" && Number.isFinite(input.comparePrice) ? input.comparePrice : undefined;

  const prompt = [
    "Você é um especialista sênior em SEO para ecommerce de joias e presentes premium no Brasil.",
    "Siga boas práticas do Google Search Central: títulos únicos, claros, humanos, sem keyword stuffing, sem promessas enganosas e sem repetir termos desnecessariamente.",
    "Melhore o produto em português brasileiro com foco em CTR, relevância semântica, intenção de busca e boa legibilidade.",
    "Retorne apenas JSON válido com as chaves: title, slug, description, seoTitle, metaDescription, focusKeyword.",
    "title: nome comercial do produto, elegante e vendável, mantendo a intenção principal do item.",
    "slug: curto, sem acentos, minúsculo, pronto para URL, preferindo 3 a 8 palavras.",
    "description: descrição profissional para a página do produto com 2 ou 3 parágrafos curtos separados por uma linha em branco, cobrindo o que é o produto, diferencial visual ou uso e informações confirmadas de compra. Não use markdown, não use emojis e não invente materiais, medidas ou atributos não informados.",
    "seoTitle: título SEO com até 65 caracteres, descritivo e natural.",
    "metaDescription: meta description com 140 a 160 caracteres, específica e persuasiva.",
    "focusKeyword: palavra-chave principal com 2 a 5 termos.",
    "Evite conteúdo genérico demais. Se houver categoria, marca ou faixa de preço, use isso para tornar o texto mais específico.",
    `Nome atual: ${normalizedName}`,
    `Descrição atual: ${normalizedDescription || "sem descrição"}`,
    `Marca: ${normalizedBrand || "sem marca"}`,
    `Categoria: ${normalizedCategory || "sem categoria"}`,
    `Preço atual: ${price ? `R$ ${price.toFixed(2)}` : "não informado"}`,
    `Preço comparativo: ${comparePrice ? `R$ ${comparePrice.toFixed(2)}` : "não informado"}`,
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
          temperature: 0.7,
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