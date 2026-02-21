import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  CirclePlay,
  Compass,
  Search,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout";
import { Badge, Button, Card, CardContent, Progress } from "@/components/ui";
import { coursesMock, stylesMock } from "@/mocks";

export default function HomePage() {
  const continueCourse = coursesMock[0];

  return (
    <AppShell fullWidth>
      <section className="hero-overlay relative overflow-hidden px-4 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
          <Badge variant="primary">Master the movement</Badge>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            Aprende danza con una ruta clara
          </h1>
          <p className="mt-4 max-w-2xl text-base text-[var(--text-2)] sm:text-lg">
            Explora estilos, domina moves y continúa cursos desde donde lo dejaste.
          </p>
          <div className="mt-7 flex w-full max-w-2xl items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur">
            <div className="rounded-xl bg-white/10 p-2 text-[var(--text-3)]">
              <Search size={18} />
            </div>
            <input
              className="h-10 w-full border-none bg-transparent text-sm text-white placeholder:text-[var(--text-3)] focus:outline-none"
              placeholder="Buscar styles, substyles o moves"
            />
            <Button rightIcon={<ArrowRight size={16} />}>Buscar</Button>
          </div>
          <p className="mt-4 text-xs text-[var(--text-3)]">
            Trending: Popping, House Footwork, Ballet Basics
          </p>
        </div>
      </section>

      <section className="mx-auto mt-8 grid w-full max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1.45fr,1fr]">
        <Card>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-2xl font-bold">
                <CirclePlay size={22} className="text-[var(--color-primary-soft)]" />
                Continue Learning
              </h2>
              <Link href="/me" className="text-sm text-[var(--color-primary-soft)]">
                Ver progreso
              </Link>
            </div>
            <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-2)] p-5">
              <div className="flex items-center gap-2">
                <Badge variant="primary">Course</Badge>
                <span className="text-xs text-[var(--text-3)]">visto hace 2 horas</span>
              </div>
              <h3 className="mt-3 text-2xl font-bold text-white">{continueCourse.title}</h3>
              <p className="mt-1 text-sm text-[var(--text-2)]">
                Lesson activa: {continueCourse.lessons[0].title}
              </p>
              <Progress className="mt-6" value={continueCourse.progressPercent} label="Progreso" />
              <div className="mt-5">
                <Link href={`/learn/${continueCourse.slug}`}>
                  <Button rightIcon={<ArrowRight size={16} />}>Reanudar</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-xl font-bold">Accesos rápidos</h2>
            <Link href="/styles" className="block rounded-xl border border-[var(--border-1)] p-4 hover:bg-white/5">
              <p className="flex items-center gap-2 text-lg font-semibold">
                <Compass size={18} />
                Explore Styles
              </p>
              <p className="mt-1 text-sm text-[var(--text-2)]">Catálogo de estilos y subestilos</p>
            </Link>
            <Link href="/learn" className="block rounded-xl border border-[var(--border-1)] p-4 hover:bg-white/5">
              <p className="flex items-center gap-2 text-lg font-semibold">
                <BookOpenText size={18} />
                Learn Academy
              </p>
              <p className="mt-1 text-sm text-[var(--text-2)]">Cursos secuenciados por nivel</p>
            </Link>
            <Link href="/moves" className="block rounded-xl border border-[var(--border-1)] p-4 hover:bg-white/5">
              <p className="flex items-center gap-2 text-lg font-semibold">
                <Sparkles size={18} />
                Step Dictionary
              </p>
              <p className="mt-1 text-sm text-[var(--text-2)]">Diccionario técnico de moves</p>
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto mt-8 w-full max-w-7xl px-4 pb-4 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Trending This Week</h2>
          <Link href="/styles" className="text-sm text-[var(--text-2)] hover:text-[var(--text-1)]">
            Ver todo
          </Link>
        </div>
        <div className="card-grid">
          {stylesMock.slice(0, 4).map((style) => (
            <Link
              href={`/styles/${style.slug}`}
              key={style.slug}
              className="group rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-5 transition-transform hover:-translate-y-1"
            >
              <div className={`h-32 rounded-xl bg-gradient-to-br ${style.image}`} />
              <h3 className="mt-4 text-xl font-bold text-white">{style.name}</h3>
              <p className="mt-1 text-sm text-[var(--text-2)]">{style.summary}</p>
              <p className="mt-3 text-xs text-[var(--text-3)]">{style.classesCount} clases</p>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
