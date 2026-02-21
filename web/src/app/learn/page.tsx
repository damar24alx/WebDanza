import Link from "next/link";
import { Clock3, Flame, GraduationCap, Layers3 } from "lucide-react";
import { AppShell } from "@/components/layout";
import { Badge, Button, Card, CardContent } from "@/components/ui";
import { coursesMock, getStyleBySlug } from "@/mocks";

export default function LearnPage() {
  return (
    <AppShell fullWidth className="max-w-[1440px]">
      <div className="mx-auto w-full max-w-[1380px] space-y-8">
        <section className="hero-overlay overflow-hidden rounded-3xl border border-[var(--border-1)] p-8 md:p-12">
          <Badge variant="primary">Dance Academy</Badge>
          <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-white md:text-6xl">
            Structured Courses for Real Progress
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-[var(--text-2)] md:text-base">
            Cursos diseñados para pasar de beginner a intermediate con hitos medibles.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button leftIcon={<GraduationCap size={16} />}>Comenzar ruta</Button>
            <Button variant="outline" leftIcon={<Layers3 size={16} />}>
              Explorar catálogo
            </Button>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent>
              <p className="text-xs uppercase tracking-[0.1em] text-[var(--text-3)]">Rutas activas</p>
              <p className="mt-2 text-3xl font-bold text-white">3</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs uppercase tracking-[0.1em] text-[var(--text-3)]">Horas disponibles</p>
              <p className="mt-2 text-3xl font-bold text-white">19h</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs uppercase tracking-[0.1em] text-[var(--text-3)]">Certificables</p>
              <p className="mt-2 text-3xl font-bold text-white">2 cursos</p>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-white">Explore Courses</h2>
          <div className="card-grid">
            {coursesMock.map((course) => {
              const style = getStyleBySlug(course.styleSlug);
              return (
                <Card key={course.slug} className="h-full">
                  <CardContent>
                    <div className="h-36 rounded-xl bg-gradient-to-br from-[var(--color-primary)]/55 to-cyan-500/25" />
                    <div className="mt-4 flex items-center justify-between">
                      <Badge variant="primary">{style?.name ?? "Style"}</Badge>
                      <span className="flex items-center gap-1 text-xs text-[var(--text-3)]">
                        <Clock3 size={13} />
                        {course.durationHours}h
                      </span>
                    </div>
                    <h3 className="mt-3 text-xl font-bold text-white">{course.title}</h3>
                    <p className="mt-1 text-sm text-[var(--text-2)]">{course.summary}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-xs text-[var(--text-3)]">{course.lessons.length} lessons</p>
                      <Link href={`/learn/${course.slug}`}>
                        <Button size="sm">Abrir curso</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-white">
            <Flame size={20} className="text-orange-300" />
            Trending This Week
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {coursesMock.map((course) => (
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
      </div>
    </AppShell>
  );
}
