import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock3, Music3, Route, Sparkle, Target } from "lucide-react";
import { AppShell } from "@/components/layout";
import { LockedState } from "@/components/states";
import { Badge, Button, Card, CardContent, CardTitle, Progress, Tabs } from "@/components/ui";
import { coursesMock, getStyleBySlug, getSubstylesByStyle, movesMock } from "@/mocks";

export default async function StyleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const style = getStyleBySlug(slug);

  if (!style) {
    notFound();
  }

  const substyles = getSubstylesByStyle(style.slug);
  const relatedMoves = movesMock.filter((move) => move.styleSlugs.includes(style.slug));
  const styleCourses = coursesMock.filter((course) => course.styleSlug === style.slug);

  return (
    <AppShell fullWidth>
      <article className="mx-auto w-full max-w-7xl space-y-8 px-4 sm:px-6">
        <section className="relative min-h-[420px] overflow-hidden rounded-3xl border border-[var(--border-1)] bg-[var(--surface-1)] p-8 sm:p-10">
          <div className={`absolute inset-0 bg-gradient-to-br ${style.image} opacity-30`} />
          <div className="hero-overlay absolute inset-0 opacity-75" />
          <div className="relative z-10 max-w-3xl">
            <Badge variant="primary">{style.category}</Badge>
            <h1 className="mt-4 text-5xl font-black tracking-tight text-white sm:text-7xl">{style.name}</h1>
            <p className="mt-4 text-base text-[var(--text-2)] sm:text-lg">{style.summary}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/styles">
                <Button variant="outline">Volver a estilos</Button>
              </Link>
              <Link href="/learn">
                <Button rightIcon={<Route size={16} />}>Ir a rutas</Button>
              </Link>
            </div>
          </div>
        </section>

        <Tabs
          activeValue="overview"
          items={[
            { label: "Overview", value: "overview" },
            { label: "History", value: "history" },
            { label: "Technique", value: "technique" },
            { label: "Musicality", value: "musicality" },
            { label: "Learning Path", value: "path" },
          ]}
        />

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardContent className="space-y-4">
              <CardTitle>The Warehouse Roots</CardTitle>
              <p className="text-sm text-[var(--text-2)]">{style.history}</p>
              <p className="text-sm text-[var(--text-2)]">
                Musicalidad base: <span className="font-semibold text-[var(--text-1)]">{style.musicality}</span>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <CardTitle>Substyles</CardTitle>
              <div className="mt-4 space-y-2">
                {substyles.length ? (
                  substyles.map((substyle) => (
                    <Link
                      key={substyle.slug}
                      href={`/substyles/${substyle.slug}`}
                      className="block rounded-xl border border-[var(--border-1)] px-3 py-2 text-sm text-[var(--text-2)] hover:bg-white/5 hover:text-[var(--text-1)]"
                    >
                      {substyle.name}
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-[var(--text-3)]">Sin substyles cargados.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent>
              <CardTitle className="flex items-center gap-2">
                <Sparkle size={18} className="text-[var(--color-primary-soft)]" />
                Core Techniques
              </CardTitle>
              <div className="mt-4 space-y-3">
                {relatedMoves.slice(0, 3).map((move) => (
                  <Link
                    key={move.slug}
                    href={`/moves/${move.slug}`}
                    className="block rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] p-3 hover:bg-white/5"
                  >
                    <p className="font-semibold text-white">{move.name}</p>
                    <p className="mt-1 text-xs text-[var(--text-2)]">{move.summary}</p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <CardTitle className="flex items-center gap-2">
                <Music3 size={18} className="text-[var(--color-primary-soft)]" />
                Understanding the 4/4 Beat
              </CardTitle>
              <ul className="mt-4 space-y-2 text-sm text-[var(--text-2)]">
                {style.principles.map((principle) => (
                  <li key={principle} className="rounded-lg border border-[var(--border-1)] px-3 py-2">
                    {principle}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardContent>
              <CardTitle className="flex items-center gap-2">
                <Target size={18} className="text-[var(--color-primary-soft)]" />
                Learning Path
              </CardTitle>
              <div className="mt-5 space-y-4">
                {styleCourses.map((course) => (
                  <div key={course.slug} className="rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-lg font-bold text-white">{course.title}</p>
                      <span className="flex items-center gap-1 text-xs text-[var(--text-3)]">
                        <Clock3 size={14} />
                        {course.durationHours}h
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--text-2)]">{course.summary}</p>
                    <Progress className="mt-4" value={course.progressPercent} label="Avance" />
                    <Link href={`/learn/${course.slug}`}>
                      <Button className="mt-4">Abrir curso</Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <LockedState
            title="Modulo 2 bloqueado"
            description="Completa House Foundations para desbloquear variaciones avanzadas."
          />
        </section>
      </article>
    </AppShell>
  );
}
