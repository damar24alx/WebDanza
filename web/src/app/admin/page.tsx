import Link from "next/link";
import type { ReactNode } from "react";
import { BarChart3, Eye, LayoutDashboard, Plus, Search, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout";
import { Badge, Button, Card, CardContent, Input, Toast } from "@/components/ui";
import { requireAdminUser } from "@/server/auth/current-user";
import {
  AdminMoveSort,
  AdminMoveStatusFilter,
  listAdminMoves,
} from "@/server/db/admin-moves";
import { buildAdminHref } from "./_helpers";

type AdminSearchParams = Promise<{
  q?: string;
  status?: string;
  sort?: string;
  success?: string;
  error?: string;
}>;

const statusFilterValues: AdminMoveStatusFilter[] = [
  "all",
  "draft",
  "review",
  "ready",
  "published",
];
const sortValues: AdminMoveSort[] = ["name", "difficulty", "status", "updated"];

function isStatusFilter(value: string): value is AdminMoveStatusFilter {
  return statusFilterValues.includes(value as AdminMoveStatusFilter);
}

function isMoveSort(value: string): value is AdminMoveSort {
  return sortValues.includes(value as AdminMoveSort);
}

function statusBadgeVariant(status: "draft" | "review" | "ready" | "published") {
  if (status === "published") {
    return "primary";
  }
  if (status === "ready") {
    return "success";
  }
  if (status === "review") {
    return "warning";
  }

  return "neutral";
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: AdminSearchParams;
}) {
  await requireAdminUser();
  const params = await searchParams;
  const role = "ADMIN" as const;
  const query = (params.q ?? "").trim().toLowerCase();
  const rawStatus = (params.status ?? "all").toLowerCase();
  const rawSort = (params.sort ?? "name").toLowerCase();
  const selectedStatus = isStatusFilter(rawStatus) ? rawStatus : "all";
  const selectedSort = isMoveSort(rawSort) ? rawSort : "name";

  const rows = await listAdminMoves({
    query,
    status: selectedStatus,
    sort: selectedSort,
  });

  const currentFilterParams = new URLSearchParams();
  if (query) {
    currentFilterParams.set("q", query);
  }
  if (selectedStatus !== "all") {
    currentFilterParams.set("status", selectedStatus);
  }
  if (selectedSort !== "name") {
    currentFilterParams.set("sort", selectedSort);
  }
  const redirectTo = currentFilterParams.toString()
    ? `/admin?${currentFilterParams.toString()}`
    : "/admin";

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
            <MenuItem label="Gestion de moves" href={buildAdminHref("/admin", role)} active />
            <MenuItem label="Revision de contenido" href={buildAdminHref("/admin/review", role)} />
            <MenuItem label="KPIs MVP" href={buildAdminHref("/admin/kpis", role)} />
            <MenuItem label="Certificados" href={buildAdminHref("/admin/certificates", role)} />
            <MenuItem label="Styles" href={buildAdminHref("/admin/styles", role)} />
            <MenuItem label="Substyles" href={buildAdminHref("/admin/substyles", role)} />
            <MenuItem label="Sources" muted />
          </nav>
        </aside>

        <section className="min-w-0 flex-1 space-y-6">
          <header className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-3xl font-bold text-white">Gestion de moves</h2>
              <Link href={buildAdminHref("/admin/kpis", role)}>
                <Button type="button" variant="outline" leftIcon={<BarChart3 size={15} />}>
                  Ver KPIs
                </Button>
              </Link>
            </div>
            <p className="mt-1 text-sm text-[var(--text-2)]">
              Administra estados editoriales draft/review/ready/published con guardrails y permisos por rol.
            </p>
            <form action="/admin" className="mt-4 grid gap-3 md:grid-cols-[1fr,170px,170px,auto,auto]">
              <Input
                icon={<Search size={16} />}
                placeholder="Buscar move por nombre o slug"
                name="q"
                defaultValue={params.q}
              />
              <select
                name="status"
                defaultValue={selectedStatus}
                className="h-10 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-2)]"
              >
                <option value="all">All status</option>
                <option value="draft">Draft</option>
                <option value="review">Review</option>
                <option value="ready">Ready</option>
                <option value="published">Published</option>
              </select>
              <select
                name="sort"
                defaultValue={selectedSort}
                className="h-10 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-2)]"
              >
                <option value="name">Sort: Name</option>
                <option value="difficulty">Sort: Difficulty</option>
                <option value="status">Sort: Status</option>
                <option value="updated">Sort: Updated</option>
              </select>
              <Button type="submit">Apply</Button>
              <Link href={buildAdminHref("/admin", role)}>
                <Button variant="ghost" type="button" className="w-full">
                  Limpiar
                </Button>
              </Link>
            </form>
            {params.success ? (
              <Toast
                className="mt-4"
                variant="success"
                title="Operacion completada"
                message={params.success}
              />
            ) : null}
            {params.error ? (
              <Toast
                className="mt-4"
                variant="error"
                title="Operacion bloqueada"
                message={params.error}
              />
            ) : null}
          </header>

          <Card>
            <CardContent>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <Plus size={16} />
                Nuevo Move
              </h3>
              <form
                action="/api/admin/moves/create"
                method="post"
                className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
              >
                <div className="xl:col-span-2">
                  <Input name="name" placeholder="Nombre (obligatorio)" required />
                </div>
                <Input name="slug" placeholder="Slug (opcional, auto si vacio)" />
                <Input name="moveType" placeholder="Move type (obligatorio)" required />
                <div className="xl:col-span-2">
                  <Input name="summary" placeholder="Resumen (obligatorio)" required />
                </div>
                <select
                  name="difficulty"
                  defaultValue="beginner"
                  className="h-11 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-2)]"
                >
                  <option value="beginner">beginner</option>
                  <option value="intermediate">intermediate</option>
                  <option value="advanced">advanced</option>
                </select>
                <Input name="family" placeholder="Familia (opcional)" />
                <Input name="bpmRange" placeholder="BPM range (opcional)" />
                <div className="xl:col-span-4">
                  <Button type="submit">Crear Move</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3 className="mb-4 text-lg font-semibold text-white">Vincular citation (lesson/course/connection)</h3>
              <form
                action="/api/admin/citations/link"
                method="post"
                className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
              >
                <input type="hidden" name="redirectTo" value={redirectTo} />
                <select
                  name="entityType"
                  defaultValue="lesson"
                  className="h-11 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-2)]"
                >
                  <option value="lesson">lesson</option>
                  <option value="course">course</option>
                  <option value="connection">connection</option>
                </select>
                <Input
                  name="entityRef"
                  placeholder="entityRef (slug o id; connection usa id)"
                  required
                />
                <Input name="title" placeholder="Titulo (obligatorio)" required />
                <Input name="url" placeholder="URL (opcional)" />
                <Input name="author" placeholder="Autor (opcional)" />
                <Input name="year" placeholder="Ano YYYY (opcional)" />
                <div className="md:col-span-2 xl:col-span-4">
                  <Button type="submit">Vincular citation</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[1080px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--border-1)] text-xs uppercase tracking-[0.08em] text-[var(--text-3)]">
                    <th className="py-3">Name</th>
                    <th className="py-3">Slug</th>
                    <th className="py-3">Difficulty</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">Citations</th>
                    <th className="py-3">Guardrails</th>
                    <th className="py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((move) => (
                    <tr key={move.slug} className="border-b border-[var(--border-1)] text-sm">
                      <td className="py-3 font-semibold text-white">{move.name}</td>
                      <td className="py-3 text-[var(--text-2)]">{move.slug}</td>
                      <td className="py-3 text-[var(--text-2)]">{move.difficulty}</td>
                      <td className="py-3">
                        <Badge variant={statusBadgeVariant(move.status)}>{move.status}</Badge>
                      </td>
                      <td className="py-3 text-[var(--text-2)]">{move.citationCount}</td>
                      <td className="py-3">
                        {move.hasPlaceholder ? (
                          <Badge variant="warning">PLACEHOLDER detectado</Badge>
                        ) : (
                          <Badge variant="success">Sin placeholder</Badge>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={buildAdminHref("/admin/review", role, {
                              item: move.slug,
                              tab: "breakdown",
                            })}
                          >
                            <Button size="sm" variant="outline" leftIcon={<Eye size={14} />} type="button">
                              Revisar
                            </Button>
                          </Link>
                          <form action="/api/admin/moves/status" method="post" className="flex items-center gap-2">
                            <input type="hidden" name="slug" value={move.slug} />
                            <input type="hidden" name="redirectTo" value={redirectTo} />
                            <select
                              name="targetStatus"
                              defaultValue={move.status}
                              className="h-9 rounded-lg border border-[var(--border-1)] bg-[var(--surface-2)] px-2 text-xs text-[var(--text-2)]"
                            >
                              <option value="draft">draft</option>
                              <option value="review">review</option>
                              <option value="ready">ready</option>
                              <option value="published">published</option>
                            </select>
                            <Button size="sm" variant="ghost" type="submit">
                              Mover
                            </Button>
                          </form>
                          <form action="/api/admin/moves/archive" method="post">
                            <input type="hidden" name="slug" value={move.slug} />
                            <input type="hidden" name="redirectTo" value={redirectTo} />
                            <Button size="sm" variant="danger" type="submit" leftIcon={<Trash2 size={14} />}>
                              Archivar
                            </Button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-sm text-[var(--text-3)]">
                        No hay moves para los filtros aplicados.
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

