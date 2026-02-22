import Link from "next/link";
import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/layout";
import { EmptyState } from "@/components/states";
import { Badge, Button, Input } from "@/components/ui";
import { stylesMock } from "@/mocks";

type StylesSearchParams = Promise<{
  q?: string;
  category?: string;
  level?: string;
  sort?: string;
}>;

const sortOptions = ["recommended", "most-popular", "alphabetical"];

export default async function StylesPage({
  searchParams,
}: {
  searchParams: StylesSearchParams;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim().toLowerCase();
  const selectedCategory = (params.category ?? "all").toLowerCase();
  const selectedLevel = (params.level ?? "all").toLowerCase();
  const selectedSort = sortOptions.includes((params.sort ?? "").toLowerCase())
    ? (params.sort ?? "recommended").toLowerCase()
    : "recommended";

  const filteredStyles = stylesMock
    .filter((style) => {
      const matchesQuery =
        !query ||
        style.name.toLowerCase().includes(query) ||
        style.summary.toLowerCase().includes(query) ||
        style.category.toLowerCase().includes(query);
      const matchesCategory =
        selectedCategory === "all" ||
        style.category.toLowerCase() === selectedCategory;
      const matchesLevel =
        selectedLevel === "all" || style.level.toLowerCase() === selectedLevel;

      return matchesQuery && matchesCategory && matchesLevel;
    })
    .sort((a, b) => {
      if (selectedSort === "alphabetical") {
        return a.name.localeCompare(b.name);
      }
      if (selectedSort === "most-popular") {
        return b.classesCount - a.classesCount;
      }
      return 0;
    });

  const categories = [
    "all",
    ...new Set(stylesMock.map((style) => style.category.toLowerCase())),
  ];
  const levels = ["all", "beginner", "intermediate", "advanced"];

  return (
    <AppShell fullWidth className="max-w-[1440px]">
      <div className="mx-auto flex w-full max-w-[1380px] gap-6">
        <aside className="hidden w-72 shrink-0 rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-5 lg:block">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Filters</h2>
            <Link href="/styles" className="text-xs font-semibold text-[var(--color-primary-soft)]">
              Reset
            </Link>
          </div>

          <div className="space-y-6">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[var(--text-3)]">
                Categories
              </p>
              <div className="space-y-2">
                {categories.map((category) => (
                  <p
                    key={category}
                    className={`rounded-lg px-3 py-2 text-sm ${
                      selectedCategory === category
                        ? "bg-[var(--color-primary)]/15 text-[var(--color-primary-soft)]"
                        : "text-[var(--text-2)]"
                    }`}
                  >
                    {category === "all" ? "Any Category" : category}
                  </p>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[var(--text-3)]">
                Skill Level
              </p>
              <div className="space-y-2">
                {levels.map((level) => (
                  <p
                    key={level}
                    className={`rounded-lg px-3 py-2 text-sm ${
                      selectedLevel === level
                        ? "bg-[var(--color-primary)]/15 text-[var(--color-primary-soft)]"
                        : "text-[var(--text-2)]"
                    }`}
                  >
                    {level === "all" ? "Any Level" : level}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <div className="mb-6 lg:hidden">
            <Button variant="outline" leftIcon={<SlidersHorizontal size={16} />}>
              Filters & Sort
            </Button>
          </div>

          <header className="mb-8 rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-4xl font-black tracking-tight text-white">Explore Dance Styles</h1>
                <p className="mt-2 max-w-2xl text-sm text-[var(--text-2)]">
                  Discover your rhythm across street, studio and classical dance.
                </p>
              </div>

              <form className="grid w-full gap-3 md:grid-cols-[1fr,170px,170px,170px,auto] lg:max-w-5xl">
                <Input icon={<Search size={16} />} placeholder="Search styles..." name="q" defaultValue={params.q} />
                <select
                  className="h-11 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-2)]"
                  name="category"
                  defaultValue={selectedCategory}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </option>
                  ))}
                </select>
                <select
                  className="h-11 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-2)]"
                  name="level"
                  defaultValue={selectedLevel}
                >
                  {levels.map((level) => (
                    <option key={level} value={level}>
                      {level === "all" ? "All Levels" : level}
                    </option>
                  ))}
                </select>
                <select
                  className="h-11 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-2)]"
                  name="sort"
                  defaultValue={selectedSort}
                >
                  <option value="recommended">Recommended</option>
                  <option value="most-popular">Most Popular</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
                <Button type="submit">Apply</Button>
              </form>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {selectedCategory !== "all" ? (
                <Badge variant="primary">Category: {selectedCategory}</Badge>
              ) : null}
              {selectedLevel !== "all" ? (
                <Badge variant="neutral">Level: {selectedLevel}</Badge>
              ) : null}
              {query ? <Badge variant="neutral">Search: {query}</Badge> : null}
              <Link href="/styles">
                <Button variant="ghost" size="sm" leftIcon={<Filter size={15} />}>
                  Clear all
                </Button>
              </Link>
            </div>
          </header>

          {filteredStyles.length === 0 ? (
            <EmptyState
              title="No styles found"
              description="No hay resultados para esos filtros. Prueba otra combinacion."
              ctaHref="/styles"
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {filteredStyles.map((style) => (
                <article
                  key={style.slug}
                  className="group relative flex h-[390px] flex-col justify-end overflow-hidden rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)]"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${style.image} opacity-85 transition-transform duration-500 group-hover:scale-105`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
                  <div className="relative z-10 p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <Badge variant={style.featuredTag ? "primary" : "neutral"}>
                        {style.featuredTag ?? style.category}
                      </Badge>
                      <span className="text-xs text-white/70">{style.level}</span>
                    </div>
                    <h2 className="text-3xl font-black leading-tight text-white">{style.name}</h2>
                    <p className="mt-2 line-clamp-2 text-sm text-white/80">{style.summary}</p>
                    <p className="mt-3 text-xs text-white/70">{style.classesCount} classes</p>
                    <Link href={`/styles/${style.slug}`}>
                      <Button className="mt-4 w-full">Explore Style</Button>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
