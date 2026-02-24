import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpenText,
  CirclePlay,
  Compass,
  Search,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout";
import { Badge, Button, Progress } from "@/components/ui";
import {
  HOME_CONTINUE_IMAGE_URL,
  HOME_HERO_IMAGE_URL,
  HOME_QUICK_ACCESS_IMAGES,
  HOME_TRENDING_IMAGE_CYCLE,
} from "@/lib/content-images";
import { getCurrentUser } from "@/server/auth/current-user";
import { getCoursesCatalog, getStylesCatalog } from "@/server/db/catalog";
import { getUserDashboardSummary } from "@/server/db/profile";

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

const QUICK_ACCESS = [
  {
    href: "/styles",
    title: "Explora estilos",
    cta: "Explorar biblioteca",
    imageUrl: HOME_QUICK_ACCESS_IMAGES.styles,
    icon: Compass,
  },
  {
    href: "/learn",
    title: "Academia de aprendizaje",
    cta: "Ver cursos",
    imageUrl: HOME_QUICK_ACCESS_IMAGES.academy,
    icon: BookOpenText,
  },
  {
    href: "/moves",
    title: "Diccionario de pasos",
    cta: "Buscar movimiento",
    imageUrl: HOME_QUICK_ACCESS_IMAGES.dictionary,
    icon: Sparkles,
  },
] as const;

export default async function HomePage() {
  const currentUser = await getCurrentUser();
  const [courses, styles, summary] = await Promise.all([
    getCoursesCatalog(currentUser?.id),
    getStylesCatalog(),
    currentUser ? getUserDashboardSummary(currentUser.id) : Promise.resolve(null),
  ]);

  const continueCourse =
    (summary?.activeCourseSlug
      ? courses.find((course) => course.slug === summary.activeCourseSlug)
      : undefined) ?? courses[0];

  const trendingStyles = styles.slice(0, 4);

  return (
    <AppShell fullWidth className="px-0 py-0 sm:px-0">
      <section className="relative flex h-[540px] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={HOME_HERO_IMAGE_URL}
            alt="Dancers performing in an urban setting"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-0)] via-[rgba(8,9,17,0.6)] to-[rgba(8,9,17,0.45)]" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-6 text-center">
          <h1 className="text-5xl font-black tracking-tight text-white drop-shadow-[0_6px_28px_rgba(0,0,0,0.55)] sm:text-7xl">
            Domina el movimiento
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-[var(--text-2)] drop-shadow-[0_3px_16px_rgba(0,0,0,0.4)] sm:text-2xl">
            Explora la enciclopedia definitiva de danza y entrena en una academia digital.
          </p>

          <form
            action="/search"
            className="mt-8 flex w-full max-w-3xl items-center gap-2 rounded-full border border-white/15 bg-white/10 p-2 backdrop-blur"
          >
            <div className="rounded-full bg-white/10 p-2 text-[var(--text-3)]">
              <Search size={20} />
            </div>
            <input
              className="h-11 w-full border-none bg-transparent text-base text-white placeholder:text-[var(--text-3)] focus:outline-none"
              placeholder="Buscar estilos, pasos o cursos..."
              name="q"
            />
            <Button className="rounded-full px-8" rightIcon={<ArrowRight size={16} />} type="submit">
              Buscar
            </Button>
          </form>

          <p className="mt-4 text-sm text-[var(--text-3)]">
            Tendencias: Popping, Ballet basico, House footwork
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1280px] space-y-14 px-4 py-10 sm:px-6 lg:px-8">
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-3xl font-bold text-white">
              <CirclePlay size={24} className="text-[var(--color-primary-soft)]" />
              Continuar aprendizaje
            </h2>
            <Link href="/me" className="text-sm font-semibold text-[var(--color-primary-soft)] hover:text-white">
              Ver todo el progreso
            </Link>
          </div>

          {continueCourse ? (
            <div className="group grid overflow-hidden rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] md:grid-cols-[1.5fr,1fr]">
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3">
                  <Badge variant="primary">Curso</Badge>
                  <span className="text-xs text-[var(--text-3)]">visto hace 2 horas</span>
                </div>

                <h3 className="mt-4 text-4xl font-black leading-tight text-white">{continueCourse.title}</h3>
                <p className="mt-2 text-lg text-[var(--text-2)]">
                  Leccion activa: {continueCourse.lessons[0]?.title ?? "Sin lecciones"}
                </p>

                <Progress className="mt-7 max-w-lg" value={continueCourse.progressPercent} label="Progreso" />

                <div className="mt-7">
                  <Link href={buildCourseResumeHref(continueCourse)}>
                    <Button className="rounded-lg px-7" rightIcon={<ArrowRight size={16} />}>
                      Reanudar leccion
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="relative min-h-[230px]">
                <Image
                  src={HOME_CONTINUE_IMAGE_URL}
                  alt="Dancer practicing movement control in studio"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-black/10 via-black/25 to-[var(--surface-1)]/40" />
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6 text-sm text-[var(--text-2)]">
              Aun no hay cursos disponibles para continuar.
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-6 text-4xl font-black tracking-tight text-white">Explora la plataforma</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {QUICK_ACCESS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group relative flex h-[420px] flex-col justify-end overflow-hidden rounded-2xl border border-[var(--border-1)]"
                >
                  <Image src={item.imageUrl} alt={item.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(8,9,17,0.95)] via-[rgba(8,9,17,0.55)] to-transparent" />
                  <div className="relative z-10 p-6">
                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 bg-white/10 backdrop-blur">
                      <Icon size={20} className="text-white" />
                    </div>
                    <h3 className="text-4xl font-black leading-none text-white">{item.title}</h3>
                    <p className="mt-6 inline-flex items-center text-base font-semibold text-white/90 group-hover:text-[var(--color-primary-soft)]">
                      {item.cta} <ArrowRight size={14} className="ml-1" />
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="border-t border-[var(--border-1)] pt-10">
          <h2 className="mb-5 text-3xl font-black text-white">Tendencias de esta semana</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {trendingStyles.map((style, index) => (
              <Link key={style.slug} href={`/styles/${style.slug}`} className="group">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[var(--border-1)] bg-[var(--surface-1)]">
                  <Image
                    src={style.imageUrl ?? HOME_TRENDING_IMAGE_CYCLE[index % HOME_TRENDING_IMAGE_CYCLE.length]}
                    alt={style.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                </div>
                <h3 className="mt-2 text-xl font-bold text-white group-hover:text-[var(--color-primary-soft)]">
                  {style.name}
                </h3>
                <p className="text-sm text-[var(--text-3)]">
                  {style.category} • {style.classesCount} clases
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
