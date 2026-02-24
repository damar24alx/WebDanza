import Link from "next/link";
import type { ReactNode } from "react";
import { LayoutDashboard, RefreshCcw, Search, ShieldX } from "lucide-react";
import { AppShell } from "@/components/layout";
import { Badge, Button, Card, CardContent, Input, Toast } from "@/components/ui";
import { requireAdminUser } from "@/server/auth/current-user";
import { listAdminCertificates } from "@/server/db/admin-certificates";
import { buildAdminHref } from "../_helpers";

type AdminCertificatesSearchParams = Promise<{
  q?: string;
  success?: string;
  error?: string;
}>;

export default async function AdminCertificatesPage({
  searchParams,
}: {
  searchParams: AdminCertificatesSearchParams;
}) {
  await requireAdminUser();
  const params = await searchParams;
  const role = "ADMIN" as const;
  const query = (params.q ?? "").trim();
  const rows = await listAdminCertificates(query);
  const redirectTo = query ? `/admin/certificates?q=${encodeURIComponent(query)}` : "/admin/certificates";

  return (
    <AppShell fullWidth hideFooter className="max-w-[1500px]">
      <div className="mx-auto flex w-full max-w-[1450px] gap-6">
        <aside className="hidden w-64 shrink-0 rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-4 lg:block">
          <h1 className="mb-2 text-lg font-bold text-white">Panel Admin</h1>
          <p className="mb-5 text-xs text-[var(--text-3)]">
            Rol activo: <span className="font-semibold text-[var(--text-2)]">{role}</span> (Control total)
          </p>
          <nav className="space-y-2 text-sm">
            <MenuItem label="Panel" icon={<LayoutDashboard size={15} />} muted />
            <MenuItem label="Gestion de moves" href={buildAdminHref("/admin", role)} />
            <MenuItem label="Revision de contenido" href={buildAdminHref("/admin/review", role)} />
            <MenuItem label="KPIs MVP" href={buildAdminHref("/admin/kpis", role)} />
            <MenuItem label="Certificados" href={buildAdminHref("/admin/certificates", role)} active />
            <MenuItem label="Styles" href={buildAdminHref("/admin/styles", role)} />
            <MenuItem label="Substyles" href={buildAdminHref("/admin/substyles", role)} />
          </nav>
        </aside>

        <section className="min-w-0 flex-1 space-y-6">
          <header className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6">
            <h2 className="text-3xl font-bold text-white">Gestion de certificados</h2>
            <p className="mt-1 text-sm text-[var(--text-2)]">
              Reemite o revoca certificados y mantén trazabilidad administrativa.
            </p>

            <form action="/admin/certificates" className="mt-4 grid gap-3 md:grid-cols-[1fr,auto,auto]">
              <Input
                icon={<Search size={16} />}
                placeholder="Buscar por codigo, estudiante o curso"
                name="q"
                defaultValue={query}
              />
              <Button type="submit">Buscar</Button>
              <Link href="/admin/certificates">
                <Button type="button" variant="ghost" className="w-full">
                  Limpiar
                </Button>
              </Link>
            </form>

            {params.success ? (
              <Toast className="mt-4" variant="success" title="Operacion completada" message={params.success} />
            ) : null}
            {params.error ? (
              <Toast className="mt-4" variant="error" title="Operacion bloqueada" message={params.error} />
            ) : null}
          </header>

          <Card>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[1080px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--border-1)] text-xs uppercase tracking-[0.08em] text-[var(--text-3)]">
                    <th className="py-3">Codigo</th>
                    <th className="py-3">Estado</th>
                    <th className="py-3">Estudiante</th>
                    <th className="py-3">Curso</th>
                    <th className="py-3">Emision</th>
                    <th className="py-3">Revocado</th>
                    <th className="py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-[var(--border-1)] text-sm">
                      <td className="py-3 font-semibold text-white">{row.code}</td>
                      <td className="py-3">
                        <Badge variant={row.status === "active" ? "success" : "danger"}>
                          {translateCertificateStatus(row.status)}
                        </Badge>
                      </td>
                      <td className="py-3 text-[var(--text-2)]">
                        {row.studentName}
                        <p className="text-xs text-[var(--text-3)]">{row.studentEmail}</p>
                      </td>
                      <td className="py-3 text-[var(--text-2)]">{row.courseTitle}</td>
                      <td className="py-3 text-[var(--text-2)]">{row.issuedAt.toISOString().slice(0, 10)}</td>
                      <td className="py-3 text-[var(--text-2)]">
                        {row.revokedAt ? row.revokedAt.toISOString().slice(0, 10) : "N/A"}
                        {row.revokedReason ? (
                          <p className="text-xs text-[var(--text-3)]">{row.revokedReason}</p>
                        ) : null}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          <form action="/api/admin/certificates/reissue" method="post">
                            <input type="hidden" name="code" value={row.code} />
                            <input type="hidden" name="redirectTo" value={redirectTo} />
                            <Button size="sm" variant="outline" type="submit" leftIcon={<RefreshCcw size={14} />}>
                              Reemitir
                            </Button>
                          </form>
                          {row.status === "active" ? (
                            <form action="/api/admin/certificates/revoke" method="post">
                              <input type="hidden" name="code" value={row.code} />
                              <input type="hidden" name="redirectTo" value={redirectTo} />
                              <Button size="sm" variant="danger" type="submit" leftIcon={<ShieldX size={14} />}>
                                Revocar
                              </Button>
                            </form>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-sm text-[var(--text-3)]">
                        No hay certificados para los filtros aplicados.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}

function MenuItem({
  label,
  href,
  active,
  muted,
  icon,
}: {
  label: string;
  href?: string;
  active?: boolean;
  muted?: boolean;
  icon?: ReactNode;
}) {
  const cls = `flex items-center gap-2 rounded-lg px-3 py-2 ${
    active
      ? "bg-[var(--color-primary)]/15 text-[var(--color-primary-soft)]"
      : muted
        ? "text-[var(--text-3)]"
        : "text-[var(--text-2)] hover:bg-white/5 hover:text-[var(--text-1)]"
  }`;

  if (href && !muted) {
    return (
      <Link href={href} className={cls}>
        {icon}
        {label}
      </Link>
    );
  }

  return (
    <div className={cls}>
      {icon}
      {label}
    </div>
  );
}

function translateCertificateStatus(status: "active" | "revoked") {
  if (status === "active") {
    return "activo";
  }

  return "revocado";
}
