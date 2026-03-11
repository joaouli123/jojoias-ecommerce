import { requireAdminPagePermission } from "@/lib/admin-auth";
import { buildAuditLogWhere, formatAuditMetadata, type AuditLogFilters } from "@/lib/admin-audit";
import { prisma } from "@/lib/prisma";

function buildExportQuery(filters: AuditLogFilters) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }

  const query = params.toString();
  return query ? `/admin/audit-logs/export?${query}` : "/admin/audit-logs/export";
}

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<AuditLogFilters>;
}) {
  await requireAdminPagePermission("reports:view");

  const filters = await searchParams;
  const where = buildAuditLogWhere(filters);

  const [logs, entitySummary, actions, entityTypes] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.adminAuditLog.groupBy({
      by: ["entityType"],
      where,
      _count: { _all: true },
      orderBy: {
        _count: {
          entityType: "desc",
        },
      },
      take: 6,
    }),
    prisma.adminAuditLog.findMany({
      select: { action: true },
      distinct: ["action"],
      orderBy: { action: "asc" },
    }),
    prisma.adminAuditLog.findMany({
      select: { entityType: true },
      distinct: ["entityType"],
      orderBy: { entityType: "asc" },
    }),
  ]);

  const hasFilters = Boolean(filters.actor || filters.action || filters.entityType || filters.from || filters.to);
  const exportHref = buildExportQuery(filters);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Auditoria administrativa</h1>
          <p className="mt-1 text-sm text-gray-500">
            Últimas ações críticas executadas no backoffice para apoio operacional e rastreabilidade.
          </p>
        </div>
        <a
          href={exportHref}
          className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
        >
          Exportar CSV
        </a>
      </div>

      <form className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-5">
        <input
          type="text"
          name="actor"
          defaultValue={filters.actor || ""}
          placeholder="Operador ou e-mail"
          className="h-11 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-gray-900"
        />
        <select
          name="action"
          defaultValue={filters.action || ""}
          className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-gray-900"
        >
          <option value="">Todas as ações</option>
          {actions.map((item) => (
            <option key={item.action} value={item.action}>{item.action}</option>
          ))}
        </select>
        <select
          name="entityType"
          defaultValue={filters.entityType || ""}
          className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-gray-900"
        >
          <option value="">Todas as entidades</option>
          {entityTypes.map((item) => (
            <option key={item.entityType} value={item.entityType}>{item.entityType}</option>
          ))}
        </select>
        <input
          type="date"
          name="from"
          defaultValue={filters.from || ""}
          className="h-11 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-gray-900"
        />
        <div className="flex gap-3">
          <input
            type="date"
            name="to"
            defaultValue={filters.to || ""}
            className="h-11 min-w-0 flex-1 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-gray-900"
          />
          <button className="rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-800">
            Filtrar
          </button>
        </div>
      </form>

      {hasFilters ? (
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>Filtros ativos</span>
          <a href="/admin/audit-logs" className="font-semibold text-gray-900 hover:text-gray-700">
            Limpar filtros
          </a>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {entitySummary.map((item) => (
          <div key={item.entityType} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{item.entityType}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{item._count._all}</p>
            <p className="text-xs text-gray-500">eventos recentes</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-4 font-medium">Quando</th>
              <th className="p-4 font-medium">Operador</th>
              <th className="p-4 font-medium">Ação</th>
              <th className="p-4 font-medium">Entidade</th>
              <th className="p-4 font-medium">Resumo</th>
              <th className="p-4 font-medium">Detalhes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-gray-500">
                  Nenhum evento de auditoria registrado até o momento.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="align-top hover:bg-gray-50/60">
                  <td className="p-4 text-gray-600">
                    {new Date(log.createdAt).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{log.actorName}</div>
                    <div className="text-xs text-gray-500">{log.actorRole || "sem perfil"}</div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-gray-700">
                    <div className="font-medium">{log.entityType}</div>
                    <div className="font-mono text-xs text-gray-500">{log.entityId || "—"}</div>
                  </td>
                  <td className="p-4 text-gray-900">{log.summary}</td>
                  <td className="p-4 text-xs text-gray-500">{formatAuditMetadata(log.metadata)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}