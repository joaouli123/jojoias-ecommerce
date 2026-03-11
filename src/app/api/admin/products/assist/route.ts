import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { normalizeInputText } from "@/lib/admin-display";
import { buildProductFocusKeyword, buildProductMetaDescription, buildProductSeoTitle, generateProductSlug } from "@/lib/product-seo";

function extractJsonFromText(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) {
    return trimmed;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

export async function POST(request: NextRequest) {
  await requireAdminPermission("products:manage");

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-3.1-pro-preview";
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY não configurada no ambiente." }, { status: 500 });
  }

  const body = (await request.json()) as {
    name?: string;
    description?: string;
    brand?: string;
    category?: string;
    price?: number;
    comparePrice?: number;
  };
  const name = normalizeInputText(body.name);
  const description = normalizeInputText(body.description);
  const brand = normalizeInputText(body.brand);
  const category = normalizeInputText(body.category);
  const price = Number.isFinite(body.price) ? body.price : undefined;
  const comparePrice = Number.isFinite(body.comparePrice) ? body.comparePrice : undefined;

  if (!name) {
    return NextResponse.json({ error: "Informe pelo menos o nome do produto para usar a IA." }, { status: 400 });
  }

  const prompt = [
    "Você é um especialista sênior em SEO para ecommerce de joias e presentes premium no Brasil.",
    "Siga boas práticas do Google Search Central: títulos únicos, claros, humanos, sem keyword stuffing, sem promessas enganosas e sem repetir termos desnecessariamente.",
    "Melhore o produto em português brasileiro com foco em CTR, relevância semântica e boa legibilidade.",
    "Retorne apenas JSON válido com as chaves: title, slug, description, seoTitle, metaDescription, focusKeyword.",
    "title: nome comercial do produto, elegante e vendável, mantendo a intenção principal do item.",
    "slug: curto, sem acentos, minúsculo, pronto para URL, preferindo 3 a 8 palavras.",
    "description: descrição profissional para a página do produto, com 2 ou 3 frases curtas, sem markdown, sem emojis, sem inventar materiais ou atributos não informados.",
    "seoTitle: título SEO com até 65 caracteres, descritivo e natural.",
    "metaDescription: meta description com 140 a 160 caracteres, específica e persuasiva.",
    "focusKeyword: palavra-chave principal com 2 a 5 termos.",
    `Nome atual: ${name}`,
    `Descrição atual: ${description || "sem descrição"}`,
    `Marca: ${brand || "sem marca"}`,
    `Categoria: ${category || "sem categoria"}`,
    `Preço atual: ${price ? `R$ ${price.toFixed(2)}` : "não informado"}`,
    `Preço comparativo: ${comparePrice ? `R$ ${comparePrice.toFixed(2)}` : "não informado"}`,
  ].join("\n");

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
    error?: { message?: string };
  };

  if (!response.ok) {
    return NextResponse.json({ error: payload.error?.message || "Falha ao consultar a IA." }, { status: response.status });
  }

  const rawText = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n") || "";
  const jsonText = extractJsonFromText(rawText);

  if (!jsonText) {
    return NextResponse.json({ error: "A IA retornou uma resposta inválida." }, { status: 502 });
  }

  const parsed = JSON.parse(jsonText) as {
    title?: string;
    slug?: string;
    description?: string;
    seoTitle?: string;
    metaDescription?: string;
    focusKeyword?: string;
  };

  const seoInput = {
    name: normalizeInputText(parsed.title) || name,
    description: normalizeInputText(parsed.description) || description,
    brand,
    category,
    price,
    comparePrice,
    siteName: "Luxijóias",
  };

  return NextResponse.json({
    title: seoInput.name,
    slug: generateProductSlug(parsed.slug || parsed.title || name),
    description: normalizeInputText(parsed.description) || description,
    seoTitle: normalizeInputText(parsed.seoTitle) || buildProductSeoTitle(seoInput),
    metaDescription: normalizeInputText(parsed.metaDescription) || buildProductMetaDescription(seoInput),
    focusKeyword: normalizeInputText(parsed.focusKeyword) || buildProductFocusKeyword(seoInput),
  });
}