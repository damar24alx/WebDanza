import Link from "next/link";
import type { ReactNode } from "react";
import { LayoutDashboard, Plus, Search, Eye, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout";
import { Badge, Button, Card, CardContent, Input, Toast } from "@/components/ui";
import { requireAdminUser } from "@/server/auth/current-user";
import {
  AdminTaxonomySort,
  AdminTaxonomyStatusFilter,
  listAdminSubstyles,
} from "@/server/db/admin-taxonomy";
import { getStylesCatalogWithOptions } from "@/server/db/catalog";
import { buildAdminHref } from "../_helpers";

type SubstylesSearchParams = Promise<{
  q?: string;
  status?: string;
  sort?: string;
  style?: string;
  success?: string;
  error?: string;
}>;

const statusFilterValues: AdminTaxonomyStatusFilter[] = [
  "all",
  "draft",
  "review",
  "ready",
  "published",
];
const sortValues: AdminTaxonomySort[] = ["name", "status", "updated"];

function isStatusFilter(value: string): value is AdminTaxonomyStatusFilter {
  return statusFilterValues.includes(value as AdminTaxonomyStatusFilter);
}

function isTaxonomySort(value: string): value is AdminTaxonomySort {
  return sortValues.includes(value as AdminTaxonomySort);
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

export default async function AdminSubstylesPage({
  searchParams,
}: {
  searchParams: SubstylesSearchParams;
}) {
  await requireAdminUser();
  const params = await searchParams;
  const role = "ADMIN" as const;
  const query = (params.q ?? "").trim();
  const selectedStatus = isStatusFilter((params.status ?? "all").toLowerCase())
    ? ((params.status ?? "all").toLowerCase() as AdminTaxonomyStatusFilter)
    : "all";
  const selectedSort = isTaxonomySort((params.sort ?? "name").toLowerCase())
    ? ((params.sort ?? "name").toLowerCase() as AdminTaxonomySort)
    : "name";
  const selectedStyle = (params.style ?? "").trim();

  const [rows, styles] = await Promise.all([
    listAdminSubstyles({
      query,
      status: selectedStatus,
      sort: selectedSort,
      styleSlug: selectedStyle || undefined,
    }),
    getStylesCatalogWithOptions({ includeUnpublished: true }),
  ]);

  const redirectTo = buildAdminHref("/admin/substyles", role, {
    q: query || undefined,
    status: selectedStatus !== "all" ? selectedStatus : undefined,
    sort: selectedSort !== "name" ? selectedSort : undefined,
    style: selectedStyle || undefined,
  });

  return (
    <AppShell fullWidth hideFooter className="max-w-[1500px]">
      <div className="mx-auto flex w-full max-w-[1450px] gap-6">
        <aside className="hidden w-64 shrink-0 rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-4 lg:block">
          <h1 className="mb-2 text-lg font-bold text-white">Dance Admin</h1>
          <p className="mb-5 text-xs text-[var(--text-3)]">
            Rol activo: <span className="font-semibold text-[var(--text-2)]">{role}</span> (Control total)
          </p>
          <nav className="space-y-2 text-sm">
            <MenuItem label="Dashboard" icon={<LayoutDashboard size={15} />} muted />
            <MenuItem label="Moves Management" href={buildAdminHref("/admin", role)} />
            <MenuItem label="Content Review" href={buildAdminHref("/admin/review", role)} />
            <MenuItem label="Styles" href={buildAdminHref("/admin/styles", role)} />
            <MenuItem label="Substyles" href={buildAdminHref("/admin/substyles", role)} active />
            <MenuItem label="Sources" muted />
          </nav>
        </aside>

        <section className="min-w-0 flex-1 space-y-6">
          <header className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6">
            <h2 className="text-3xl font-bold text-white">Substyles Management</h2>
            <p className="mt-1 text-sm text-[var(--text-2)]">
              Altas, ediciones y estado editorial para substyles con guardrails de citation/placeholders.
            </p>
            <form action="/admin/substyles" className="mt-4 grid gap-3 md:grid-cols-[1fr,160px,160px,200px,auto,auto]">
              <Input
                icon={<Search size={16} />}
                placeholder="Buscar substyle por nombre o slug"
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
                <option value="status">Sort: Status</option>
                <option value="updated">Sort: Updated</option>
              </select>
              <select
                name="style"
                defaultValue={selectedStyle}
                className="h-10 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-2)]"
              >
                <option value="">All styles</option>
                {styles.map((style) => (
                  <option key={style.slug} value={style.slug}>
                    {style.name}
                  </option>
                ))}
              </select>
              <Button type="submit">Apply</Button>
              <Link href={buildAdminHref("/admin/substyles", role)}>
                <Button variant="ghost" type="button" className="w-full">
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
            <CardContent>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <Plus size={16} />
                Nuevo Substyle
              </h3>
              <form action="/api/admin/substyles/create" method="post" className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <select
                  name="styleSlug"
                  required
                  className="h-11 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-2)]"
                >
                  <option value="">Style base (obligatorio)</option>
                  {styles.map((style) => (
                    <option key={style.slug} value={style.slug}>
                      {style.name}
                    </option>
                  ))}
                </select>
                <Field name="name" placeholder="Nombre (obligatorio)" required />
                <Field name="slug" placeholder="Slug (opcional, auto si vacio)" />
                <Field name="summary" placeholder="Resumen (obligatorio)" required className="xl:col-span-2" />
                <Field name="musicalFocus" placeholder="Musical focus (opcional)" />
                <Field name="historicalCulturalContext" placeholder="Historical context (opcional)" className="xl:col-span-2" />
                <TextAreaField
                  name="technicalFocus"
                  placeholder="Technical focus (1 linea por item)"
                  className="xl:col-span-4"
                />
                <div className="xl:col-span-4">
                  <Button type="submit">Crear Substyle</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[1000px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--border-1)] text-xs uppercase tracking-[0.08em] text-[var(--text-3)]">
                    <th className="py-3">Name</th>
                    <th className="py-3">Slug</th>
                    <th className="py-3">Style</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">Citations</th>
                    <th className="py-3">Guardrails</th>
                    <th className="py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((substyle) => (
                    <tr key={substyle.slug} className="border-b border-[var(--border-1)] text-sm">
                      <td className="py-3 font-semibold text-white">{substyle.name}</td>
                      <td className="py-3 text-[var(--text-2)]">{substyle.slug}</td>
                      <td className="py-3 text-[var(--text-2)]">{substyle.styleSlug}</td>
                      <td className="py-3">
                        <Badge variant={statusBadgeVariant(substyle.status)}>{substyle.status}</Badge>
                      </td>
                      <td className="py-3 text-[var(--text-2)]">{substyle.citationCount}</td>
                      <td className="py-3">
                        {substyle.hasPlaceholder ? (
                          <Badge variant="warning">PLACEHOLDER detectado</Badge>
                        ) : (
                          <Badge variant="success">Sin placeholder</Badge>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={buildAdminHref(`/admin/substyles/${substyle.slug}`, role)}>
                            <Button size="sm" variant="outline" type="button" leftIcon={<Eye size={14} />}>
                              Editar
                            </Button>
                          </Link>
                          <form action="/api/admin/substyles/status" method="post" className="flex items-center gap-2">
                            <input type="hidden" name="slug" value={substyle.slug} />
                            <input type="hidden" name="redirectTo" value={redirectTo} />
                            <select
                              name="targetStatus"
                              defaultValue={substyle.status}
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
                          <form action="/api/admin/substyles/archive" method="post">
                            <input type="hidden" name="slug" value={substyle.slug} />
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
                        No hay substyles para los filtros aplicados.
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

function Field({
  name,
  placeholder,
  required,
  className,
}: {
  name: string;
  placeholder: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <Input name={name} placeholder={placeholder} required={required} />
    </div>
  );
}

function TextAreaField({
  name,
  placeholder,
  className,
}: {
  name: string;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <textarea
        name={name}
        rows={3}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]"
      />
    </div>
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
