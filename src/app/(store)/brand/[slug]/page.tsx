import { permanentRedirect } from "next/navigation"

export default async function BrandAliasPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  permanentRedirect(`/marca/${slug}`)
}