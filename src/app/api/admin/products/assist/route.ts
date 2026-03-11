import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { normalizeInputText } from "@/lib/admin-display";

function generateSlug(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

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

  const body = (await request.json()) as { name?: string; description?: string };
  const name = normalizeInputText(body.name);
  const description = normalizeInputText(body.description);

  if (!name) {
    return NextResponse.json({ error: "Informe pelo menos o nome do produto para usar a IA." }, { status: 400 });
  }

  const prompt = [
    "Você é um assistente de ecommerce especializado em joias e presentes premium no Brasil.",
    "Melhore os campos do produto em português brasileiro.",
    "Retorne apenas JSON válido com as chaves: title, slug, description.",
    "O slug deve ser curto, sem acentos e pronto para URL.",
    "A descrição deve ter 2 ou 3 frases, tom comercial elegante, sem exageros e sem markdown.",
    `Nome atual: ${name}`,
    `Descrição atual: ${description || "sem descrição"}`,
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

  const parsed = JSON.parse(jsonText) as { title?: string; slug?: string; description?: string };

  return NextResponse.json({
    title: normalizeInputText(parsed.title) || name,
    slug: generateSlug(parsed.slug || parsed.title || name),
    description: normalizeInputText(parsed.description) || description,
  });
}