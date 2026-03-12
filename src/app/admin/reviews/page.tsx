import Link from "next/link";
import { Star, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { deleteReviewAdminAction } from "@/actions/reviews";
import { requireAdminPagePermission } from "@/lib/admin-auth";

export default async function AdminReviewsPage() {
  await requireAdminPagePermission("marketing:manage");

  const [reviews, summary] = await Promise.all([
    prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.review.aggregate({
      _avg: { rating: true },
      _count: { id: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-medium font-serif tracking-tight text-gray-900">Avaliações</h1>
          <p className="mt-2 text-sm text-gray-600">Monitore feedbacks enviados pelos clientes e remova conteúdos inadequados quando necessário.</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
          <strong className="text-gray-900">{summary._avg.rating?.toFixed(1) ?? "0.0"}</strong> média geral em <strong className="text-gray-900">{summary._count.id}</strong> avaliações
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-600">
              <th className="p-4 font-medium">Produto</th>
              <th className="p-4 font-medium">Cliente</th>
              <th className="p-4 font-medium">Nota</th>
              <th className="p-4 font-medium">Comentário</th>
              <th className="p-4 font-medium">Data</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reviews.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-gray-500">Nenhuma avaliação recebida até o momento.</td>
              </tr>
            ) : (
              reviews.map((review) => (
                <tr key={review.id} className="align-top hover:bg-gray-50/70">
                  <td className="p-4">
                    <Link href={`/produto/${review.product.slug}`} className="font-semibold text-gray-900 hover:text-amber-700">
                      {review.product.name}
                    </Link>
                  </td>
                  <td className="p-4 text-gray-600">
                    <p className="font-medium text-gray-900">{review.user.name}</p>
                    <p className="text-xs text-gray-500">{review.user.email}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} className={`h-4 w-4 ${index < review.rating ? "fill-current" : ""}`} />
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">
                    {review.title ? <p className="font-semibold text-gray-900">{review.title}</p> : null}
                    <p className="mt-1 line-clamp-3 max-w-xl leading-6">{review.content}</p>
                  </td>
                  <td className="p-4 text-gray-600">
                    {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(review.createdAt)}
                  </td>
                  <td className="p-4 text-right">
                    <form action={deleteReviewAdminAction}>
                      <input type="hidden" name="id" value={review.id} />
                      <button type="submit" className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50">
                        <Trash2 className="h-4 w-4" /> Excluir
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
