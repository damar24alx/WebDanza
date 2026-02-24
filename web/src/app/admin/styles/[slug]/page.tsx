import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AlertTriangle, LayoutDashboard, ShieldCheck, Trash2 } from "lucide-react";
import { AdminMediaManager } from "@/components/admin/AdminMediaManager";
import { AppShell } from "@/components/layout";
import { Badge, Button, Card, CardContent, Toast } from "@/components/ui";
import { requireAdminUser } from "@/server/auth/current-user";
import { listAdminMediaLinksByEntity } from "@/server/db/admin-media";
import { getAdminStyleDetailBySlug } from "@/server/db/admin-taxonomy";
import { buildAdminHref } from "../../_helpers";

type StyleDetailSearchParams = Promise<{
  success?: string;
  error?: string;
}>;

export default async function AdminStyleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: StyleDetailSearchParams;
}) {
  await requireAdminUser();
  const { slug } = await params;
  const query = await searchParams;
  const role = "ADMIN" as const;
  const [detail, mediaLinks] = await Promise.all([
    getAdminStyleDetailBySlug(slug),
    listAdminMediaLinksByEntity({
      entityType: "style",
      entityRef: slug,
    }),
  ]);

  if (!detail) {
    notFound();
  }

  const redirectTo = buildAdminHref(`/admin/styles/${detail.style.slug}`, role);

  return (
    <AppShell fullWidth hideFooter className="max-w-[1500px]">
      <div className="mx-auto flex w-full max-w-[1450px] gap-6">
        <aside className="hidden w-64 shrink-0 rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-4 lg:block">
          <h1 className="mb-5 text-lg font-bold text-white">Dance Admin</h1>
          <nav className="space-y-2 text-sm">
            <MenuItem label="Dashboard" icon={<LayoutDashboard size={15} />} muted />
            <MenuItem label="Moves" href={buildAdminHref("/admin", role)} />
            <MenuItem label="Styles" href={buildAdminHref("/admin/styles", role)} active />
            <MenuItem label="Substyles" href={buildAdminHref("/admin/substyles", role)} />
          </nav>
        </aside>

        <section className="min-w-0 flex-1 space-y-6">
          <header className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-3xl font-bold text-white">Editar Style</h2>
                <p className="mt-1 text-sm text-[var(--text-2)]">{detail.style.slug}</p>
              </div>
              <Badge variant={detail.style.status === "published" ? "primary" : detail.style.status === "ready" ? "success" : detail.style.status === "review" ? "warning" : "neutral"}>
                {detail.style.status}
              </Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="primary">ADMIN</Badge>
            </div>
            {query.success ? <Toast className="mt-4" variant="success" title="Operacion completada" message={query.success} /> : null}
            {query.error ? <Toast className="mt-4" variant="error" title="Operacion bloqueada" message={query.error} /> : null}
          </header>

          <Card>
            <CardContent>
              <h3 className="mb-4 text-lg font-semibold text-white">Campos editables</h3>
              <form action="/api/admin/styles/update" method="post" className="grid gap-3 md:grid-cols-2">
                <input type="hidden" name="slug" value={detail.style.slug} />
                <input type="hidden" name="redirectTo" value={redirectTo} />
                <Field name="name" label="Nombre" defaultValue={detail.style.name} required />
                <Field name="categoryPrimary" label="Categoria" defaultValue={detail.style.categoryPrimary} required />
                <Field name="summary" label="Resumen" defaultValue={detail.style.summary} required className="md:col-span-2" />
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-[var(--text-3)]">Level</label>
                  <select
                    name="level"
                    defaultValue={detail.style.level}
                    className="h-10 w-full rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-2)]"
                  >
                    <option value="beginner">beginner</option>
                    <option value="intermediate">intermediate</option>
                    <option value="advanced">advanced</option>
                  </select>
                </div>
                <Field name="musicalityBasics" label="Musicality" defaultValue={detail.style.musicalityBasics} />
                <TextAreaField
                  name="historicalCulturalContext"
                  label="Historical/Cultural Context"
                  defaultValue={detail.style.historicalCulturalContext}
                  className="md:col-span-2"
                />
                <TextAreaField
                  name="movementPrinciples"
                  label="Movement principles (1 linea por item)"
                  defaultValue={detail.style.movementPrinciples.join("\n")}
                  className="md:col-span-2"
                />
                <div className="md:col-span-2">
                  <Button type="submit">Guardar cambios</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardContent>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.1em] text-[var(--text-3)]">Estado editorial</h3>
                <div className="grid gap-2">
                  <StatusActionButton slug={detail.style.slug} redirectTo={redirectTo} targetStatus="draft" label="Mover a draft" />
                  <StatusActionButton slug={detail.style.slug} redirectTo={redirectTo} targetStatus="review" label="Mover a review" />
                  <StatusActionButton slug={detail.style.slug} redirectTo={redirectTo} targetStatus="ready" label="Mover a ready" />
                  <StatusActionButton slug={detail.style.slug} redirectTo={redirectTo} targetStatus="published" label="Publicar" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.1em] text-[var(--text-3)]">Agregar citation</h3>
                <form action="/api/admin/styles/citation" method="post" className="space-y-2">
                  <input type="hidden" name="slug" value={detail.style.slug} />
                  <input type="hidden" name="redirectTo" value={redirectTo} />
                  <input name="title" required placeholder="Titulo" className="h-10 w-full rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-1)]" />
                  <input name="url" placeholder="URL" className="h-10 w-full rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-1)]" />
                  <div className="grid grid-cols-2 gap-2">
                    <input name="author" placeholder="Autor" className="h-10 w-full rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-1)]" />
                    <input name="year" placeholder="Ano" className="h-10 w-full rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-1)]" />
                  </div>
                  <Button size="sm" className="w-full" type="submit">Vincular citation</Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <AdminMediaManager
            entityType="style"
            entityRef={detail.style.slug}
            redirectTo={redirectTo}
            links={mediaLinks}
            title="Media del style"
            description="Administra videos externos y rightsStatus del style."
          />

          <Card>
            <CardContent>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.1em] text-[var(--text-3)]">
                <ShieldCheck size={14} /> Policy gate
              </h3>
              <p className="text-sm text-[var(--text-2)]">
                {detail.canPublish ? "Listo para publicar." : "Publicacion bloqueada hasta cumplir todos los guardrails."}
              </p>
              {detail.issues.length > 0 ? (
                <ul className="mt-3 space-y-1 text-xs text-[var(--text-3)]">
                  {detail.issues.map((issue) => (
                    <li key={issue}>- {issue}</li>
                  ))}
                </ul>
              ) : null}
              {detail.citations.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {detail.citations.map((citation) => (
                    <div key={citation.id} className="rounded-xl border border-[var(--border-1)] p-3">
                      <p className="text-sm text-white">{citation.title}</p>
                      <p className="mt-1 text-xs text-[var(--text-3)]">
                        {citation.sourceType}
                        {citation.year ? ` · ${citation.year}` : ""}
                        {citation.author ? ` · ${citation.author}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <form action="/api/admin/styles/archive" method="post">
                <input type="hidden" name="slug" value={detail.style.slug} />
                <input type="hidden" name="redirectTo" value={buildAdminHref("/admin/styles", role)} />
                <Button type="submit" variant="danger" leftIcon={<Trash2 size={14} />}>
                  Archivar style
                </Button>
              </form>
            </CardContent>
          </Card>

          {!detail.canPublish ? (
            <Card className="border-amber-500/20 bg-amber-500/10">
              <CardContent className="flex items-center gap-3 text-sm text-amber-100">
                <AlertTriangle size={18} />
                El style aun no cumple guardrails para publicacion.
              </CardContent>
            </Card>
          ) : null}
        </section>
      </div>
    </AppShell>
  );
}

function Field({
  name,
  label,
  defaultValue,
  required,
  className,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-[var(--text-3)]">{label}</label>
      <input
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="h-10 w-full rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-1)]"
      />
    </div>
  );
}

function TextAreaField({
  name,
  label,
  defaultValue,
  className,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-[var(--text-3)]">{label}</label>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={4}
        className="w-full rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-1)]"
      />
    </div>
  );
}

function StatusActionButton({
  slug,
  redirectTo,
  targetStatus,
  label,
}: {
  slug: string;
  redirectTo: string;
  targetStatus: "draft" | "review" | "ready" | "published";
  label: string;
}) {
  return (
    <form action="/api/admin/styles/status" method="post">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="targetStatus" value={targetStatus} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <Button size="sm" variant={targetStatus === "published" ? "primary" : "outline"} className="w-full" type="submit">
        {label}
      </Button>
    </form>
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


