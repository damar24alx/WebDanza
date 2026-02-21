import Link from "next/link";
import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { AppShell, Sidebar } from "@/components/layout";
import { Badge, Button, Input } from "@/components/ui";
import { stylesMock } from "@/mocks";

const filterItems = [
  { label: "Street Dance", active: true },
  { label: "Contemporary" },
  { label: "Ballet" },
  { label: "Latin" },
  { label: "Ballroom", muted: true },
];

export default function StylesPage() {
  return (
    <AppShell fullWidth className="max-w-[1440px]">
      <div className="mx-auto flex w-full max-w-[1380px] gap-6">
        <div className="hidden lg:block">
          <Sidebar
            title="Filters"
            items={filterItems.map((item) => ({
              label: item.label,
              active: item.active,
              muted: item.muted,
            }))}
            className="sticky top-24 w-72"
          />
        </div>

        <section className="min-w-0 flex-1">
          <div className="mb-8 rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-white">Explore Dance Styles</h1>
                <p className="mt-2 max-w-2xl text-sm text-[var(--text-2)]">
                  Descubre el catálogo de estilos y entra a su contexto, técnica y rutas de aprendizaje.
                </p>
              </div>
              <div className="flex w-full gap-3 lg:max-w-md">
                <Input icon={<Search size={16} />} placeholder="Buscar style..." />
                <Button variant="outline" leftIcon={<SlidersHorizontal size={16} />}>
                  Sort
                </Button>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Badge variant="primary">Category: Street</Badge>
              <Badge variant="neutral">Level: Intermediate</Badge>
              <Button variant="ghost" size="sm" leftIcon={<Filter size={15} />}>
                Limpiar filtros
              </Button>
            </div>
          </div>

          <div className="card-grid">
            {stylesMock.map((style) => (
              <article
                key={style.slug}
                className="group overflow-hidden rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)]"
              >
                <div className={`h-52 bg-gradient-to-br ${style.image}`} />
                <div className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <Badge variant={style.featuredTag ? "primary" : "neutral"}>
                      {style.featuredTag ?? style.category}
                    </Badge>
                    <span className="text-xs text-[var(--text-3)]">{style.classesCount} clases</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">{style.name}</h2>
                  <p className="text-sm text-[var(--text-2)]">{style.summary}</p>
                  <Link href={`/styles/${style.slug}`}>
                    <Button className="mt-1 w-full">Explore Style</Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
