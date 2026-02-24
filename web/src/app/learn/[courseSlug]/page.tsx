import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  CheckCircle2,
  ChevronLeft,
  Clock3,
  HelpCircle,
  Lock,
  Music2,
} from "lucide-react";
import { AppShell } from "@/components/layout";
import { AdvancedVideoControls, ContentMediaPanel } from "@/components/media";
import { EmptyState, LockedState } from "@/components/states";
import { Badge, Button, Card, CardContent, Progress } from "@/components/ui";
import { getCurrentUser } from "@/server/auth/current-user";
import { getCourseDetailBySlug } from "@/server/db/catalog";
import { evaluateCourseAccess, getUserEntitlement } from "@/server/db/subscriptions";

const SITE_NAME = "Dance Academy";

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
}

function buildAbsoluteUrl(path: string) {
  return new URL(path, getBaseUrl()).toString();
}

function parseStepIndex(rawStep: string | undefined, maxSteps: number) {
  if (!rawStep) {
    return null;
  }

  const value = Number.parseInt(rawStep, 10);
  if (Number.isNaN(value) || value < 0 || value >= maxSteps) {
    return null;
  }

  return value;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}): Promise<Metadata> {
  const { courseSlug } = await params;
  const course = await getCourseDetailBySlug(courseSlug);

  if (!course) {
    return {
      title: `Curso no encontrado | ${SITE_NAME}`,
      description: "El curso solicitado no esta disponible.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const canonical = buildAbsoluteUrl(`/learn/${course.slug}`);
  return {
    title: `${course.title} | Aprende danza | ${SITE_NAME}`,
    description: course.summary,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "article",
      url: canonical,
      title: `${course.title} | ${SITE_NAME}`,
      description: course.summary,
      siteName: SITE_NAME,
    },
  };
}

export default async function CoursePlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseSlug: string }>;
  searchParams: Promise<{ lesson?: string; step?: string; success?: string; error?: string }>;
}) {
  const { courseSlug } = await params;
  const query = await searchParams;
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect(`/auth/login?next=${encodeURIComponent(`/learn/${courseSlug}`)}`);
  }

  const course = await getCourseDetailBySlug(courseSlug, currentUser?.id);

  if (!course) {
    notFound();
  }

  const entitlement = await getUserEntitlement(currentUser.id);
  const access = evaluateCourseAccess(entitlement, course.styleSlug);
  if (!access.allowed) {
    const checkoutParams = new URLSearchParams();
    checkoutParams.set("plan", access.requiredPlan ?? "pro");
    if (access.suggestedStyleSlug) {
      checkoutParams.set("style", access.suggestedStyleSlug);
    }
    checkoutParams.set("next", `/learn/${course.slug}`);
    if (access.reason === "style_pack_mismatch") {
      checkoutParams.set("error", "Tu pack actual no cubre este estilo.");
    }
    if (access.reason === "free_requires_upgrade") {
      checkoutParams.set("error", "Tu plan actual no incluye esta ruta.");
    }
    redirect(`/checkout?${checkoutParams.toString()}`);
  }

  if (course.lessons.length === 0) {
    return (
      <AppShell fullWidth>
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          <EmptyState
            title="Curso sin lecciones disponibles"
            description="Este curso existe, pero aun no tiene lecciones publicadas."
            ctaHref="/learn"
            ctaLabel="Volver a cursos"
          />
        </div>
      </AppShell>
    );
  }

  const lessonFromQuery = course.lessons.find((lesson) => lesson.slug === query.lesson);
  const lessonFromResume = course.resumeLessonSlug
    ? course.lessons.find((lesson) => lesson.slug === course.resumeLessonSlug)
    : undefined;
  const activeLesson =
    (lessonFromQuery && lessonFromQuery.status !== "locked" ? lessonFromQuery : undefined) ??
    (lessonFromResume && lessonFromResume.status !== "locked" ? lessonFromResume : undefined) ??
    course.lessons.find((lesson) => lesson.status === "active") ??
    course.lessons[0];
  const hasLockedLessons = course.lessons.some((lesson) => lesson.status === "locked");
  const successMessage = (query.success ?? "").trim();
  const errorMessage = (query.error ?? "").trim();
  const activeStepIndex =
    activeLesson.totalSteps > 0
      ? parseStepIndex(query.step, activeLesson.totalSteps) ??
        activeLesson.nextStepIndex ??
        (activeLesson.totalSteps - 1 >= 0 ? 0 : null)
      : null;

  const currentLessonPath = `/learn/${course.slug}?lesson=${encodeURIComponent(activeLesson.slug)}`;

  return (
    <AppShell fullWidth hideFooter className="max-w-none px-0 pb-0 pt-0">
      <div className="grid min-h-[calc(100vh-4rem)] gap-0 lg:grid-cols-[320px,1fr]">
        <aside className="border-r border-[var(--border-1)] bg-[var(--surface-1)] p-4">
          <div className="mb-5 border-b border-[var(--border-1)] pb-4">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-3)]">Ruta del curso</p>
            <h1 className="mt-2 text-sm font-bold text-white">{course.title}</h1>
            <Progress className="mt-4" label="Progreso total" value={course.progressPercent} />
          </div>
          <div className="space-y-2">
            {course.lessons.map((lesson, index) => {
              const selected = lesson.slug === activeLesson.slug;
              const cardClass = selected
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                : "border-[var(--border-1)] bg-[var(--surface-2)] hover:bg-white/5";
              const content = (
                <>
                  <p className="text-xs text-[var(--text-3)]">Leccion {index + 1}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{lesson.title}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-3)]">
                    <Clock3 size={12} />
                    {lesson.durationMin} min
                    {lesson.status === "done" ? <CheckCircle2 size={12} className="text-emerald-300" /> : null}
                    {lesson.status === "locked" ? <Lock size={12} className="text-amber-300" /> : null}
                  </div>
                </>
              );

              if (lesson.status === "locked") {
                return (
                  <div
                    key={lesson.slug}
                    className={`cursor-not-allowed rounded-xl border p-3 opacity-70 ${cardClass}`}
                    aria-disabled
                  >
                    {content}
                  </div>
                );
              }

              const stepQuery =
                typeof lesson.nextStepIndex === "number" ? `&step=${lesson.nextStepIndex}` : "";
              return (
                <Link
                  href={`/learn/${course.slug}?lesson=${lesson.slug}${stepQuery}`}
                  key={lesson.slug}
                  className={`block rounded-xl border p-3 transition-colors ${cardClass}`}
                >
                  {content}
                </Link>
              );
            })}
          </div>
        </aside>

        <main className="space-y-6 p-6 lg:p-8">
          {successMessage ? (
            <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {successMessage}
            </div>
          ) : null}
          {errorMessage ? (
            <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {errorMessage}
            </div>
          ) : null}

          <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-4">
            <div className="flex items-center gap-3">
              <Link href="/learn">
                <Button variant="ghost" size="sm" leftIcon={<ChevronLeft size={14} />}>
                  Volver
                </Button>
              </Link>
              <div>
                <p className="text-xs text-[var(--text-3)]">Reproduciendo</p>
                <p className="text-sm font-bold text-white">{course.title}</p>
              </div>
            </div>
            <Link href="/pricing#faq">
              <Button variant="outline" size="sm" leftIcon={<HelpCircle size={14} />}>
                Soporte y FAQ
              </Button>
            </Link>
          </header>

          <section className="overflow-hidden rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)]">
            <div className="p-5">
              <ContentMediaPanel
                title="Media del curso"
                items={course.media}
                emptyLabel="Este curso aun no tiene media publicada."
              />
            </div>
            <div id="player-controls" className="scroll-mt-20">
              <AdvancedVideoControls
                durationSec={Math.max(activeLesson.durationMin * 60, 60)}
                defaultCurrentSec={72}
              />
            </div>
            <div className="border-t border-[var(--border-1)] p-5">
              <Badge variant="primary">{course.level}</Badge>
              <h2 className="mt-3 text-3xl font-bold text-white">{activeLesson.title}</h2>
              <p className="mt-2 text-sm text-[var(--text-2)]">{activeLesson.objective}</p>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
            <Card>
              <CardContent>
                <h3 className="text-lg font-bold text-white">Checklist de la leccion</h3>
                <p className="mt-2 text-sm text-[var(--text-2)]">
                  Completa cada paso para desbloquear la siguiente leccion y mantener tu progreso.
                </p>

                <Progress
                  className="mt-4"
                  value={activeLesson.percent}
                  label={`${activeLesson.completedSteps}/${activeLesson.totalSteps} pasos completados`}
                />
                {activeLesson.totalSteps > 0 && activeStepIndex !== null ? (
                  <p className="mt-2 text-xs text-[var(--text-3)]">
                    Paso recomendado: {activeStepIndex + 1}
                  </p>
                ) : null}

                {activeLesson.steps.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    {activeLesson.steps.map((step) => {
                      const stepRedirect = `${currentLessonPath}&step=${step.index}`;
                      return (
                        <li
                          key={`${activeLesson.slug}-step-${step.index}`}
                          className="rounded-lg border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-xs text-[var(--text-3)]">Paso {step.index + 1}</p>
                              <p className="mt-1 text-sm text-[var(--text-2)]">{step.label}</p>
                            </div>
                            {currentUser ? (
                              <form action="/api/progress/lessons/steps/toggle" method="post">
                                <input type="hidden" name="courseSlug" value={course.slug} />
                                <input type="hidden" name="lessonSlug" value={activeLesson.slug} />
                                <input type="hidden" name="stepIndex" value={step.index} />
                                <input
                                  type="hidden"
                                  name="completed"
                                  value={step.completed ? "false" : "true"}
                                />
                                <input type="hidden" name="redirectTo" value={stepRedirect} />
                                <Button variant={step.completed ? "outline" : "primary"} size="sm" type="submit">
                                  {step.completed ? "Desmarcar" : "Marcar"}
                                </Button>
                              </form>
                            ) : (
                              <Badge variant={step.completed ? "primary" : "neutral"}>
                                {step.completed ? "Completado" : "Pendiente"}
                              </Badge>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-4 rounded-lg border border-[var(--border-1)] px-3 py-3 text-sm text-[var(--text-2)]">
                    Esta leccion no tiene checklist por pasos.
                  </p>
                )}

                {currentUser ? (
                  <form action="/api/progress/lessons/complete" method="post" className="mt-4">
                    <input type="hidden" name="courseSlug" value={course.slug} />
                    <input type="hidden" name="lessonSlug" value={activeLesson.slug} />
                    <input type="hidden" name="redirectTo" value={currentLessonPath} />
                    <Button type="submit">Marcar leccion completada</Button>
                  </form>
                ) : (
                  <div className="mt-4 rounded-lg border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-3 text-sm text-[var(--text-2)]">
                    Inicia sesion para guardar tu progreso.
                    <div className="mt-3">
                      <Link
                        href={`/auth/login?next=${encodeURIComponent(currentLessonPath)}`}
                      >
                        <Button size="sm">Iniciar sesion</Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.1em] text-[var(--text-3)]">
                  <Music2 size={14} />
                  Musica de apoyo
                </h3>
                <p className="mt-3 text-sm text-[var(--text-2)]">Playlist sugerida: 96 BPM Groove Pack Vol.1</p>
                <Link href="/search?q=96+bpm+groove+pack">
                  <Button variant="outline" className="mt-4">
                    Abrir biblioteca interna
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardContent>
                <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-[var(--text-3)]">
                  Fuentes del curso
                </h3>
                {course.citations && course.citations.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    {course.citations.map((citation) => (
                      <li key={citation.id} className="rounded-lg border border-[var(--border-1)] px-3 py-2">
                        <p className="text-sm font-semibold text-white">{citation.title}</p>
                        <p className="mt-1 text-xs text-[var(--text-3)]">
                          {citation.sourceType}
                          {citation.year ? ` | ${citation.year}` : ""}
                          {citation.author ? ` | ${citation.author}` : ""}
                        </p>
                        {citation.url ? (
                          <Link
                            href={citation.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-block text-xs text-[var(--color-primary-soft)]"
                          >
                            {citation.url}
                          </Link>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-[var(--text-2)]">
                    Este curso aun no tiene citations vinculadas.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-[var(--text-3)]">
                  Fuentes de la leccion
                </h3>
                {activeLesson.citations && activeLesson.citations.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    {activeLesson.citations.map((citation) => (
                      <li key={citation.id} className="rounded-lg border border-[var(--border-1)] px-3 py-2">
                        <p className="text-sm font-semibold text-white">{citation.title}</p>
                        <p className="mt-1 text-xs text-[var(--text-3)]">
                          {citation.sourceType}
                          {citation.year ? ` | ${citation.year}` : ""}
                          {citation.author ? ` | ${citation.author}` : ""}
                        </p>
                        {citation.url ? (
                          <Link
                            href={citation.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-block text-xs text-[var(--color-primary-soft)]"
                          >
                            {citation.url}
                          </Link>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-[var(--text-2)]">
                    Esta leccion aun no tiene citations vinculadas.
                  </p>
                )}
              </CardContent>
            </Card>
          </section>

          {hasLockedLessons ? (
            <LockedState
              title="Siguiente modulo bloqueado"
              description="Completa la leccion activa para desbloquear la siguiente."
            />
          ) : null}
        </main>
      </div>
    </AppShell>
  );
}
