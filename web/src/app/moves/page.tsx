import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/layout";
import { EmptyState } from "@/components/states";
import { Badge, Button, Card, CardContent, Input } from "@/components/ui";
import { movesMock } from "@/mocks";

type MovesSearchParams = Promise<{
  q?: string;
  family?: string;
  difficulty?: string;
  sort?: string;
}>;

const sortOptions = ["recommended", "difficulty", "alphabetical"];

export default async function MovesPage({
  searchParams,
}: {
  searchParams: MovesSearchParams;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim().toLowerCase();
  const selectedFamily = (params.family ?? "all").toLowerCase();
  const selectedDifficulty = (params.difficulty ?? "all").toLowerCase();
  const selectedSort = sortOptions.includes((params.sort ?? "").toLowerCase())
    ? (params.sort ?? "recommended").toLowerCase()
    : "recommended";

  const filteredMoves = movesMock
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
    ...new Set(movesMock.map((move) => move.family.toLowerCase())),
  ];
  const difficulties = ["all", "beginner", "intermediate", "advanced"];

  return (
    <AppShell fullWidth className="max-w-[1440px]">
      <div className="mx-auto flex w-full max-w-[1380px] gap-6">
        <aside className="hidden w-72 shrink-0 rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-5 lg:block">
          <h2 className="mb-5 text-xl font-bold text-white">Filters</h2>
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--text-3)]">
                Family
              </p>
              <div className="space-y-2">
                {families.map((family) => (
                  <p
                    key={family}
                    className={`rounded-lg px-3 py-2 text-sm ${
                      selectedFamily === family
                        ? "bg-[var(--color-primary)]/15 text-[var(--color-primary-soft)]"
                        : "text-[var(--text-2)]"
                    }`}
                  >
                    {family === "all" ? "All families" : family}
                  </p>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--text-3)]">
                Difficulty
              </p>
              <div className="space-y-2">
                {difficulties.map((difficulty) => (
                  <p
                    key={difficulty}
                    className={`rounded-lg px-3 py-2 text-sm ${
                      selectedDifficulty === difficulty
                        ? "bg-[var(--color-primary)]/15 text-[var(--color-primary-soft)]"
                        : "text-[var(--text-2)]"
                    }`}
                  >
                    {difficulty === "all" ? "All levels" : difficulty}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1 space-y-7">
          <div className="lg:hidden">
            <Button variant="outline" leftIcon={<SlidersHorizontal size={16} />}>
              Filters & Sort
            </Button>
          </div>

          <header className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6">
            <h1 className="text-4xl font-black tracking-tight text-white">Step Dictionary</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--text-2)]">
              Explore our move library by family, difficulty and practice intent.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="primary">#trending</Badge>
              <Badge variant="neutral">#footwork</Badge>
              <Badge variant="neutral">#isolation</Badge>
            </div>
            <form className="mt-5 grid gap-3 md:grid-cols-[1fr,170px,170px,170px,auto]">
              <Input icon={<Search size={16} />} placeholder="Search moves..." name="q" defaultValue={params.q} />
              <select
                className="h-11 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-2)]"
                name="family"
                defaultValue={selectedFamily}
              >
                {families.map((family) => (
                  <option key={family} value={family}>
                    {family === "all" ? "All Families" : family}
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
                    {difficulty === "all" ? "All Difficulties" : difficulty}
                  </option>
                ))}
              </select>
              <select
                className="h-11 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-2)]"
                name="sort"
                defaultValue={selectedSort}
              >
                <option value="recommended">Recommended</option>
                <option value="difficulty">Difficulty</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
              <Button type="submit">Apply</Button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedDifficulty !== "all" ? (
                <Badge variant="primary">{selectedDifficulty}</Badge>
              ) : null}
              {selectedFamily !== "all" ? <Badge variant="neutral">{selectedFamily}</Badge> : null}
              {query ? <Badge variant="neutral">Search: {query}</Badge> : null}
              <Link href="/moves">
                <Button size="sm" variant="ghost">
                  Clear all
                </Button>
              </Link>
            </div>
          </header>

          {filteredMoves.length === 0 ? (
            <EmptyState
              title="No moves found"
              description="No hay moves para esos filtros. Prueba otra familia o dificultad."
              ctaHref="/moves"
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredMoves.map((move) => (
                <Link key={move.slug} href={`/moves/${move.slug}`}>
                  <Card className="group h-full transition-transform hover:-translate-y-1">
                    <CardContent>
                      <div className="mb-3 h-32 rounded-xl bg-gradient-to-br from-[var(--color-primary)]/65 to-cyan-500/35" />
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
