"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Crosshair, Minus, Pause, Play, Plus, Route, Sparkles } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import {
  DANCE_MAP_CONNECTIONS,
  DANCE_MAP_DEFAULT_NODE_ID,
  DANCE_MAP_INITIAL_YEAR,
  DANCE_MAP_LAYERS,
  DANCE_MAP_NODES,
  DANCE_MAP_YEAR_MAX,
  DANCE_MAP_YEAR_MIN,
  type DanceMapConnection,
  type DanceMapConnectionType,
  type DanceMapLayerId,
  type DanceMapNode,
} from "@/lib/maps/provisional-lineage";
import { cn } from "@/lib/cn";

const ZOOM_LEVELS = [90, 100, 110, 125] as const;
const TIMELINE_TICKS = [1920, 1940, 1960, 1980, 2000, 2020] as const;
const CONNECTION_COLORS: Record<DanceMapConnectionType, string> = {
  creacion: "#89ddff",
  migracion: "#3bc8ff",
  fusion: "#7bd5ff",
  ramificacion: "#5ab8ff",
  expansion: "#30a3ff",
  influencia: "#7cc8ff",
};
const CONNECTION_DASH: Partial<Record<DanceMapConnectionType, string>> = {
  migracion: "5 6",
  fusion: "8 5",
  ramificacion: "3 5",
};

function clampYear(value: number) {
  return Math.min(DANCE_MAP_YEAR_MAX, Math.max(DANCE_MAP_YEAR_MIN, Math.round(value)));
}

function getCurvePath(from: DanceMapNode, to: DanceMapNode) {
  const controlX = (from.x + to.x) / 2;
  const arc = Math.max(6, Math.abs(to.x - from.x) * 0.22);
  const controlY = Math.min(from.y, to.y) - arc;
  return `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;
}

function getLevelIndex(level: number) {
  const index = ZOOM_LEVELS.findIndex((value) => value === level);
  return index === -1 ? 1 : index;
}

export function InteractiveLineageMap() {
  const [selectedLayerId, setSelectedLayerId] = useState<DanceMapLayerId>("global-lineage");
  const [selectedNodeId, setSelectedNodeId] = useState<string>(DANCE_MAP_DEFAULT_NODE_ID);
  const [currentYear, setCurrentYear] = useState<number>(DANCE_MAP_INITIAL_YEAR);
  const [zoom, setZoom] = useState<number>(100);
  const [playing, setPlaying] = useState(false);

  const nodesById = useMemo(() => new Map(DANCE_MAP_NODES.map((node) => [node.id, node])), []);

  const selectedLayer = useMemo(
    () => DANCE_MAP_LAYERS.find((layer) => layer.id === selectedLayerId) ?? DANCE_MAP_LAYERS[0],
    [selectedLayerId],
  );

  const visibleNodes = useMemo(
    () =>
      DANCE_MAP_NODES.filter(
        (node) => node.layers.includes(selectedLayerId) && node.startYear <= currentYear,
      ).sort((a, b) => a.startYear - b.startYear),
    [currentYear, selectedLayerId],
  );

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((node) => node.id)), [visibleNodes]);

  const visibleConnections = useMemo(
    () =>
      DANCE_MAP_CONNECTIONS.filter((connection) => {
        if (!connection.layers.includes(selectedLayerId)) {
          return false;
        }

        if (connection.startYear > currentYear) {
          return false;
        }

        if (connection.endYear !== undefined && connection.endYear < currentYear) {
          return false;
        }

        return visibleNodeIds.has(connection.from) && visibleNodeIds.has(connection.to);
      }),
    [currentYear, selectedLayerId, visibleNodeIds],
  );

  const activeNode = useMemo(() => {
    if (visibleNodeIds.has(selectedNodeId)) {
      return nodesById.get(selectedNodeId) ?? null;
    }

    return visibleNodes.at(-1) ?? null;
  }, [nodesById, selectedNodeId, visibleNodeIds, visibleNodes]);

  useEffect(() => {
    if (!playing) {
      return;
    }

    const timer = window.setInterval(() => {
      setCurrentYear((previousYear) =>
        previousYear >= DANCE_MAP_YEAR_MAX ? DANCE_MAP_YEAR_MIN : previousYear + 1,
      );
    }, 650);

    return () => {
      window.clearInterval(timer);
    };
  }, [playing]);

  const relatedConnections = useMemo(() => {
    if (!activeNode) {
      return [] as DanceMapConnection[];
    }

    return visibleConnections.filter(
      (connection) => connection.from === activeNode.id || connection.to === activeNode.id,
    );
  }, [activeNode, visibleConnections]);

  const timelineHighlights = useMemo(() => {
    return DANCE_MAP_CONNECTIONS.filter(
      (connection) =>
        connection.layers.includes(selectedLayerId) &&
        Math.abs(connection.startYear - currentYear) <= 2,
    ).slice(0, 4);
  }, [currentYear, selectedLayerId]);

  const progress =
    ((currentYear - DANCE_MAP_YEAR_MIN) / (DANCE_MAP_YEAR_MAX - DANCE_MAP_YEAR_MIN)) * 100;

  const zoomIn = () => {
    const nextIndex = Math.min(ZOOM_LEVELS.length - 1, getLevelIndex(zoom) + 1);
    setZoom(ZOOM_LEVELS[nextIndex]);
  };

  const zoomOut = () => {
    const nextIndex = Math.max(0, getLevelIndex(zoom) - 1);
    setZoom(ZOOM_LEVELS[nextIndex]);
  };

  const toDefaultZoom = () => {
    setZoom(100);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#060d1d]">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: "radial-gradient(rgba(40,84,120,0.85) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_15%,rgba(34,114,255,0.3),transparent_42%),radial-gradient(circle_at_90%_70%,rgba(0,224,255,0.2),transparent_45%)]" />

      <div className="absolute left-4 top-4 z-20 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-[var(--border-1)] bg-[rgba(18,21,34,0.92)] p-2 backdrop-blur">
        {DANCE_MAP_LAYERS.map((layer) => {
          const selected = selectedLayer.id === layer.id;
          return (
            <button
              key={layer.id}
              type="button"
              onClick={() => setSelectedLayerId(layer.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                selected
                  ? "bg-[var(--color-primary)]/20 text-[var(--color-primary-soft)]"
                  : "text-[var(--text-2)] hover:bg-white/5",
              )}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: layer.accentColor }} />
              <span className="font-semibold">{layer.label}</span>
            </button>
          );
        })}
        <p className="px-3 pb-2 pt-1 text-xs text-[var(--text-3)]">{selectedLayer.description}</p>
      </div>

      <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
        <MapToolButton label="Acercar" icon={<Plus size={16} />} onClick={zoomIn} />
        <MapToolButton label="Alejar" icon={<Minus size={16} />} onClick={zoomOut} />
        <MapToolButton label="Centrar" icon={<Crosshair size={16} />} onClick={toDefaultZoom} />
      </div>

      <div className="absolute inset-0 z-10 origin-center transition-transform duration-300" style={{ transform: `scale(${zoom / 100})` }}>
        <div className="pointer-events-none absolute inset-0">
          <Image
            src="/media/maps/world-tech.svg"
            alt="Mapa mundial de referencia"
            fill
            priority
            className="object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,184,255,0.22),transparent_58%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,10,24,0.12),rgba(4,10,24,0.58))]" />
        </div>

        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0 20 H100" fill="none" stroke="rgba(115,170,210,0.35)" strokeWidth="0.1" />
          <path d="M0 40 H100" fill="none" stroke="rgba(115,170,210,0.35)" strokeWidth="0.1" />
          <path d="M0 60 H100" fill="none" stroke="rgba(115,170,210,0.35)" strokeWidth="0.1" />
          <path d="M0 80 H100" fill="none" stroke="rgba(115,170,210,0.35)" strokeWidth="0.1" />
        </svg>

        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {visibleConnections.map((connection) => {
            const fromNode = nodesById.get(connection.from);
            const toNode = nodesById.get(connection.to);
            if (!fromNode || !toNode) {
              return null;
            }

            const stroke = CONNECTION_COLORS[connection.type];
            const dashPattern = CONNECTION_DASH[connection.type];
            const width = 0.35 + connection.strength * 0.15;

            return (
              <path
                key={connection.id}
                d={getCurvePath(fromNode, toNode)}
                fill="none"
                stroke={stroke}
                strokeWidth={width}
                strokeDasharray={dashPattern}
                strokeOpacity={connection.strength >= 4 ? 0.92 : 0.68}
                style={{ filter: "drop-shadow(0 0 6px rgba(68,196,255,0.55))" }}
              />
            );
          })}
        </svg>

        {visibleNodes.map((node) => {
          const active = activeNode?.id === node.id;
          const bornNow = currentYear - node.startYear <= 1;

          return (
            <button
              key={node.id}
              type="button"
              className="group absolute z-20 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              onClick={() => setSelectedNodeId(node.id)}
            >
              <span
                className={cn(
                  "relative block rounded-full border-2 transition-all",
                  active
                    ? "h-4 w-4 border-[#67ccff] bg-white shadow-[0_0_22px_rgba(57,190,255,0.95)]"
                    : "h-3 w-3 border-[#8ec8ff]/70 bg-[#4ebdff]",
                )}
              >
                {active || bornNow ? (
                  <span className="absolute inset-0 animate-ping rounded-full bg-[#5dc6ff]/55" />
                ) : null}
              </span>
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-3 w-max -translate-x-1/2 rounded-lg border border-[var(--border-1)] bg-[var(--surface-1)] px-3 py-1.5 text-left opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                <span className="block text-xs font-bold text-white">{node.city}</span>
                <span className="block text-[10px] uppercase tracking-[0.1em] text-[var(--color-primary-soft)]">
                  {node.label}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <aside className="absolute bottom-24 right-4 top-4 z-20 hidden w-[360px] overflow-hidden rounded-2xl border border-[var(--border-1)] bg-[rgba(18,21,34,0.96)] xl:flex xl:flex-col">
        <div className="border-b border-[var(--border-1)] p-5">
          <Badge variant="primary">Nodo activo</Badge>
          <h2 className="mt-3 text-3xl font-black text-white">{activeNode?.city ?? "Sin nodo visible"}</h2>
          <p className="mt-1 text-sm text-[var(--text-2)]">
            {activeNode ? `${activeNode.label} · ${activeNode.startYear}` : "Mueve la barra para activar nodos."}
          </p>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {activeNode ? (
            <>
              <div className="relative aspect-video overflow-hidden rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)]">
                <Image src={activeNode.imageUrl} alt={activeNode.label} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-2 left-2 rounded-full bg-black/50 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">
                  {activeNode.region}
                </div>
              </div>

              <section>
                <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-3)]">Origenes</h3>
                <p className="mt-2 text-sm text-[var(--text-2)]">{activeNode.origins}</p>
              </section>

              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-3)]">Conexiones activas</h3>
                {relatedConnections.length ? (
                  relatedConnections.map((connection) => {
                    const fromNode = nodesById.get(connection.from);
                    const toNode = nodesById.get(connection.to);
                    if (!fromNode || !toNode) {
                      return null;
                    }

                    return (
                      <div key={connection.id} className="rounded-lg border border-[var(--border-1)] px-3 py-2">
                        <p className="text-sm font-semibold text-white">
                          {fromNode.city} {"->"} {toNode.city}
                        </p>
                        <p className="text-xs text-[var(--text-3)]">
                          {connection.type} · {connection.startYear}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-[var(--text-3)]">Aun no hay conexiones activas para este nodo.</p>
                )}
              </section>

              {activeNode.styleSlug ? (
                <Link href={`/styles/${activeNode.styleSlug}`}>
                  <Button className="w-full" rightIcon={<Route size={15} />} type="button">
                    Ver estilo relacionado
                  </Button>
                </Link>
              ) : null}
            </>
          ) : (
            <div className="rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] p-4 text-sm text-[var(--text-2)]">
              En esta etapa todavia no hay nodos visibles para la capa seleccionada.
            </div>
          )}
        </div>
      </aside>

      <div className="absolute bottom-0 left-0 z-30 w-full bg-gradient-to-t from-[var(--surface-0)] via-[var(--surface-0)]/90 to-transparent px-4 pb-5 pt-12">
        <div className="mx-auto w-full max-w-5xl rounded-2xl border border-[var(--border-1)] bg-[rgba(18,21,34,0.9)] p-4 backdrop-blur">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                leftIcon={playing ? <Pause size={14} /> : <Play size={14} />}
                type="button"
                onClick={() => setPlaying((state) => !state)}
              >
                {playing ? "Pausar historia" : "Reproducir historia"}
              </Button>
              <span className="rounded-full border border-[var(--border-1)] px-3 py-1 text-xs text-[var(--text-3)]">
                Zoom {zoom}%
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.1em] text-[var(--text-3)]">Era actual</p>
              <p data-testid="lineage-current-year" className="text-3xl font-black text-white tabular-nums">
                {currentYear}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="range"
              min={DANCE_MAP_YEAR_MIN}
              max={DANCE_MAP_YEAR_MAX}
              value={currentYear}
              onChange={(event) => setCurrentYear(clampYear(Number(event.target.value)))}
              onInput={(event) =>
                setCurrentYear(clampYear(Number((event.target as HTMLInputElement).value)))
              }
              data-testid="lineage-timeline-slider"
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-[var(--color-primary)]"
              style={{
                background: `linear-gradient(to right, var(--color-primary) ${progress}%, rgba(255,255,255,0.2) ${progress}%)`,
              }}
              aria-label="Linea de tiempo de la danza"
            />
            <div className="flex items-center justify-between text-[10px] text-[var(--text-3)] sm:text-xs">
              {TIMELINE_TICKS.map((tick) => (
                <span key={tick} className={tick === currentYear ? "font-bold text-white" : undefined}>
                  {tick}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-[var(--text-3)]">
                <Sparkles size={14} className="text-[var(--color-primary-soft)]" />
                Grafo provisional: se reemplazara por investigacion historica validada.
              </div>
              <Link href="/maps/steps">
                <Button variant="outline" size="sm" type="button">
                  Abrir mapa por pasos
                </Button>
              </Link>
            </div>

            {timelineHighlights.length ? (
              <div className="grid gap-2 md:grid-cols-2">
                {timelineHighlights.map((connection) => {
                  const from = nodesById.get(connection.from);
                  const to = nodesById.get(connection.to);
                  if (!from || !to) {
                    return null;
                  }

                  return (
                    <div key={connection.id} className="rounded-lg border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2">
                      <p className="text-xs font-semibold text-white">
                        {connection.startYear} · {connection.type}
                      </p>
                      <p className="text-xs text-[var(--text-2)]">
                        {from.city} {"->"} {to.city}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-3)]">
                Sin hitos cercanos para esta era. Mueve la barra para explorar cambios historicos.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MapToolButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--border-1)] bg-[rgba(18,21,34,0.92)] text-[var(--text-2)] shadow-lg transition-colors hover:bg-white/10 hover:text-white"
    >
      {icon}
    </button>
  );
}

