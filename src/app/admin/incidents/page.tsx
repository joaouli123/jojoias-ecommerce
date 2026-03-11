import { reopenSystemEvent, resolveSystemEvent } from "@/actions/system-events";
import { hasAdminPermission } from "@/lib/admin-permissions";
import { requireAdminPagePermission } from "@/lib/admin-auth";
import { buildSystemEventWhere, formatSystemEventPayload, type SystemEventFilters } from "@/lib/system-events";
import { prisma } from "@/lib/prisma";

function buildExportQuery(filters: SystemEventFilters) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }

  const query = params.toString();
  return query ? `/admin/incidents/export?${query}` : "/admin/incidents/export";
}

export default async function AdminIncidentsPage({
  searchParams,
}: {
  searchParams: Promise<SystemEventFilters>;
}) {
  const session = { user: await requireAdminPagePermission("reports:view") };

  const filters = await searchParams;
  const where = buildSystemEventWhere(filters);
  const canManage = hasAdminPermission(session.user.role, "reports:manage");
  const exportHref = buildExportQuery(filters);

  const [incidents, sources] = await Promise.all([
    prisma.systemEventLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.systemEventLog.findMany({
      select: { source: true },
      distinct: ["source"],
      orderBy: { source: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Incidentes do sistema</h1>
          <p className="mt-1 text-sm text-gray-500">
            Painel operacional para acompanhar falhas recentes de checkout, frete, e-mail e webhooks.
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
        <select
          name="level"
          defaultValue={filters.level || ""}
          className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-gray-900"
        >
          <option value="">Todos os níveis</option>
          <option value="ERROR">ERROR</option>
          <option value="WARNING">WARNING</option>
          <option value="INFO">INFO</option>
        </select>
        <select
          name="source"
          defaultValue={filters.source || ""}
          className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-gray-900"
        >
          <option value="">Todas as origens</option>
          {sources.map((item) => (
            <option key={item.source} value={item.source}>{item.source}</option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={filters.status || ""}
          className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-gray-900"
        >
          <option value="">Todos os status</option>
          <option value="OPEN">OPEN</option>
          <option value="RESOLVED">RESOLVED</option>
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
          <button className="rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-800">Filtrar</button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-4 font-medium">Quando</th>
              <th className="p-4 font-medium">Nível</th>
              <th className="p-4 font-medium">Origem</th>
              <th className="p-4 font-medium">Evento</th>
              <th className="p-4 font-medium">Mensagem</th>
              <th className="p-4 font-medium">Contexto</th>
              <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Alerta externo</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {incidents.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-10 text-center text-gray-500">Nenhum incidente encontrado com os filtros atuais.</td>
              </tr>
            ) : (
              incidents.map((incident) => (
                <tr key={incident.id} className="align-top hover:bg-gray-50/60">
                  <td className="p-4 text-gray-600">
                    {new Date(incident.createdAt).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${incident.level === "ERROR" ? "bg-red-100 text-red-700" : incident.level === "WARNING" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                      {incident.level}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-gray-900">{incident.source}</td>
                  <td className="p-4 font-mono text-xs text-gray-500">{incident.eventCode}</td>
                  <td className="p-4 text-gray-900">{incident.message}</td>
                  <td className="p-4 text-xs text-gray-500">{formatSystemEventPayload(incident.payload)}</td>
                  <td className="p-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${incident.status === "RESOLVED" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-700"}`}>
                      {incident.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-gray-500">
                    {incident.alertSentAt ? (
                      <div>
                        <p className="font-medium text-emerald-700">Enviado</p>
                        <p>{new Date(incident.alertSentAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    ) : incident.alertError ? (
                      <div>
                        <p className="font-medium text-red-700">Falhou</p>
                        <p className="line-clamp-2">{incident.alertError}</p>
                      </div>
                    ) : (
                      "Não enviado"
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {canManage ? (
                      incident.status === "OPEN" ? (
                        <form action={resolveSystemEvent}>
                          <input type="hidden" name="id" value={incident.id} />
                          <button className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
                            Resolver
                          </button>
                        </form>
                      ) : (
                        <form action={reopenSystemEvent}>
                          <input type="hidden" name="id" value={incident.id} />
                          <button className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
                            Reabrir
                          </button>
                        </form>
                      )
                    ) : (
                      <span className="text-xs text-gray-400">Somente leitura</span>
                    )}
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