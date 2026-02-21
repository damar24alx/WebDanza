import { notFound } from "next/navigation";
import { CheckCircle2, Clock3, Lock, Music2, PlayCircle } from "lucide-react";
import { AppShell } from "@/components/layout";
import { LockedState } from "@/components/state/SystemStates";
import { Badge, Button, Card, CardContent, Progress } from "@/components/ui";
import { getCourseBySlug } from "@/mocks";

export default function CoursePlayerPage({
  params,
}: {
  params: { courseSlug: string };
}) {
  const course = getCourseBySlug(params.courseSlug);

  if (!course) {
    notFound();
  }

  const activeLesson = course.lessons.find((lesson) => lesson.status === "active") ?? course.lessons[0];

  return (
    <AppShell fullWidth hideFooter className="max-w-none px-0 pb-0 pt-0">
      <div className="grid min-h-[calc(100vh-4rem)] gap-0 lg:grid-cols-[320px,1fr]">
        <aside className="border-r border-[var(--border-1)] bg-[var(--surface-1)] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-3)]">Course Curriculum</p>
          <h1 className="mt-2 text-sm font-bold text-white">{course.title}</h1>
          <Progress className="mt-4" label="Progreso total" value={course.progressPercent} />
          <div className="mt-5 space-y-2">
            {course.lessons.map((lesson, index) => (
              <div
                key={lesson.slug}
                className={`rounded-xl border p-3 ${
                  lesson.status === "active"
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                    : "border-[var(--border-1)] bg-[var(--surface-2)]"
                }`}
              >
                <p className="text-xs text-[var(--text-3)]">Lesson {index + 1}</p>
                <p className="mt-1 text-sm font-semibold text-white">{lesson.title}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-3)]">
                  <Clock3 size={12} />
                  {lesson.durationMin} min
                  {lesson.status === "done" ? <CheckCircle2 size={12} className="text-emerald-300" /> : null}
                  {lesson.status === "locked" ? <Lock size={12} className="text-amber-300" /> : null}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="space-y-6 p-6 lg:p-8">
          <section className="overflow-hidden rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)]">
            <div className="hero-overlay flex aspect-video items-center justify-center">
              <Button leftIcon={<PlayCircle size={16} />}>Play Lesson</Button>
            </div>
            <div className="p-5">
              <Badge variant="primary">{course.level}</Badge>
              <h1 className="mt-3 text-3xl font-bold text-white">{activeLesson.title}</h1>
              <p className="mt-2 text-sm text-[var(--text-2)]">{activeLesson.objective}</p>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
            <Card>
              <CardContent>
                <h2 className="text-lg font-bold text-white">Key Takeaways</h2>
                <ul className="mt-4 space-y-2">
                  {activeLesson.takeaways.map((item) => (
                    <li
                      key={item}
                      className="rounded-lg border border-[var(--border-1)] px-3 py-2 text-sm text-[var(--text-2)]"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.1em] text-[var(--text-3)]">
                  <Music2 size={14} />
                  Music in this lesson
                </h2>
                <p className="mt-3 text-sm text-[var(--text-2)]">
                  Playlist sugerida: 96 BPM Groove Pack Vol.1
                </p>
                <Button variant="outline" className="mt-4">
                  Abrir playlist
                </Button>
              </CardContent>
            </Card>
          </section>

          <LockedState
            title="Siguiente módulo bloqueado"
            subtitle="Completa esta lección y marca el checklist para habilitar la siguiente."
          />
        </main>
      </div>
    </AppShell>
  );
}
