import Link from "next/link";
import { Activity, LayoutDashboard, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/layout";
import { Badge, Button, Card, CardContent } from "@/components/ui";
import { requireAdminUser } from "@/server/auth/current-user";
import { getMvpKpisSnapshot, type KpiMetric } from "@/server/db/kpis";

function formatIsoDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function kpiStatus(metric: KpiMetric) {
  if (metric.valuePercent >= metric.targetPercent) {
    return "ok";
  }
  if (metric.valuePercent >= metric.targetPercent * 0.75) {
    return "warning";
  }

  return "risk";
}

export default async function AdminKpisPage() {
  await requireAdminUser();
  const snapshot = await getMvpKpisSnapshot();

  return (
    <AppShell fullWidth hideFooter className="max-w-[1300px]">
      <div className="mx-auto w-full max-w-[1200px] space-y-6">
        <header className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-white">KPIs MVP</h1>
              <p className="mt-1 text-sm text-[var(--text-2)]">
                Ventana: ultimos {snapshot.windowDays} dias. Actualizacion cacheada cada 24h.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="neutral">Corte: {formatIsoDateLabel(snapshot.asOf)}</Badge>
              <Link href="/admin">
                <Button variant="outline" type="button" leftIcon={<LayoutDashboard size={15} />}>
                  Volver a admin
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <KpiCard metric={snapshot.activation24h} />
          <KpiCard metric={snapshot.retentionWeek1} />
          <KpiCard metric={snapshot.courseCompletion} />
        </section>

        <Card>
          <CardContent>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
              <TrendingUp size={18} />
              Fuente de calculo
            </h2>
            <ul className="space-y-2 text-sm text-[var(--text-2)]">
              <li className="rounded-lg border border-[var(--border-1)] px-3 py-2">
                Activacion 24h: estudiantes nuevos con primera leccion completada en &lt;=24h.
              </li>
              <li className="rounded-lg border border-[var(--border-1)] px-3 py-2">
                Retencion semana 1: estudiantes nuevos con actividad entre dia 2 y dia 7.
              </li>
              <li className="rounded-lg border border-[var(--border-1)] px-3 py-2">
                Completion cursos: progresos de curso iniciados en ventana que terminan en estado completado.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function KpiCard({ metric }: { metric: KpiMetric }) {
  const status = kpiStatus(metric);
  const statusLabel =
    status === "ok" ? "En objetivo" : status === "warning" ? "Cerca del objetivo" : "Fuera de objetivo";
  const statusVariant = status === "ok" ? "success" : status === "warning" ? "warning" : "danger";

  return (
    <Card>
      <CardContent>
        <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-3)]">{metric.label}</p>
        <p className="mt-2 text-3xl font-black text-white">{metric.valuePercent.toFixed(1)}%</p>
        <p className="mt-1 text-xs text-[var(--text-3)]">
          {metric.numerator}/{metric.denominator} | Meta {metric.targetPercent}%
        </p>
        <p className="mt-3 text-sm text-[var(--text-2)]">{metric.description}</p>
        <Badge className="mt-3 gap-1" variant={statusVariant}>
          <Activity size={13} />
          {statusLabel}
        </Badge>
      </CardContent>
    </Card>
  );
}
