import Link from "next/link";
import { Flame, Lock, Trophy } from "lucide-react";
import { AppShell, Sidebar } from "@/components/layout";
import { Badge, Button, Card, CardContent, Progress } from "@/components/ui";
import { requireAuthenticatedUser } from "@/server/auth/current-user";
import { getUserAchievementsSummary } from "@/server/db/achievements";
import { getUserDashboardSummary } from "@/server/db/profile";

function toneClass(unlocked: boolean) {
  if (unlocked) {
    return "from-amber-500/70 to-yellow-600/70";
  }

  return "from-slate-700 to-slate-900";
}

export default async function AchievementsPage() {
  const user = await requireAuthenticatedUser();
  const [achievements, summary] = await Promise.all([
    getUserAchievementsSummary(user.id),
    getUserDashboardSummary(user.id),
  ]);

  return (
    <AppShell fullWidth className="max-w-[1440px]">
      <div className="mx-auto flex w-full max-w-[1380px] gap-6">
        <Sidebar
          title="Mi aprendizaje"
          className="sticky top-24 hidden h-fit lg:block"
          items={[
            { label: "Panel", href: "/me" },
            { label: "Certificados", href: "/me/certificates" },
            { label: "Logros", href: "/me/achievements", active: true },
            { label: "Configuracion", muted: true },
          ]}
        />

        <section className="min-w-0 flex-1 space-y-6">
          <section className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.1em] text-[var(--text-3)]">Progreso de logros</p>
                <h1 className="mt-1 text-3xl font-black text-white">Logros y medallas</h1>
                <p className="mt-2 text-sm text-[var(--text-2)]">
                  Nivel actual: {summary.currentLevel}. Mantienes una racha de {achievements.currentStreakDays} dias.
                </p>
              </div>
              <Badge variant="primary">
                {achievements.unlockedCount}/{achievements.totalCount} desbloqueados
              </Badge>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {achievements.badges.map((badgeItem) => (
              <Card
                key={badgeItem.id}
                className={badgeItem.unlocked ? "border-[var(--color-primary)]/35" : "border-dashed opacity-85"}
              >
                <CardContent className="text-center">
                  <div
                    className={`mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${toneClass(
                      badgeItem.unlocked,
                    )}`}
                  >
                    {badgeItem.unlocked ? (
                      <Trophy size={30} className="text-white" />
                    ) : (
                      <Lock size={26} className="text-slate-300" />
                    )}
                  </div>
                  <p className="text-lg font-bold text-white">{badgeItem.title}</p>
                  <p className="mt-1 text-xs text-[var(--text-2)]">{badgeItem.description}</p>
                  <Progress
                    className="mt-3"
                    value={badgeItem.progressPercent}
                    max={100}
                    label={badgeItem.progressLabel}
                  />
                  <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-3)]">
                    {badgeItem.status}
                  </p>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardContent>
                <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                  <Flame size={18} className="text-orange-300" />
                  Consistencia
                </h2>
                <ul className="mt-4 space-y-2 text-sm text-[var(--text-2)]">
                  <li className="rounded-lg border border-[var(--border-1)] px-3 py-2">
                    Racha actual: {achievements.currentStreakDays} dias consecutivos.
                  </li>
                  <li className="rounded-lg border border-[var(--border-1)] px-3 py-2">
                    Actividad en 14 dias: {achievements.activityDaysLast14} dias con actividad.
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card id="leaderboard">
              <CardContent>
                <h2 className="text-lg font-bold text-white">Siguiente objetivo recomendado</h2>
                <p className="mt-3 text-sm text-[var(--text-2)]">
                  Completa una leccion y manten actividad semanal para desbloquear todas las medallas MVP.
                </p>
                <Link href="/learn" className="mt-4 inline-flex">
                  <Button type="button">Ir a aprender</Button>
                </Link>
              </CardContent>
            </Card>
          </section>
        </section>
      </div>
    </AppShell>
  );
}
