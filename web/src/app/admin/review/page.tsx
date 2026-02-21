import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { AppShell, Sidebar } from "@/components/layout";
import { ErrorState } from "@/components/state/SystemStates";
import { Badge, Button, Card, CardContent, Tabs, Toast } from "@/components/ui";

export default function AdminReviewPage() {
  return (
    <AppShell fullWidth hideFooter className="max-w-[1500px]">
      <div className="mx-auto flex w-full max-w-[1450px] gap-6">
        <Sidebar
          title="Review Queue"
          className="sticky top-24 hidden h-fit lg:block"
          items={[
            { label: "Pending (4)", active: true },
            { label: "Approved (11)" },
            { label: "Rejected (2)" },
          ]}
        />

        <section className="grid min-w-0 flex-1 gap-6 xl:grid-cols-[1.25fr,390px]">
          <div className="space-y-6">
            <header className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6">
              <Badge variant="warning">In Review</Badge>
              <h1 className="mt-3 text-3xl font-bold text-white">The Dougie - Variation B</h1>
              <p className="mt-1 text-sm text-[var(--text-2)]">
                Revisión editorial del breakdown técnico y consistencia de tags.
              </p>
              <Tabs
                className="mt-5"
                activeValue="breakdown"
                items={[
                  { label: "Step Breakdown", value: "breakdown" },
                  { label: "Tags", value: "tags" },
                  { label: "Sources", value: "sources" },
                ]}
              />
            </header>

            <Card>
              <CardContent>
                <h2 className="mb-4 text-lg font-semibold text-white">Step Breakdown</h2>
                <ol className="space-y-3">
                  <li className="rounded-xl border border-[var(--border-1)] px-4 py-3 text-sm text-[var(--text-2)]">
                    1. Bounce inicial y desplazamiento lateral.
                  </li>
                  <li className="rounded-xl border border-[var(--border-1)] px-4 py-3 text-sm text-[var(--text-2)]">
                    2. Acento de hombro en contratiempo.
                  </li>
                  <li className="rounded-xl border border-[var(--border-1)] px-4 py-3 text-sm text-[var(--text-2)]">
                    3. Variación de pies con giro corto.
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Toast
              variant="error"
              title="Sync Failed"
              message="No se pudieron guardar cambios en tags. Reintentando..."
            />
          </div>

          <aside className="space-y-6">
            <Card>
              <CardContent>
                <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.1em] text-[var(--text-3)]">
                  Quality Checklist
                </h2>
                <div className="space-y-2">
                  <ChecklistItem label="Step order validado" checked />
                  <ChecklistItem label="Terminología consistente" checked />
                  <ChecklistItem label="Citation requerida" checked={false} />
                  <ChecklistItem label="Media rightsStatus definido" checked />
                </div>
                <div className="mt-5 flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<CheckCircle2 size={14} />}
                    className="flex-1"
                  >
                    Aprobar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<XCircle size={14} />}
                    className="flex-1"
                  >
                    Rechazar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.1em] text-[var(--text-3)]">
                  <ShieldCheck size={14} />
                  Policy Gate
                </h2>
                <p className="text-sm text-[var(--text-2)]">
                  Publicación bloqueada hasta adjuntar citation de contexto histórico-cultural.
                </p>
              </CardContent>
            </Card>

            <ErrorState
              title="Validation Error"
              subtitle="El claim histórico no tiene source verificable. Mantener en estado review."
              buttonLabel="Reintentar validación"
            />
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
