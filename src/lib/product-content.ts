export type ProductInfoItem = {
  label: string;
  value: string;
};

const IMPORTANT_INFO_HEADING = "Informações importantes:";

function normalizeLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
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
    .split("/")
    .map((part) => normalizeLine(part))
    .filter(Boolean)
    .map((value) => ({
      label: inferInfoLabel(value),
      value,
    }));
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

export function extractProductInfoFromDescription(description: string | null | undefined) {
  const normalizedDescription = (description || "").replace(/\r/g, "").trim();
  const match = normalizedDescription.match(/^Informações importantes:\n((?:- .+\n?)*)\n*/i);

  if (!match) {
    return {
      descriptionBody: normalizedDescription,
      infoItems: [] as ProductInfoItem[],
    };
  }

  const block = match[1] || "";
  const infoItems = uniqueItems(
    block
      .split("\n")
      .map((line) => line.replace(/^\-\s*/, "").trim())
      .filter(Boolean)
      .flatMap((line) => expandHighlight(line)),
  );

  return {
    descriptionBody: normalizedDescription.slice(match[0].length).trim(),
    infoItems,
  };
}