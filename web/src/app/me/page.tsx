import Link from "next/link";
import {
  Award,
  CalendarClock,
  Flame,
  Gauge,
  PlayCircle,
  Trophy,
  Zap,
} from "lucide-react";
import { AppShell, Sidebar } from "@/components/layout";
import { LockedState } from "@/components/states";
import { Badge, Button, Card, CardContent, Progress } from "@/components/ui";
import { coursesMock, getCourseBySlug, userMock } from "@/mocks";

export default function MePage() {
  const activeCourse = getCourseBySlug(userMock.activeCourseSlug);

  return (
    <AppShell fullWidth className="max-w-[1440px]">
      <div className="mx-auto flex w-full max-w-[1380px] gap-6">
        <Sidebar
          title="My Learning"
          className="sticky top-24 hidden h-fit lg:block"
          items={[
            { label: "Dashboard", href: "/me", active: true },
            { label: "Certificates", href: "/me/certificates" },
            { label: "Achievements", muted: true },
            { label: "Settings", muted: true },
          ]}
        />

        <section className="min-w-0 flex-1 space-y-6">
          <header className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6">
            <h1 className="text-4xl font-bold text-white">My Dashboard</h1>
            <p className="mt-2 text-sm text-[var(--text-2)]">
              Welcome back, {userMock.name}. Keep your momentum and finish your active path.
            </p>
          </header>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={<Flame size={18} />} label="Streak" value={`${userMock.streakDays} Days`} />
            <StatCard icon={<CalendarClock size={18} />} label="Horas" value={`${userMock.hoursLearned} Hrs`} />
            <StatCard icon={<Award size={18} />} label="Certificados" value={`${userMock.certificates.length}`} />
            <StatCard icon={<Gauge size={18} />} label="Nivel actual" value={userMock.currentLevel} />
          </section>

          <Card>
            <CardContent>
              <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                <PlayCircle size={20} className="text-[var(--color-primary-soft)]" />
                Continue Learning
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
                  <Link href={`/learn/${activeCourse.slug}`}>
                    <Button className="mt-4">Continue Learning</Button>
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
                <h2 className="text-xl font-bold text-white">My Courses</h2>
                <div className="mt-4 space-y-3">
                  {coursesMock.map((course) => (
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
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
                    <Trophy size={18} className="text-amber-300" />
                    Recent Badges
                  </h2>
                  <div className="space-y-2">
                    {userMock.badges.map((badge) => (
                      <div
                        key={badge}
                        className="rounded-lg border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-2)]"
                      >
                        {badge}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
                    <Zap size={17} className="text-[var(--color-primary-soft)]" />
                    Activity
                  </h2>
                  <ul className="space-y-2 text-sm text-[var(--text-2)]">
                    <li className="rounded-lg border border-[var(--border-1)] px-3 py-2">
                      Completed lesson: Rock Fundamentals
                    </li>
                    <li className="rounded-lg border border-[var(--border-1)] px-3 py-2">
                      Earned badge: Footwork Focus
                    </li>
                    <li className="rounded-lg border border-[var(--border-1)] px-3 py-2">
                      Certificate issued: House Foundations
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
  icon: React.ReactNode;
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
