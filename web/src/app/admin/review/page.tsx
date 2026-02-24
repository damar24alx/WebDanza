import Link from "next/link";
import { CheckCircle2, ShieldCheck, XCircle, Trash2 } from "lucide-react";
import { AdminMediaManager } from "@/components/admin/AdminMediaManager";
import { AppShell, Sidebar } from "@/components/layout";
import { ErrorState } from "@/components/state/SystemStates";
import { Badge, Button, Card, CardContent, Tabs, Toast } from "@/components/ui";
import { requireAdminUser } from "@/server/auth/current-user";
import { listAdminMediaLinksByEntity } from "@/server/db/admin-media";
import { getAdminMoveReview, listAdminMoves } from "@/server/db/admin-moves";
import { buildAdminHref } from "../_helpers";

type ReviewSearchParams = Promise<{
  tab?: string;
  item?: string;
  success?: string;
  error?: string;
}>;

const tabs = [
  { label: "Step Breakdown", value: "breakdown" },
  { label: "Tags", value: "tags" },
  { label: "Sources", value: "sources" },
] as const;

function buildReviewHref({ tab, item, role }: { tab: string; item: string; role: "ADMIN" | "EDITOR" | "REVIEWER" }) {
  return buildAdminHref("/admin/review", role, {
    tab,
    item,
  });
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

export default async function AdminReviewPage({
  searchParams,
}: {
  searchParams: ReviewSearchParams;
}) {
  await requireAdminUser();
  const params = await searchParams;
  const role = "ADMIN" as const;
  const item = (params.item ?? "the-shuffle").trim() || "the-shuffle";
  const activeTab = tabs.some((tab) => tab.value === params.tab)
    ? (params.tab as (typeof tabs)[number]["value"])
    : "breakdown";

  const [review, pendingRows, publishedRows, readyRows, mediaLinks] = await Promise.all([
    getAdminMoveReview(item),
    listAdminMoves({ status: "review", sort: "updated" }),
    listAdminMoves({ status: "published", sort: "updated" }),
    listAdminMoves({ status: "ready", sort: "updated" }),
    listAdminMediaLinksByEntity({
      entityType: "move",
      entityRef: item,
    }),
  ]);

  if (!review) {
    return (
      <AppShell fullWidth hideFooter className="max-w-[1500px]">
        <div className="mx-auto w-full max-w-[1450px]">
          <ErrorState
            title="Move no encontrado"
            subtitle={`No existe un move con slug ${item} en la base de datos.`}
            buttonLabel="Volver a Admin"
            retryHref={buildAdminHref("/admin", role)}
          />
        </div>
      </AppShell>
    );
  }

  const tabsWithHref = tabs.map((tab) => ({
    ...tab,
    href: buildReviewHref({ tab: tab.value, item: review.move.slug, role }),
  }));

  const redirectTo = buildReviewHref({ tab: activeTab, item: review.move.slug, role });

  return (
    <AppShell fullWidth hideFooter className="max-w-[1500px]">
      <div className="mx-auto flex w-full max-w-[1450px] gap-6">
        <Sidebar
          title="Review Queue"
          className="sticky top-24 hidden h-fit lg:block"
          items={[
            {
              label: `Pending (${pendingRows.length})`,
              href: buildAdminHref("/admin", role, { status: "review", sort: "updated" }),
              active: review.move.status === "review",
            },
            {
              label: `Ready (${readyRows.length})`,
              href: buildAdminHref("/admin", role, { status: "ready", sort: "updated" }),
              active: review.move.status === "ready",
            },
            {
              label: `Published (${publishedRows.length})`,
              href: buildAdminHref("/admin", role, { status: "published", sort: "updated" }),
              active: review.move.status === "published",
            },
          ]}
        />

        <section className="grid min-w-0 flex-1 gap-6 xl:grid-cols-[1.25fr,390px]">
          <div className="space-y-6">
            <header className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusBadgeVariant(review.move.status)}>{review.move.status}</Badge>
                {review.canPublish ? <Badge variant="success">Ready to publish</Badge> : null}
              </div>
              <h1 className="mt-3 text-3xl font-bold text-white">{review.move.name}</h1>
              <p className="mt-1 text-sm text-[var(--text-2)]">
                Revision editorial del breakdown tecnico y consistencia de tags/sources.
              </p>
              <Tabs className="mt-5" activeValue={activeTab} items={tabsWithHref} />
            </header>

            {activeTab === "breakdown" ? (
              <Card>
                <CardContent>
                  <h2 className="mb-4 text-lg font-semibold text-white">Step Breakdown</h2>
                  {review.move.stepByStep.length > 0 ? (
                    <ol className="space-y-3">
                      {review.move.stepByStep.map((step, index) => (
                        <li
                          key={`${review.move.slug}-step-${index + 1}`}
                          className="rounded-xl border border-[var(--border-1)] px-4 py-3 text-sm text-[var(--text-2)]"
                        >
                          {index + 1}. {step}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="rounded-xl border border-[var(--border-1)] px-4 py-3 text-sm text-[var(--text-2)]">
                      Sin pasos cargados aun.
                    </p>
                  )}

                  <h3 className="mb-3 mt-6 text-sm font-bold uppercase tracking-[0.1em] text-[var(--text-3)]">
                    Common Mistakes
                  </h3>
                  {review.move.commonMistakes.length > 0 ? (
                    <div className="space-y-2">
                      {review.move.commonMistakes.map((mistake, index) => (
                        <div
                          key={`${review.move.slug}-mistake-${index + 1}`}
                          className="rounded-xl border border-[var(--border-1)] p-3"
                        >
                          <p className="text-sm font-semibold text-white">{mistake.issue}</p>
                          <p className="mt-1 text-sm text-[var(--text-2)]">{mistake.correction}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl border border-[var(--border-1)] px-4 py-3 text-sm text-[var(--text-2)]">
                      Sin errores comunes registrados.
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {activeTab === "tags" ? (
              <Card>
                <CardContent>
                  <h2 className="mb-4 text-lg font-semibold text-white">Editar Move</h2>
                  <form action="/api/admin/moves/update" method="post" className="space-y-3">
                    <input type="hidden" name="slug" value={review.move.slug} />
                    <input type="hidden" name="redirectTo" value={redirectTo} />
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="Nombre" name="name" defaultValue={review.move.name} required />
                      <Field label="Move Type" name="moveType" defaultValue={review.move.moveType} required />
                      <Field label="Summary" name="summary" defaultValue={review.move.summary} required className="md:col-span-2" />
                      <div>
                        <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-[var(--text-3)]">Difficulty</label>
                        <select
                          name="difficulty"
                          defaultValue={review.move.difficulty}
                          className="h-10 w-full rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-2)]"
                        >
                          <option value="beginner">beginner</option>
                          <option value="intermediate">intermediate</option>
                          <option value="advanced">advanced</option>
                        </select>
                      </div>
                      <Field label="Family" name="family" defaultValue={review.move.family === "N/A" ? "" : review.move.family} />
                      <Field label="BPM Range" name="bpmRange" defaultValue={review.move.bpmRange === "N/A" ? "" : review.move.bpmRange} />
                      <TextAreaField
                        label="Step by Step (1 linea por paso)"
                        name="stepByStep"
                        defaultValue={review.move.stepByStep.join("\n")}
                        className="md:col-span-2"
                      />
                      <TextAreaField
                        label="Common Mistakes (formato: issue | correction)"
                        name="commonMistakes"
                        defaultValue={review.move.commonMistakes.map((item) => `${item.issue} | ${item.correction}`).join("\n")}
                        className="md:col-span-2"
                      />
                    </div>
                    <Button type="submit">Guardar cambios</Button>
                  </form>
                </CardContent>
              </Card>
            ) : null}

            {activeTab === "sources" ? (
              <Card>
                <CardContent>
                  <h2 className="mb-4 text-lg font-semibold text-white">Sources vinculadas</h2>
                  {review.citations.length > 0 ? (
                    <div className="space-y-3">
                      {review.citations.map((citation) => (
                        <div key={citation.id} className="rounded-xl border border-[var(--border-1)] p-3">
                          <p className="text-sm font-semibold text-white">{citation.title}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.08em] text-[var(--text-3)]">
                            {citation.sourceType}
                            {citation.year ? ` · ${citation.year}` : ""}
                            {citation.author ? ` · ${citation.author}` : ""}
                          </p>
                          {citation.url ? (
                            <Link
                              href={citation.url}
                              target="_blank"
                              className="mt-2 inline-block text-xs text-[var(--color-primary-soft)]"
                            >
                              {citation.url}
                            </Link>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl border border-[var(--border-1)] px-4 py-3 text-sm text-[var(--text-2)]">
                      Este move aun no tiene citations.
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {params.success ? (
              <Toast variant="success" title="Operacion completada" message={params.success} />
            ) : null}
            {params.error ? (
              <Toast variant="error" title="Operacion bloqueada" message={params.error} />
            ) : null}
          </div>

          <aside className="space-y-6">
            <Card>
              <CardContent>
                <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.1em] text-[var(--text-3)]">
                  Quality Checklist
                </h2>
                <div className="space-y-2">
                  <ChecklistItem label="Step order validado" checked={review.checklist.hasStepByStep} />
                  <ChecklistItem label="Terminologia consistente" checked={review.checklist.hasCommonMistakes} />
                  <ChecklistItem label="Citation requerida" checked={review.checklist.hasCitation} />
                  <ChecklistItem
                    label="Media rightsStatus definido"
                    checked={review.checklist.hasRightsStatusDefined}
                  />
                  <ChecklistItem label="Sin PLACEHOLDER" checked={review.checklist.hasNoPlaceholder} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.1em] text-[var(--text-3)]">
                  Estado editorial
                </h2>
                <div className="grid gap-2">
                  <StatusActionButton
                    slug={review.move.slug}
                    redirectTo={redirectTo}
                    targetStatus="draft"
                    label="Mover a draft"
                    variant="ghost"
                  />
                  <StatusActionButton
                    slug={review.move.slug}
                    redirectTo={redirectTo}
                    targetStatus="review"
                    label="Mover a review"
                    variant="outline"
                  />
                  <StatusActionButton
                    slug={review.move.slug}
                    redirectTo={redirectTo}
                    targetStatus="ready"
                    label="Mover a ready"
                    variant="secondary"
                  />
                  <StatusActionButton
                    slug={review.move.slug}
                    redirectTo={redirectTo}
                    targetStatus="published"
                    label="Publicar"
                    variant="primary"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.1em] text-[var(--text-3)]">
                  Agregar Citation
                </h2>
                <form action="/api/admin/moves/citation" method="post" className="space-y-2">
                  <input type="hidden" name="slug" value={review.move.slug} />
                  <input
                    type="hidden"
                    name="redirectTo"
                    value={buildReviewHref({ tab: "sources", item: review.move.slug, role })}
                  />
                  <input
                    name="title"
                    required
                    placeholder="Titulo (obligatorio)"
                    className="h-10 w-full rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]"
                  />
                  <input
                    name="url"
                    placeholder="URL (opcional)"
                    className="h-10 w-full rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      name="author"
                      placeholder="Autor"
                      className="h-10 w-full rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]"
                    />
                    <input
                      name="year"
                      placeholder="Ano"
                      className="h-10 w-full rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]"
                    />
                  </div>
                  <Button size="sm" className="w-full" type="submit">
                    Vincular Citation
                  </Button>
                </form>
              </CardContent>
            </Card>

            <AdminMediaManager
              entityType="move"
              entityRef={review.move.slug}
              redirectTo={redirectTo}
              links={mediaLinks}
              title="Media del move"
              description="Vincula videos y define rightsStatus para el contenido."
            />

            <Card>
              <CardContent>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.1em] text-[var(--text-3)]">
                  <ShieldCheck size={14} />
                  Policy Gate
                </h2>
                <p className="text-sm text-[var(--text-2)]">
                  {review.canPublish
                    ? "El item cumple guardrails para publicar."
                    : "Publicacion bloqueada hasta cumplir todos los guardrails editoriales."}
                </p>
                {review.issues.length > 0 ? (
                  <ul className="mt-3 space-y-1 text-xs text-[var(--text-3)]">
                    {review.issues.map((issue) => (
                      <li key={issue}>- {issue}</li>
                    ))}
                  </ul>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <form action="/api/admin/moves/archive" method="post">
                  <input type="hidden" name="slug" value={review.move.slug} />
                  <input type="hidden" name="redirectTo" value={buildAdminHref("/admin", role)} />
                  <Button type="submit" variant="danger" className="w-full" leftIcon={<Trash2 size={14} />}>
                    Archivar move
                  </Button>
                </form>
              </CardContent>
            </Card>

            {!review.canPublish ? (
              <ErrorState
                title="Validation Error"
                subtitle="El contenido no esta listo para publicar. Revisa checklist y policy gate."
                buttonLabel="Volver a evaluar"
                retryHref={redirectTo}
              />
            ) : null}
          </aside>
        </section>
      </div>
    </AppShell>
  );
}

function ChecklistItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--border-1)] px-3 py-2 text-sm">
      {checked ? (
        <CheckCircle2 size={15} className="text-emerald-300" />
      ) : (
        <XCircle size={15} className="text-rose-300" />
      )}
      <span className="text-[var(--text-2)]">{label}</span>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  className,
}: {
  label: string;
  name: string;
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
  label,
  name,
  defaultValue,
  className,
}: {
  label: string;
  name: string;
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
  variant,
}: {
  slug: string;
  redirectTo: string;
  targetStatus: "draft" | "review" | "ready" | "published";
  label: string;
  variant: "primary" | "secondary" | "ghost" | "outline" | "danger";
}) {
  return (
    <form action="/api/admin/moves/status" method="post">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="targetStatus" value={targetStatus} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <Button type="submit" variant={variant} size="sm" className="w-full">
        {label}
      </Button>
    </form>
  );
}


