type ProductSeoInput = {
  name: string
  slug?: string | null
  description?: string | null
  brand?: string | null
  category?: string | null
  price?: number | null
  comparePrice?: number | null
  siteName?: string
}

function normalizeText(value?: string | null) {
  return (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function normalizeComparableText(value?: string | null) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function truncateAtWord(value: string, maxLength: number) {
  if (value.length <= maxLength) return value

  const trimmed = value.slice(0, maxLength + 1)
  const breakIndex = trimmed.lastIndexOf(" ")
  return (breakIndex > Math.floor(maxLength * 0.6) ? trimmed.slice(0, breakIndex) : value.slice(0, maxLength)).trim()
}

function dedupeSegments(segments: Array<string | null | undefined>) {
  const unique: string[] = []

  for (const segment of segments) {
    const cleaned = normalizeText(segment)
    if (!cleaned) continue

    const comparable = normalizeComparableText(cleaned)
    if (unique.some((entry) => normalizeComparableText(entry) === comparable)) continue
    unique.push(cleaned)
  }

  return unique
}

function containsComparableText(source?: string | null, candidate?: string | null) {
  const normalizedSource = normalizeComparableText(source)
  const normalizedCandidate = normalizeComparableText(candidate)
  return Boolean(normalizedSource && normalizedCandidate && normalizedSource.includes(normalizedCandidate))
}

function formatPrice(price?: number | null) {
  if (!price || !Number.isFinite(price) || price <= 0) return ""

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(price)
}

export function generateProductSlug(text: string) {
  return normalizeComparableText(text)
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export function buildProductFocusKeyword(input: ProductSeoInput) {
  const keyword = dedupeSegments([
    input.name,
    input.brand && !containsComparableText(input.name, input.brand) ? input.brand : "",
    input.category && !containsComparableText(input.name, input.category) ? input.category : "",
  ]).join(" ")

  return truncateAtWord(keyword, 60)
}

export function buildProductSeoTitle(input: ProductSeoInput, maxLength = 65) {
  const siteName = normalizeText(input.siteName) || "Luxijóias"
  const titleSegments = dedupeSegments([
    input.name,
    input.brand && !containsComparableText(input.name, input.brand) ? input.brand : "",
    input.category && !containsComparableText(input.name, input.category) ? input.category : "",
  ])

  let bestTitle = titleSegments.join(" | ")
  if (!bestTitle) {
    bestTitle = siteName
  }

  const titleWithSite = dedupeSegments([...titleSegments, siteName]).join(" | ")
  if (titleWithSite.length <= maxLength) {
    return titleWithSite
  }

  if (bestTitle.length <= maxLength) {
    return bestTitle
  }

  return truncateAtWord(bestTitle, maxLength)
}

export function buildProductMetaDescription(input: ProductSeoInput, maxLength = 160) {
  const siteName = normalizeText(input.siteName) || "Luxijóias"
  const description = normalizeText(input.description)
  const priceLabel = formatPrice(input.price)
  const comparePriceLabel = formatPrice(input.comparePrice)
  const brandSnippet = input.brand && !containsComparableText(input.name, input.brand) ? ` da ${normalizeText(input.brand)}` : ""
  const categorySnippet = input.category && !containsComparableText(input.name, input.category) ? ` em ${normalizeText(input.category).toLowerCase()}` : ""
  const priceSnippet = priceLabel
    ? comparePriceLabel && input.comparePrice && input.price && input.comparePrice > input.price
      ? ` Aproveite por ${priceLabel}.`
      : ` Compre online por ${priceLabel}.`
    : ""
  const fallback = `${normalizeText(input.name)}${brandSnippet}${categorySnippet} na ${siteName}.${priceSnippet} Compra segura e envio para todo o Brasil.`

  if (!description) {
    return truncateAtWord(fallback, maxLength)
  }

  const summarizedDescription = truncateAtWord(description, 110)
  const candidate = `${summarizedDescription}${summarizedDescription.endsWith(".") ? "" : "."}${priceSnippet} Compra segura na ${siteName}.`
  return truncateAtWord(candidate.replace(/\s+/g, " ").trim(), maxLength)
}

export function buildProductSeoPreview(input: ProductSeoInput) {
  return {
    title: buildProductSeoTitle(input),
    description: buildProductMetaDescription(input),
    focusKeyword: buildProductFocusKeyword(input),
    slug: generateProductSlug(input.slug || input.name),
  }
}