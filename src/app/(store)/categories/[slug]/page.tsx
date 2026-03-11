import { redirect } from "next/navigation";

export default async function CategoryAliasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/categoria/${slug === "all" ? "todos" : slug}`);
}