export type ProductInfoItem = {
  label: string;
  value: string;
};

export type ProductSpecItem = {
  label: string;
  value: string;
};

const IMPORTANT_INFO_HEADING = "Informações importantes:";
const TECHNICAL_SPECS_HEADING = "Especificações técnicas:";

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&ecirc;/gi, "ê")
    .replace(/&eacute;/gi, "é")
    .replace(/&aacute;/gi, "á")
    .replace(/&atilde;/gi, "ã")
    .replace(/&ccedil;/gi, "ç")
    .replace(/&otilde;/gi, "õ")
    .replace(/&uacute;/gi, "ú")
    .replace(/&iacute;/gi, "í")
    .replace(/&oacute;/gi, "ó")
    .replace(/&agrave;/gi, "à")
    .replace(/&uuml;/gi, "ü");
}

function normalizeLine(value: string) {
  return decodeHtmlEntities(value).replace(/\s+/g, " ").trim();
}

function uniqueItems(items: ProductInfoItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.label}|${item.value}`.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function uniqueSpecItems(items: ProductSpecItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.label}|${item.value}`.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function inferInfoLabel(value: string) {
  if (/garantia/i.test(value)) {
    return "Garantia";
  }

  if (/resistente\s+[àa]\s+[áa]gua/i.test(value)) {
    return "Proteção";
  }

  if (/frete|envio|entrega/i.test(value)) {
    return "Entrega";
  }

  if (/a[çc]o inox|mil[eé]simos de prata|banhad[ao]/i.test(value)) {
    return "Material";
  }

  return "Detalhe";
}

function expandHighlight(rawValue: string): ProductInfoItem[] {
  return rawValue
    .split(/[\/|]/)
    .map((part) => normalizeLine(part))
    .filter(Boolean)
    .map((value) => ({
      label: inferInfoLabel(value),
      value,
    }));
}

function formatSpecLabel(value: string) {
  const normalized = normalizeLine(value).replace(/:+$/, "");
  if (!normalized) {
    return "Detalhe";
  }

  const lower = normalized.toLowerCase();
  if (lower === "idade") return "Idade";
  if (lower === "gênero") return "Gênero";
  if (lower === "genero") return "Gênero";
  if (lower === "cor") return "Cor";
  if (lower === "modelo") return "Modelo";
  if (lower === "código") return "Código";
  if (lower === "codigo") return "Código";
  if (lower === "garantia") return "Garantia";
  if (lower === "dimensões aproximadas") return "Dimensões aproximadas";

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function parseSpecLines(lines: string[]) {
  return lines
    .map((line) => normalizeLine(line.replace(/^[-•]\s*/, "")))
    .filter(Boolean)
    .flatMap((line) => {
      const keyValueMatch = line.match(/^([^:]{2,80}):\s*(.+)$/);
      if (!keyValueMatch) {
        return [] as ProductSpecItem[];
      }

      return [{
        label: formatSpecLabel(keyValueMatch[1]),
        value: normalizeLine(keyValueMatch[2]),
      }];
    });
}

function parseStructuredSpecItems(descriptionBody: string) {
  const match = descriptionBody.match(new RegExp(`\\n*${TECHNICAL_SPECS_HEADING}\\n((?:- .+\\n?)*)`, "i"));
  if (!match) {
    return {
      descriptionBody,
      specItems: [] as ProductSpecItem[],
    };
  }

  const block = match[1] || "";
  const specItems = parseSpecLines(block.split("\n"));
  const cleanedBody = `${descriptionBody.slice(0, match.index ?? 0)}${descriptionBody.slice((match.index ?? 0) + match[0].length)}`
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return {
    descriptionBody: cleanedBody,
    specItems,
  };
}

function extractLegacySpecItems(descriptionBody: string) {
  const specs: ProductSpecItem[] = [];
  let cleanedBody = descriptionBody;

  const dimensionsMatch = cleanedBody.match(/\n*Dimens(?:õ|o)es? Aproximadas:\n([\s\S]*?)(?=\n(?:Ficha t[ée]cnica:|Caracter[íi]sticas:)|$)/i);
  if (dimensionsMatch) {
    const dimensionLines = dimensionsMatch[1]
      .split("\n")
      .map((line) => normalizeLine(line))
      .filter(Boolean);
    if (dimensionLines.length > 0) {
      specs.push({
        label: "Dimensões aproximadas",
        value: dimensionLines.join("; "),
      });
    }

    cleanedBody = `${cleanedBody.slice(0, dimensionsMatch.index ?? 0)}${cleanedBody.slice((dimensionsMatch.index ?? 0) + dimensionsMatch[0].length)}`;
  }

  const fichaMatch = cleanedBody.match(/\n*Ficha t[ée]cnica:\n([\s\S]*?)(?=\nCaracter[íi]sticas:|$)/i);
  if (fichaMatch) {
    specs.push(...parseSpecLines(fichaMatch[1].split("\n")));
    cleanedBody = `${cleanedBody.slice(0, fichaMatch.index ?? 0)}${cleanedBody.slice((fichaMatch.index ?? 0) + fichaMatch[0].length)}`;
  }

  const characteristicsMatch = cleanedBody.match(/\n*Caracter[íi]sticas:\n([\s\S]*?)$/i);
  if (characteristicsMatch) {
    specs.push(...parseSpecLines(characteristicsMatch[1].split("\n")));
    cleanedBody = `${cleanedBody.slice(0, characteristicsMatch.index ?? 0)}${cleanedBody.slice((characteristicsMatch.index ?? 0) + characteristicsMatch[0].length)}`;
  }

  return {
    descriptionBody: cleanedBody.replace(/\n{3,}/g, "\n\n").trim(),
    specItems: specs,
  };
}

export function buildImportedDescription(description: string, highlights: string[]) {
  const normalizedDescription = description.trim();
  const normalizedHighlights = highlights.map((item) => normalizeLine(item)).filter(Boolean);

  if (normalizedHighlights.length === 0) {
    return normalizedDescription;
  }

  const block = `${IMPORTANT_INFO_HEADING}\n${normalizedHighlights.map((item) => `- ${item}`).join("\n")}`;
  if (normalizedDescription.startsWith(IMPORTANT_INFO_HEADING)) {
    return normalizedDescription;
  }

  return normalizedDescription ? `${block}\n\n${normalizedDescription}` : block;
}

export function buildStructuredProductDescription(
  description: string,
  highlights: string[],
  specItems: ProductSpecItem[] = [],
) {
  const normalizedSpecs = uniqueSpecItems(
    specItems
      .map((item) => ({
        label: formatSpecLabel(item.label),
        value: normalizeLine(item.value),
      }))
      .filter((item) => item.label && item.value),
  );
  const baseDescription = buildImportedDescription(description, highlights);

  if (normalizedSpecs.length === 0) {
    return baseDescription;
  }

  const specsBlock = `${TECHNICAL_SPECS_HEADING}\n${normalizedSpecs.map((item) => `- ${item.label}: ${item.value}`).join("\n")}`;
  return [baseDescription, specsBlock].filter(Boolean).join("\n\n").trim();
}

export function extractProductInfoFromDescription(description: string | null | undefined) {
  const normalizedDescription = (description || "").replace(/\r/g, "").trim();
  const match = normalizedDescription.match(/^Informações importantes:\n((?:- .+\n?)*)\n*/i);

  let descriptionBody = normalizedDescription;
  let infoItems: ProductInfoItem[] = [];

  if (match) {
    const block = match[1] || "";
    infoItems = uniqueItems(
      block
        .split("\n")
        .map((line) => line.replace(/^\-\s*/, "").trim())
        .filter(Boolean)
        .flatMap((line) => expandHighlight(line)),
    );

    descriptionBody = normalizedDescription.slice(match[0].length).trim();
  }

  const structuredSpecs = parseStructuredSpecItems(descriptionBody);
  const legacySpecs = structuredSpecs.specItems.length > 0
    ? { descriptionBody: structuredSpecs.descriptionBody, specItems: structuredSpecs.specItems }
    : extractLegacySpecItems(structuredSpecs.descriptionBody);

  return {
    descriptionBody: legacySpecs.descriptionBody,
    infoItems,
    specItems: uniqueSpecItems(legacySpecs.specItems),
  };
}