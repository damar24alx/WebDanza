import Link from "next/link";
import Image from "next/image";
import { Search, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/layout";
import { EmptyState } from "@/components/states";
import { Badge, Button, Card, CardContent, Input } from "@/components/ui";
import { getMovesCatalog } from "@/server/db/catalog";

type MovesSearchParams = Promise<{
  q?: string;
  family?: string;
  difficulty?: string;
  sort?: string;
  view?: string;
}>;

const sortOptions = ["recommended", "difficulty", "alphabetical"];

export default async function MovesPage({
  searchParams,
}: {
  searchParams: MovesSearchParams;
}) {
  const params = await searchParams;
  const moves = await getMovesCatalog();
  const query = (params.q ?? "").trim().toLowerCase();
  const selectedFamily = (params.family ?? "all").toLowerCase();
  const selectedDifficulty = (params.difficulty ?? "all").toLowerCase();
  const selectedSort = sortOptions.includes((params.sort ?? "").toLowerCase())
    ? (params.sort ?? "recommended").toLowerCase()
    : "recommended";
  const selectedView = (params.view ?? "grid").toLowerCase() === "list" ? "list" : "grid";

  const filteredMoves = moves
    .filter((move) => {
      const matchesQuery =
        !query ||
        move.name.toLowerCase().includes(query) ||
        move.summary.toLowerCase().includes(query) ||
        move.family.toLowerCase().includes(query);
      const matchesFamily =
        selectedFamily === "all" || move.family.toLowerCase() === selectedFamily;
      const matchesDifficulty =
        selectedDifficulty === "all" ||
        move.difficulty.toLowerCase() === selectedDifficulty;

      return matchesQuery && matchesFamily && matchesDifficulty;
    })
    .sort((a, b) => {
      if (selectedSort === "alphabetical") {
        return a.name.localeCompare(b.name);
      }
      if (selectedSort === "difficulty") {
        return a.difficulty.localeCompare(b.difficulty);
      }
      return 0;
    });

  const families = [
    "all",
    ...new Set(moves.map((move) => move.family.toLowerCase())),
  ];
  const difficulties = ["all", "beginner", "intermediate", "advanced"];
  const buildHref = (
    next: Partial<{
      q: string;
      family: string;
      difficulty: string;
      sort: string;
      view: "grid" | "list";
    }>,
  ) => {
    const qValue = (next.q ?? params.q ?? "").trim();
    const familyValue = (next.family ?? selectedFamily).toLowerCase();
    const difficultyValue = (next.difficulty ?? selectedDifficulty).toLowerCase();
    const sortValue = (next.sort ?? selectedSort).toLowerCase();
    const viewValue = next.view ?? selectedView;
    const search = new URLSearchParams();

    if (qValue) {
      search.set("q", qValue);
    }
    if (familyValue !== "all") {
      search.set("family", familyValue);
    }
    if (difficultyValue !== "all") {
      search.set("difficulty", difficultyValue);
    }
    if (sortValue !== "recommended") {
      search.set("sort", sortValue);
    }
    if (viewValue !== "grid") {
      search.set("view", viewValue);
    }

    const queryString = search.toString();
    return queryString ? `/moves?${queryString}` : "/moves";
  };

  return (
    <AppShell fullWidth className="max-w-[1440px]">
      <div className="mx-auto flex w-full max-w-[1380px] gap-6">
        <aside id="moves-filters" className="hidden w-72 shrink-0 rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-5 lg:block">
          <h2 className="mb-5 text-xl font-bold text-white">Filtros</h2>
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--text-3)]">
                Familia
              </p>
              <div className="space-y-2">
                {families.map((family) => (
                  <Link
                    key={family}
                    href={buildHref({ family })}
                    className={`block w-full rounded-lg px-3 py-2 text-sm ${
                      selectedFamily === family
                        ? "bg-[var(--color-primary)]/15 text-[var(--color-primary-soft)]"
                        : "text-[var(--text-2)] hover:bg-white/5 hover:text-[var(--text-1)]"
                    }`}
                  >
                    {family === "all" ? "Todas las familias" : family}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--text-3)]">
                Dificultad
              </p>
              <div className="space-y-2">
                {difficulties.map((difficulty) => (
                  <Link
                    key={difficulty}
                    href={buildHref({ difficulty })}
                    className={`block w-full rounded-lg px-3 py-2 text-sm ${
                      selectedDifficulty === difficulty
                        ? "bg-[var(--color-primary)]/15 text-[var(--color-primary-soft)]"
                        : "text-[var(--text-2)] hover:bg-white/5 hover:text-[var(--text-1)]"
                    }`}
                  >
                    {difficulty === "all" ? "Todos los niveles" : difficulty}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1 space-y-7">
          <div className="lg:hidden">
            <Link href="#moves-filter-form">
              <Button variant="outline" leftIcon={<SlidersHorizontal size={16} />} type="button">
                Filtros y orden
              </Button>
            </Link>
          </div>

          <header className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6">
            <h1 className="text-4xl font-black tracking-tight text-white">Diccionario de pasos</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--text-2)]">
              Explora la libreria de movimientos por familia, dificultad e intencion de practica.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="primary">#trending</Badge>
              <Badge variant="neutral">#footwork</Badge>
              <Badge variant="neutral">#isolation</Badge>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--text-3)]">Vista</span>
              <Link href={buildHref({ view: "grid" })}>
                <Button size="sm" variant={selectedView === "grid" ? "primary" : "outline"} type="button">
                  Cuadricula
                </Button>
              </Link>
              <Link href={buildHref({ view: "list" })}>
                <Button size="sm" variant={selectedView === "list" ? "primary" : "outline"} type="button">
                  Lista
                </Button>
              </Link>
            </div>
            <form
              id="moves-filter-form"
              className="mt-5 grid gap-3 md:grid-cols-[1fr,170px,170px,170px,auto]"
            >
              <input type="hidden" name="view" value={selectedView} />
              <Input icon={<Search size={16} />} placeholder="Buscar movimientos..." name="q" defaultValue={params.q} />
              <select
                className="h-11 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-2)]"
                name="family"
                defaultValue={selectedFamily}
              >
                {families.map((family) => (
                  <option key={family} value={family}>
                    {family === "all" ? "Todas las familias" : family}
                  </option>
                ))}
              </select>
              <select
                className="h-11 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-2)]"
                name="difficulty"
                defaultValue={selectedDifficulty}
              >
                {difficulties.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty === "all" ? "Todas las dificultades" : difficulty}
                  </option>
                ))}
              </select>
              <select
                className="h-11 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-2)]"
                name="sort"
                defaultValue={selectedSort}
              >
                <option value="recommended">Recomendado</option>
                <option value="difficulty">Dificultad</option>
                <option value="alphabetical">Alfabetico</option>
              </select>
              <Button type="submit">Aplicar</Button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedDifficulty !== "all" ? (
                <Badge variant="primary">{selectedDifficulty}</Badge>
              ) : null}
              {selectedFamily !== "all" ? <Badge variant="neutral">{selectedFamily}</Badge> : null}
              {query ? <Badge variant="neutral">Busqueda: {query}</Badge> : null}
              <Link href="/moves">
                <Button size="sm" variant="ghost">
                  Limpiar
                </Button>
              </Link>
            </div>
          </header>

          {filteredMoves.length === 0 ? (
            <EmptyState
              title="No se encontraron movimientos"
              description="No hay moves para esos filtros. Prueba otra familia o dificultad."
              ctaHref="/moves"
            />
          ) : selectedView === "list" ? (
            <div className="space-y-3">
              {filteredMoves.map((move) => (
                <Link key={move.slug} href={`/moves/${move.slug}`}>
                  <Card className="group transition-colors hover:border-[var(--color-primary)]/55">
                    <CardContent className="py-4">
                      <div className="flex gap-4">
                        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl">
                          <Image
                            src={move.coverImageUrl ?? "/media/images/stitch/card-dictionary.jpg"}
                            alt={`${move.name} move`}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/45 to-cyan-500/25" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="text-lg font-bold text-white group-hover:text-[var(--color-primary-soft)]">
                            {move.name}
                          </h2>
                          <p className="mt-1 text-sm text-[var(--text-2)]">{move.summary}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge variant="neutral">{move.family}</Badge>
                            <Badge variant="primary">{move.difficulty}</Badge>
                            <Badge variant="neutral">{move.bpmRange} bpm</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredMoves.map((move) => (
                <Link key={move.slug} href={`/moves/${move.slug}`}>
                  <Card className="group h-full transition-transform hover:-translate-y-1">
                    <CardContent>
                      <div className="relative mb-3 h-32 overflow-hidden rounded-xl">
                        <Image
                          src={move.coverImageUrl ?? "/media/images/stitch/card-dictionary.jpg"}
                          alt={`${move.name} move`}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/45 to-cyan-500/25" />
                      </div>
                      <h2 className="text-xl font-bold text-white group-hover:text-[var(--color-primary-soft)]">
                        {move.name}
                      </h2>
                      <p className="mt-1 text-sm text-[var(--text-2)]">{move.summary}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Badge variant="neutral">{move.family}</Badge>
                        <Badge variant="primary">{move.difficulty}</Badge>
                        <Badge variant="neutral">{move.bpmRange} bpm</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
