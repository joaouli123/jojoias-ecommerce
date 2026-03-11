import Link from "next/link";
import { requireAdminPagePermission } from "@/lib/admin-auth";
import { getOperationalHealthSnapshot } from "@/lib/health";

const statusClasses = {
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-700",
  degraded: "border-amber-200 bg-amber-50 text-amber-700",
  down: "border-rose-200 bg-rose-50 text-rose-700",
} as const;

const badgeClasses = {
  healthy: "bg-emerald-100 text-emerald-700",
  degraded: "bg-amber-100 text-amber-700",
  down: "bg-rose-100 text-rose-700",
} as const;

export default async function AdminHealthPage() {
  await requireAdminPagePermission("reports:view");
  const snapshot = await getOperationalHealthSnapshot();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Saúde operacional</h1>
          <p className="mt-2 text-sm text-gray-600">Visão consolidada de banco, autenticação, integrações críticas e incidentes recentes.</p>
        </div>
        <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold capitalize ${statusClasses[snapshot.status]}`}>
          Status geral: {snapshot.status}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500">Última verificação</p>
            <p className="mt-1 text-base font-semibold text-gray-900">
              {new Date(snapshot.checkedAt).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/api/health" className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Abrir JSON
            </Link>
            <Link href="/admin/incidents" className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">
              Ver incidentes
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {snapshot.checks.map((check) => (
          <section key={check.key} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{check.label}</h2>
                <p className="mt-2 text-sm text-gray-600">{check.message}</p>
              </div>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${badgeClasses[check.status]}`}>
                {check.status}
              </span>
            </div>

            {check.actionHref && check.actionLabel ? (
              <div className="mt-4">
                <Link
                  href={check.actionHref}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  {check.actionLabel}
                </Link>
              </div>
            ) : null}

            {check.details && Object.keys(check.details).length > 0 ? (
              <dl className="mt-4 space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-600">
                {Object.entries(check.details).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <dt className="font-medium text-gray-500">{key}</dt>
                    <dd className="font-semibold text-gray-800">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}