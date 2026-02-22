import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Flame, Info, Music4, UserRound } from "lucide-react";
import { AppShell } from "@/components/layout";
import { Badge, Button, Card, CardContent, CardTitle } from "@/components/ui";
import { getMoveBySlug, stylesMock } from "@/mocks";

export default async function MoveDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const move = getMoveBySlug(slug);

  if (!move) {
    notFound();
  }

  const styles = stylesMock.filter((style) => move.styleSlugs.includes(style.slug));

  return (
    <AppShell>
      <article className="space-y-8">
        <section className="hero-overlay rounded-3xl border border-[var(--border-1)] p-8">
          <Link href="/moves" className="mb-5 inline-flex">
            <Button variant="ghost" leftIcon={<ArrowLeft size={16} />}>
              Back to dictionary
            </Button>
          </Link>
          <div className="grid gap-6 lg:grid-cols-[1.3fr,1fr]">
            <div>
              <Badge variant="primary">{move.family}</Badge>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">{move.name}</h1>
              <p className="mt-3 max-w-2xl text-sm text-[var(--text-2)] md:text-base">{move.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {styles.map((style) => (
                  <Badge key={style.slug} variant="neutral">
                    {style.name}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-black/20 p-4">
              <div className="h-full min-h-[220px] rounded-xl bg-gradient-to-br from-[var(--color-primary)]/70 to-cyan-500/35" />
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.55fr,1fr]">
          <Card>
            <CardContent>
              <CardTitle>Step-by-Step Technique</CardTitle>
              <ol className="mt-4 space-y-3">
                {move.stepByStep.map((step, index) => (
                  <li key={step} className="rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-3)]">
                      Step {index + 1}
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-2)]">{step}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardContent>
                <p className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.08em] text-[var(--text-3)]">
                  <UserRound size={14} />
                  Instructor
                </p>
                <p className="text-lg font-bold text-white">Coach Nyx</p>
                <p className="mt-1 text-sm text-[var(--text-2)]">Especialista en freestyle y groove.</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <p className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.08em] text-[var(--text-3)]">
                  <Flame size={14} />
                  Variations
                </p>
                <div className="space-y-2 text-sm text-[var(--text-2)]">
                  <p className="rounded-lg border border-[var(--border-1)] px-3 py-2">Shuffle diagonal</p>
                  <p className="rounded-lg border border-[var(--border-1)] px-3 py-2">Shuffle heel-toe</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <p className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.08em] text-[var(--text-3)]">
                  <Music4 size={14} />
                  Move Info
                </p>
                <p className="text-sm text-[var(--text-2)]">Tipo: {move.moveType}</p>
                <p className="text-sm text-[var(--text-2)]">Dificultad: {move.difficulty}</p>
                <p className="text-sm text-[var(--text-2)]">BPM ideal: {move.bpmRange}</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent>
              <CardTitle>Common Mistakes</CardTitle>
              <div className="mt-4 space-y-3">
                {move.commonMistakes.map((item) => (
                  <div key={item.issue} className="rounded-xl border border-[var(--border-1)] p-4">
                    <p className="text-sm font-semibold text-rose-300">{item.issue}</p>
                    <p className="mt-1 text-sm text-[var(--text-2)]">{item.correction}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <CardTitle className="flex items-center gap-2">
                <Info size={18} className="text-[var(--color-primary-soft)]" />
                Technical Note
              </CardTitle>
              <p className="mt-4 text-sm text-[var(--text-2)]">
                Practica con metronomo en bloques de 4x8 para estabilizar ejecucion y evitar desalineacion.
              </p>
              <Button className="mt-5">Mark as practiced</Button>
            </CardContent>
          </Card>
        </section>
      </article>
    </AppShell>
  );
}
