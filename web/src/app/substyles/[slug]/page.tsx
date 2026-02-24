import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, Disc3, Flame, Lock } from "lucide-react";
import { AppShell } from "@/components/layout";
import { LockedState } from "@/components/state/SystemStates";
import { Badge, Card, CardContent, Tabs } from "@/components/ui";
import {
  getMovesCatalog,
  getStyleDetailBySlug,
  getSubstyleDetailBySlug,
} from "@/server/db/catalog";

export default async function SubstyleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const substyle = await getSubstyleDetailBySlug(slug);

  if (!substyle) {
    notFound();
  }

  const [parentStyle, moves] = await Promise.all([
    getStyleDetailBySlug(substyle.styleSlug),
    getMovesCatalog(),
  ]);
  const relatedMoves = moves.filter((move) => move.styleSlugs.includes(substyle.styleSlug));

  return (
    <AppShell>
      <article className="space-y-8">
        <section className="rounded-3xl border border-[var(--border-1)] bg-[var(--surface-1)] p-8">
          <Badge variant="primary">{parentStyle?.name ?? "Subestilo"}</Badge>
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
              { label: "Resumen", value: "overview", href: "#overview" },
              { label: "Tecnica", value: "technique", href: "#technique" },
              { label: "Historia", value: "history", href: "#history" },
              { label: "Practica", value: "practice", href: "#practice" },
            ]}
          />
        </section>

        <section id="overview" className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardContent id="history">
              <p className="mb-2 flex items-center gap-2 text-lg font-bold text-white">
                <Disc3 size={18} className="text-[var(--color-primary-soft)]" />
                Origen
              </p>
              <p className="text-sm text-[var(--text-2)]">{substyle.origin}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent id="practice">
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

        <section id="technique" className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent>
              <h2 className="text-2xl font-bold text-white">Enfoque tecnico</h2>
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
              <h2 className="text-2xl font-bold text-white">Movimientos asociados</h2>
              <div className="mt-4 space-y-3">
                {relatedMoves.slice(0, 3).map((move) => (
                  <Link
                    key={move.slug}
                    href={`/moves/${move.slug}`}
                    className="block rounded-lg border border-[var(--border-1)] px-3 py-2 text-sm hover:bg-white/5"
                  >
                    <p className="font-semibold text-white">{move.name}</p>
                    <p className="mt-1 text-[var(--text-2)]">{move.summary}</p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <LockedState
          title="Paso 3 bloqueado"
          subtitle="Debes completar la practica guiada de sincronizacion antes de entrar al modulo de freestyle."
          className="max-w-xl"
        />

        <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-2)] p-4 text-sm text-[var(--text-3)]">
          <p className="flex items-center gap-2">
            <Lock size={14} />
            Estado editorial: contenido apto para UI estatica, pendiente de validacion de citations historicas.
          </p>
        </div>
      </article>
    </AppShell>
  );
}