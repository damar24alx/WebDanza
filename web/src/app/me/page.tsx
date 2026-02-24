import type { ReactNode } from "react";
import Link from "next/link";
import {
  Award,
  CalendarClock,
  Gauge,
  PlayCircle,
  Trophy,
  Zap,
} from "lucide-react";
import { AppShell, Sidebar } from "@/components/layout";
import { LockedState } from "@/components/states";
import { Badge, Button, Card, CardContent, Progress } from "@/components/ui";
import { requireAuthenticatedUser } from "@/server/auth/current-user";
import { getUserAchievementsSummary } from "@/server/db/achievements";
import { getCourseDetailBySlug, getCoursesCatalog } from "@/server/db/catalog";
import { getUserDashboardSummary, getUserStyleProgressSummary } from "@/server/db/profile";

type MeSearchParams = Promise<{
  practicedMove?: string;
  error?: string;
}>;

function buildCourseResumeHref(course: {
  slug: string;
  resumeLessonSlug?: string | null;
  resumeStepIndex?: number | null;
}) {
  if (!course.resumeLessonSlug) {
    return `/learn/${course.slug}`;
  }

  const stepQuery =
    typeof course.resumeStepIndex === "number" ? `&step=${course.resumeStepIndex}` : "";
  return `/learn/${course.slug}?lesson=${encodeURIComponent(course.resumeLessonSlug)}${stepQuery}`;
}

export default async function MePage({
  searchParams,
}: {
  searchParams: MeSearchParams;
}) {
  const user = await requireAuthenticatedUser();
  const params = await searchParams;
  const practicedMove = (params.practicedMove ?? "").trim();
  const summary = await getUserDashboardSummary(user.id);

  const [activeCourse, courses, achievements, styleProgress] = await Promise.all([
    summary.activeCourseSlug
      ? getCourseDetailBySlug(summary.activeCourseSlug, user.id)
      : Promise.resolve(undefined),
    getCoursesCatalog(user.id),
    getUserAchievementsSummary(user.id),
    getUserStyleProgressSummary(user.id),
  ]);

  const recentBadges = achievements.recentUnlocked.map((badge) => badge.title);
  const streakDays = achievements.currentStreakDays;
  const activeCourseHref = activeCourse ? buildCourseResumeHref(activeCourse) : "/learn";

  return (
    <AppShell fullWidth className="max-w-[1440px]">
      <div className="mx-auto flex w-full max-w-[1380px] gap-6">
        <Sidebar
          title="Mi aprendizaje"
          className="sticky top-24 hidden h-fit lg:block"
          items={[
            { label: "Panel", href: "/me", active: true },
            { label: "Certificados", href: "/me/certificates" },
            { label: "Logros", href: "/me/achievements" },
            { label: "Configuracion", muted: true },
          ]}
        />

        <section className="min-w-0 flex-1 space-y-6">
          {params.error === "admin_only" ? (
            <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              Solo administradores pueden acceder al panel admin.
            </div>
          ) : null}
          {practicedMove ? (
            <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              Practice registrada para: <span className="font-semibold text-white">{practicedMove}</span>
            </div>
          ) : null}

          <header className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6">
            <h1 className="text-4xl font-bold text-white">Mi panel</h1>
            <p className="mt-2 text-sm text-[var(--text-2)]">
              Bienvenido de nuevo, {user.name}. Manten el ritmo y termina tu ruta activa.
            </p>
          </header>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={<CalendarClock size={18} />} label="Racha" value={`${streakDays} dias`} />
            <StatCard icon={<CalendarClock size={18} />} label="Horas" value={`${summary.estimatedHoursLearned} h`} />
            <StatCard icon={<Award size={18} />} label="Certificados" value={`${summary.certificatesCount}`} />
            <StatCard icon={<Gauge size={18} />} label="Nivel actual" value={summary.currentLevel} />
          </section>

          <Card>
            <CardContent>
              <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                <PlayCircle size={20} className="text-[var(--color-primary-soft)]" />
                Continuar aprendizaje
              </h2>
              {activeCourse ? (
                <div className="mt-4 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-2xl font-bold text-white">{activeCourse.title}</p>
                      <p className="mt-1 text-sm text-[var(--text-2)]">{activeCourse.summary}</p>
                    </div>
                    <Badge variant="primary">{activeCourse.level}</Badge>
                  </div>
                  <Progress className="mt-4" value={activeCourse.progressPercent} label="Progreso curso" />
                  <Link href={activeCourseHref}>
                    <Button className="mt-4">Reanudar exacto</Button>
                  </Link>
                </div>
              ) : (
                <LockedState title="Sin curso activo" description="Inicia una ruta desde la academia." />
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[1.1fr,1fr]">
            <Card>
              <CardContent>
                <h2 className="text-xl font-bold text-white">Mis cursos</h2>
                <div className="mt-4 space-y-3">
                  {courses.map((course) => (
                    <div key={course.slug} className="rounded-lg border border-[var(--border-1)] px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-white">{course.title}</p>
                        <Badge variant="neutral">{course.level}</Badge>
                      </div>
                      <Progress className="mt-3" value={course.progressPercent} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardContent>
                  <h2 className="mb-4 text-xl font-bold text-white">Progreso por estilo</h2>
                  <div className="space-y-3">
                    {styleProgress.length > 0 ? (
                      styleProgress.map((styleItem) => (
                        <div
                          key={styleItem.styleSlug}
                          className="rounded-lg border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-white">{styleItem.styleName}</p>
                            <Badge variant="neutral">{styleItem.level}</Badge>
                          </div>
                          <Progress
                            className="mt-3"
                            value={styleItem.progressPercent}
                            label={`${styleItem.progressPercent}%`}
                          />
                          <p className="mt-2 text-xs text-[var(--text-3)]">
                            Cursos: {styleItem.coursesCompleted}/{styleItem.coursesTotal} completados · {styleItem.coursesStarted} iniciados
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-lg border border-dashed border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-3)]">
                        Aun no hay progreso por estilo.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
                    <Trophy size={18} className="text-amber-300" />
                    Logros recientes
                  </h2>
                  <div className="space-y-2">
                    {recentBadges.length > 0 ? (
                      recentBadges.map((badge) => (
                        <div
                          key={badge}
                          className="rounded-lg border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-2)]"
                        >
                          {badge}
                        </div>
                      ))
                    ) : (
                      <p className="rounded-lg border border-dashed border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-3)]">
                        Aun no desbloqueaste logros.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
                    <Zap size={17} className="text-[var(--color-primary-soft)]" />
                    Actividad
                  </h2>
                  <ul className="space-y-2 text-sm text-[var(--text-2)]">
                    <li className="rounded-lg border border-[var(--border-1)] px-3 py-2">
                      Cursos completados: {summary.completedCoursesCount}
                    </li>
                    <li className="rounded-lg border border-[var(--border-1)] px-3 py-2">
                      Certificados emitidos: {summary.certificatesCount}
                    </li>
                    <li className="rounded-lg border border-[var(--border-1)] px-3 py-2">
                      Cuenta activa: {user.email}
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent>
        <p className="mb-2 text-[var(--color-primary-soft)]">{icon}</p>
        <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-3)]">{label}</p>
        <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      </CardContent>
    </Card>
  );
}
