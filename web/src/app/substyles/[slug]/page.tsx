import { notFound } from "next/navigation";
import { Activity, Disc3, Flame, Lock } from "lucide-react";
import { AppShell } from "@/components/layout";
import { LockedState } from "@/components/state/SystemStates";
import { Badge, Card, CardContent, Tabs } from "@/components/ui";
import { getStyleBySlug, getSubstyleBySlug, movesMock } from "@/mocks";

export default async function SubstyleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const substyle = getSubstyleBySlug(slug);

  if (!substyle) {
    notFound();
  }

  const parentStyle = getStyleBySlug(substyle.styleSlug);
  const relatedMoves = movesMock.filter((move) => move.styleSlugs.includes(substyle.styleSlug));

  return (
    <AppShell>
      <article className="space-y-8">
        <section className="rounded-3xl border border-[var(--border-1)] bg-[var(--surface-1)] p-8">
          <Badge variant="primary">{parentStyle?.name ?? "Substyle"}</Badge>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            {substyle.name}
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-[var(--text-2)] md:text-base">
            {substyle.summary}
          </p>
          <Tabs
            className="mt-6"
            activeValue="overview"
            items={[
              { label: "Overview", value: "overview" },
              { label: "Technique", value: "technique" },
              { label: "History", value: "history" },
              { label: "Practice", value: "practice" },
            ]}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardContent>
              <p className="mb-2 flex items-center gap-2 text-lg font-bold text-white">
                <Disc3 size={18} className="text-[var(--color-primary-soft)]" />
                Origin
              </p>
              <p className="text-sm text-[var(--text-2)]">{substyle.origin}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="mb-2 flex items-center gap-2 text-lg font-bold text-white">
                <Activity size={18} className="text-[var(--color-primary-soft)]" />
                Playlist BPM
              </p>
              <p className="text-sm text-[var(--text-2)]">{substyle.playlistBpm}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="mb-2 flex items-center gap-2 text-lg font-bold text-white">
                <Flame size={18} className="text-[var(--color-primary-soft)]" />
                Vibe
              </p>
              <p className="text-sm text-[var(--text-2)]">{substyle.vibe}</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent>
              <h2 className="text-2xl font-bold text-white">Technical Focus</h2>
              <ul className="mt-4 space-y-2">
                {substyle.focus.map((item) => (
                  <li
                    key={item}
                    className="rounded-lg border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-2)]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <h2 className="text-2xl font-bold text-white">Moves asociados</h2>
              <div className="mt-4 space-y-3">
                {relatedMoves.slice(0, 3).map((move) => (
                  <div
                    key={move.slug}
                    className="rounded-lg border border-[var(--border-1)] px-3 py-2 text-sm"
                  >
                    <p className="font-semibold text-white">{move.name}</p>
                    <p className="mt-1 text-[var(--text-2)]">{move.summary}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <LockedState
          title="Step 3 bloqueado"
          subtitle="Debes completar la práctica guiada de sincronización antes de entrar al módulo de freestyle."
          className="max-w-xl"
        />

        <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-2)] p-4 text-sm text-[var(--text-3)]">
          <p className="flex items-center gap-2">
            <Lock size={14} />
            Estado editorial: contenido apto para UI estática, pendiente de validación de citations históricas.
          </p>
        </div>
      </article>
    </AppShell>
  );
}
