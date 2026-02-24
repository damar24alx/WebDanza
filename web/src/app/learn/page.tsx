import Link from "next/link";
import type { Metadata } from "next";
import {
  Clock3,
  Flame,
  GraduationCap,
  Layers3,
  PlayCircle,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/layout";
import { EmptyState } from "@/components/states";
import { Badge, Button, Card, CardContent, Input, Progress } from "@/components/ui";
import { getCurrentUser } from "@/server/auth/current-user";
import {
  getCoursesCatalog,
  getStyleLookup,
  getStylesCatalog,
} from "@/server/db/catalog";
import { evaluateCourseAccess, getUserEntitlement } from "@/server/db/subscriptions";

export const metadata: Metadata = {
  title: "Aprendizaje | Dance Academy",
  description: "Explora rutas guiadas por estilo, nivel y progreso.",
};

type LearnSearchParams = Promise<{
  q?: string;
  level?: string;
  style?: string;
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

function buildCheckoutHref(input: {
  plan: "style-pack" | "pro" | "studio" | "free" | null;
  styleSlug: string;
  nextPath: string;
}) {
  const query = new URLSearchParams();
  query.set("plan", input.plan ?? "pro");
  if (input.plan === "style-pack") {
    query.set("style", input.styleSlug);
  }
  query.set("next", input.nextPath);
  return `/checkout?${query.toString()}`;
}

export default async function LearnPage({
  searchParams,
}: {
  searchParams: LearnSearchParams;
}) {
  const params = await searchParams;
  const currentUser = await getCurrentUser();
  const [courses, styles, styleLookup] = await Promise.all([
    getCoursesCatalog(currentUser?.id),
    getStylesCatalog(),
    getStyleLookup(),
  ]);
  const entitlement = currentUser ? await getUserEntitlement(currentUser.id) : null;
  const query = (params.q ?? "").trim().toLowerCase();
  const selectedLevel = (params.level ?? "all").toLowerCase();
  const selectedStyle = (params.style ?? "all").toLowerCase();

  const filteredCourses = courses.filter((course) => {
    const matchesQuery =
      !query ||
      course.title.toLowerCase().includes(query) ||
      course.summary.toLowerCase().includes(query);
    const matchesLevel =
      selectedLevel === "all" || course.level.toLowerCase() === selectedLevel;
    const matchesStyle =
      selectedStyle === "all" || course.styleSlug.toLowerCase() === selectedStyle;

    return matchesQuery && matchesLevel && matchesStyle;
  });

  const featuredCourse =
    filteredCourses.find((course) => course.progressPercent > 0 && course.progressPercent < 100) ??
    filteredCourses.find((course) => course.progressPercent > 0) ??
    filteredCourses[0];
  const levels = ["all", "beginner", "intermediate", "advanced"];

  return (
    <AppShell fullWidth className="max-w-[1440px]">
      <div className="mx-auto w-full max-w-[1380px] space-y-8">
        <section className="hero-overlay relative overflow-hidden rounded-3xl border border-[var(--border-1)] p-8 md:p-12">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-2)]">
            <Flame size={14} />
            En tendencia
          </div>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-white md:text-6xl">
            Rutas estructuradas para progreso real
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-[var(--text-2)] md:text-base">
            Aprende tecnica, musicalidad y vocabulario con metas medibles y secuencia clara.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/learn?level=beginner">
              <Button leftIcon={<GraduationCap size={16} />}>Comenzar ruta</Button>
            </Link>
            <Link href="/styles">
              <Button variant="outline" leftIcon={<Layers3 size={16} />}>
                Explorar catalogo
              </Button>
            </Link>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-[1.2fr,1fr,1fr,1fr]">
          <Card className="md:col-span-1">
            <CardContent>
              <p className="text-xs uppercase tracking-[0.1em] text-[var(--text-3)]">Continuar ahora</p>
              {featuredCourse ? (
                <div className="mt-3 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] p-3">
                  <p className="text-sm font-semibold text-white">{featuredCourse.title}</p>
                  <Progress className="mt-3" value={featuredCourse.progressPercent} />
                  <Link href={buildCourseResumeHref(featuredCourse)}>
                    <Button size="sm" className="mt-3 w-full" leftIcon={<PlayCircle size={14} />}>
                      Reanudar
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="mt-2 text-sm text-[var(--text-2)]">No hay curso activo.</p>
              )}
            </CardContent>
          </Card>
          <StatCard label="Rutas activas" value={`${courses.length}`} />
          <StatCard
            label="Horas disponibles"
            value={`${courses.reduce((sum, course) => sum + course.durationHours, 0)}h`}
          />
          <StatCard
            label="Certificables"
            value={`${courses.filter((course) => course.certificateEligible).length}`}
          />
        </section>

        <section className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6">
          <h2 className="text-2xl font-bold text-white">Explorar cursos</h2>
          <form className="mt-4 grid gap-3 md:grid-cols-[1fr,170px,170px,auto]">
            <Input icon={<Search size={16} />} placeholder="Buscar cursos..." name="q" defaultValue={params.q} />
            <select
              className="h-11 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-2)]"
              name="style"
              defaultValue={selectedStyle}
            >
              <option value="all">Todos los estilos</option>
              {styles.map((style) => (
                <option key={style.slug} value={style.slug}>
                  {style.name}
                </option>
              ))}
            </select>
            <select
              className="h-11 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-2)]"
              name="level"
              defaultValue={selectedLevel}
            >
              {levels.map((level) => (
                <option key={level} value={level}>
                  {level === "all" ? "Todos los niveles" : level}
                </option>
              ))}
            </select>
            <Button type="submit">Aplicar</Button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {selectedStyle !== "all" ? <Badge variant="primary">Estilo: {selectedStyle}</Badge> : null}
            {selectedLevel !== "all" ? <Badge variant="neutral">Nivel: {selectedLevel}</Badge> : null}
            {query ? <Badge variant="neutral">Busqueda: {query}</Badge> : null}
            <Link href="/learn">
              <Button variant="ghost" size="sm">
                Limpiar
              </Button>
            </Link>
          </div>
        </section>

        {filteredCourses.length === 0 ? (
          <EmptyState
            title="No se encontraron cursos"
            description="No hay cursos para esos filtros. Ajusta la busqueda y vuelve a intentar."
            ctaHref="/learn"
          />
        ) : (
          <>
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredCourses.map((course) => {
                const style = styleLookup.get(course.styleSlug);
                const resumeHref = buildCourseResumeHref(course);
                const isInProgress = course.progressPercent > 0 && course.progressPercent < 100;
                const access = evaluateCourseAccess(entitlement, course.styleSlug);
                const loginHref = `/auth/login?next=${encodeURIComponent(`/learn/${course.slug}`)}`;
                const checkoutHref = buildCheckoutHref({
                  plan: access.requiredPlan,
                  styleSlug: course.styleSlug,
                  nextPath: `/learn/${course.slug}`,
                });
                const actionHref = !currentUser
                  ? loginHref
                  : access.allowed
                    ? resumeHref
                    : checkoutHref;
                const actionLabel = !currentUser
                  ? "Iniciar sesion"
                  : access.allowed
                    ? isInProgress
                      ? "Continuar curso"
                      : "Abrir curso"
                    : "Desbloquear curso";
                return (
                  <Card key={course.slug} className="h-full">
                    <CardContent>
                      <div className="h-36 rounded-xl bg-gradient-to-br from-[var(--color-primary)]/55 to-cyan-500/25" />
                      <div className="mt-4 flex items-center justify-between">
                        <Badge variant="primary">{style?.name ?? "Estilo"}</Badge>
                        <span className="flex items-center gap-1 text-xs text-[var(--text-3)]">
                          <Clock3 size={13} />
                          {course.durationHours}h
                        </span>
                      </div>
                      <h3 className="mt-3 text-xl font-bold text-white">{course.title}</h3>
                      <p className="mt-1 text-sm text-[var(--text-2)]">{course.summary}</p>
                      {!access.allowed ? (
                        <p className="mt-2 text-xs font-semibold text-amber-300">
                          Bloqueado por plan. Activa acceso para abrir este curso.
                        </p>
                      ) : null}
                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-xs text-[var(--text-3)]">{course.lessons.length} lecciones</p>
                        <Link href={actionHref}>
                          <Button size="sm">{actionLabel}</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-white">Lo mas visto esta semana</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {filteredCourses.slice(0, 4).map((course) => (
                  <div
                    key={`trend-${course.slug}`}
                    className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-4"
                  >
                    <p className="text-sm font-semibold text-white">{course.title}</p>
                    <p className="mt-1 text-xs text-[var(--text-2)]">{course.summary}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-xs uppercase tracking-[0.1em] text-[var(--text-3)]">{label}</p>
        <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      </CardContent>
    </Card>
  );
}
