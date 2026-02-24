import Link from "next/link";
import { ArrowRight, Crosshair, Download, Minus, Plus, Share2 } from "lucide-react";
import { AppShell } from "@/components/layout";
import { Badge, Button, Card, CardContent } from "@/components/ui";

type StepMapSearchParams = Promise<{
  node?: string;
  zoom?: string;
  year?: string;
  exported?: string;
}>;

const nodes = [
  {
    id: "backslide",
    title: "The Backslide",
    year: "1979",
    tag: "Foundation",
    summary: "The original mechanical walking technique from The Electric Boogaloos.",
    x: "14%",
    y: "22%",
    compact: false,
    moveSlug: "the-shuffle",
  },
  {
    id: "moonwalk",
    title: "The Moonwalk",
    year: "1983",
    tag: "Iconic",
    summary: "Popularized globally by Michael Jackson.",
    x: "40%",
    y: "38%",
    compact: false,
    moveSlug: "arm-wave",
  },
  {
    id: "glide",
    title: "The Glide",
    year: "1981",
    tag: "Influence",
    summary: "Side-to-side floating variation.",
    x: "40%",
    y: "12%",
    compact: false,
    moveSlug: "the-jack",
  },
  {
    id: "circle-moonwalk",
    title: "Circle Moonwalk",
    year: "1986",
    tag: "Derived",
    summary: "Circular footwork adaptation.",
    x: "64%",
    y: "30%",
    compact: true,
    moveSlug: "cross-body-lead",
  },
  {
    id: "side-walk",
    title: "Side Walk",
    year: "1985",
    tag: "Derived",
    summary: "Lateral version with groove emphasis.",
    x: "64%",
    y: "48%",
    compact: true,
    moveSlug: "baby-freeze",
  },
] as const;

function clampZoom(value: number) {
  const allowed = [90, 100, 110, 125];
  return allowed.includes(value) ? value : 100;
}

function clampYear(value: number) {
  return Math.min(2024, Math.max(1970, value));
}

export default async function StepEvolutionMapPage({
  searchParams,
}: {
  searchParams: StepMapSearchParams;
}) {
  const params = await searchParams;
  const selectedNode = nodes.find((node) => node.id === params.node) ?? nodes[0];
  const zoom = clampZoom(Number(params.zoom ?? 100));
  const year = clampYear(Number(params.year ?? Number(selectedNode.year)));
  const exported = params.exported === "1";

  const buildHref = (next: Partial<{ node: string; zoom: string; year: string; exported: string }>) => {
    const values = {
      node: next.node ?? selectedNode.id,
      zoom: next.zoom ?? String(zoom),
      year: next.year ?? String(year),
      exported: next.exported,
    };
    const query = new URLSearchParams();

    query.set("node", values.node);
    query.set("zoom", values.zoom);
    query.set("year", values.year);
    if (values.exported) {
      query.set("exported", values.exported);
    }

    return `/maps/steps?${query.toString()}`;
  };

  const shareHref = `mailto:?subject=${encodeURIComponent("Dance map")}&body=${encodeURIComponent(
    `Revisa este nodo: ${selectedNode.title} (${selectedNode.year})`,
  )}`;

  return (
    <AppShell fullWidth hideFooter className="max-w-none px-0 pb-0 pt-0">
      <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[var(--surface-0)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(45,52,78,0.8) 1px, transparent 1px), linear-gradient(to bottom, rgba(45,52,78,0.8) 1px, transparent 1px)",
            backgroundSize: "38px 38px",
          }}
        />

        <div className="absolute left-6 right-6 top-6 z-20 rounded-2xl border border-[var(--border-1)] bg-[rgba(18,21,34,0.92)] px-5 py-4 backdrop-blur xl:right-[408px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-[var(--text-3)]">Encyclopedia / Popping / {selectedNode.title}</p>
              <h1 className="mt-1 text-3xl font-black text-white">Evolution of {selectedNode.title}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={shareHref}>
                <Button variant="outline" size="sm" leftIcon={<Share2 size={14} />} type="button">
                  Share Map
                </Button>
              </a>
              <Link href={buildHref({ exported: "1" })}>
                <Button variant="outline" size="sm" leftIcon={<Download size={14} />} type="button">
                  Export
                </Button>
              </Link>
            </div>
          </div>
          {exported ? (
            <p className="mt-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
              Export mock generado para {selectedNode.title}.
            </p>
          ) : null}
        </div>

        <div className="absolute inset-0 top-24 overflow-auto px-6 pb-28 pt-8 xl:right-[390px]">
          <div
            className="relative min-h-[720px] min-w-[980px] origin-top-left transition-transform duration-300"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1000 760">
              <path d="M220 210 C 320 210, 320 390, 420 390" fill="none" stroke="rgba(109,76,255,0.9)" strokeWidth="2" />
              <path d="M220 210 C 320 210, 320 140, 420 140" fill="none" stroke="rgba(109,76,255,0.55)" strokeWidth="2" />
              <path d="M560 390 C 620 390, 620 300, 700 300" fill="none" stroke="rgba(109,76,255,0.5)" strokeWidth="2" />
              <path d="M560 390 C 620 390, 620 470, 700 470" fill="none" stroke="rgba(109,76,255,0.5)" strokeWidth="2" />
            </svg>

            {nodes.map((node) => {
              const active = selectedNode.id === node.id;
              return (
                <Link
                  key={node.id}
                  href={buildHref({ node: node.id })}
                  className={`absolute rounded-xl border transition-all hover:-translate-y-1 hover:border-[var(--color-primary)] ${
                    node.compact
                      ? "w-52 border-[var(--border-1)] bg-[rgba(18,21,34,0.86)] p-3"
                      : "w-60 border-[var(--border-1)] bg-[rgba(18,21,34,0.92)] p-4"
                  } ${active ? "shadow-[0_0_24px_rgba(109,76,255,0.35)]" : ""}`}
                  style={{ left: node.x, top: node.y }}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Badge variant={active ? "primary" : "neutral"}>{node.tag}</Badge>
                    <span className="text-xs font-bold text-[var(--text-3)]">{node.year}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white">{node.title}</h2>
                  <p className="mt-1 text-xs text-[var(--text-2)]">{node.summary}</p>
                </Link>
              );
            })}
          </div>
        </div>

        <aside className="absolute bottom-0 right-0 top-0 z-20 hidden w-[390px] border-l border-[var(--border-1)] bg-[rgba(18,21,34,0.96)] xl:flex xl:flex-col">
          <div className="hero-overlay relative h-56 border-b border-[var(--border-1)]" />
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            <div>
              <Badge variant="primary">Selected</Badge>
              <h2 className="mt-2 text-3xl font-black text-white">{selectedNode.title}</h2>
              <p className="text-sm text-[var(--text-2)]">Evolution node - {selectedNode.year}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link href={`/moves/${selectedNode.moveSlug}`}>
                <Button size="sm" className="w-full" type="button">Learn Move</Button>
              </Link>
              <Link href={`/me/achievements?savedMove=${selectedNode.id}`}>
                <Button size="sm" variant="outline" className="w-full" type="button">
                  Save
                </Button>
              </Link>
            </div>

            <Card>
              <CardContent className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)]">Difficulty</p>
                  <p className="mt-1 text-sm font-bold text-amber-300">MIX</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)]">Year</p>
                  <p className="mt-1 text-sm font-bold text-white">{selectedNode.year}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)]">Style</p>
                  <p className="mt-1 text-sm font-bold text-white">Illusion</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-3)]">Historical Context</h3>
                <p className="text-sm text-[var(--text-2)]">
                  The Backslide becomes globally recognized as Moonwalk and later inspires multiple illusion-based
                  branches in street and stage choreography.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-3)]">Relationships</h3>
                <RelationRow title="The Backslide" note="Foundation - 1979" />
                <RelationRow title="Circle Moonwalk" note="Derived - 1986" />
                <RelationRow title="Side Walk" note="Derived - 1985" />
              </CardContent>
            </Card>
          </div>
        </aside>

        <div className="absolute bottom-6 left-6 right-6 z-20 rounded-2xl border border-[var(--border-1)] bg-[rgba(18,21,34,0.92)] p-4 backdrop-blur xl:right-[406px]">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-3)]">Timeline</p>
            <p className="text-xs text-[var(--text-3)]">{year} selected</p>
          </div>

          <form action="/maps/steps" className="space-y-2">
            <input type="hidden" name="node" value={selectedNode.id} />
            <input type="hidden" name="zoom" value={zoom} />
            <input
              type="range"
              name="year"
              min={1970}
              max={2024}
              defaultValue={year}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/20"
              aria-label="Map timeline"
            />
            <div className="flex justify-between text-[10px] text-[var(--text-3)]">
              <span>1970</span>
              <span>1980</span>
              <span>1990</span>
              <span>2000</span>
              <span>2010</span>
              <span>2020</span>
            </div>
            <Button variant="outline" size="sm" type="submit">
              Aplicar timeline
            </Button>
          </form>
        </div>

        <div className="absolute bottom-28 left-6 z-20 flex flex-col gap-2">
          <MapAction label="Zoom in" icon={<Plus size={16} />} href={buildHref({ zoom: String(clampZoom(zoom + 10)) })} />
          <MapAction label="Zoom out" icon={<Minus size={16} />} href={buildHref({ zoom: String(clampZoom(zoom - 10)) })} />
          <MapAction label="Center" icon={<Crosshair size={16} />} href={buildHref({ zoom: "100" })} />
        </div>
      </div>
    </AppShell>
  );
}

function RelationRow({ title, note }: { title: string; note: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--border-1)] px-3 py-2">
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-[var(--text-3)]">{note}</p>
      </div>
      <ArrowRight size={14} className="text-[var(--text-3)]" />
    </div>
  );
}

function MapAction({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--border-1)] bg-[rgba(18,21,34,0.92)] text-[var(--text-2)] shadow-lg transition-colors hover:bg-white/10 hover:text-white"
    >
      {icon}
    </Link>
  );
}
