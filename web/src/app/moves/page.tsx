import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { AppShell, Sidebar } from "@/components/layout";
import { EmptyState, LoadingState } from "@/components/state/SystemStates";
import { Badge, Button, Card, CardContent, Input } from "@/components/ui";
import { movesMock } from "@/mocks";

export default function MovesPage() {
  return (
    <AppShell fullWidth className="max-w-[1440px]">
      <div className="mx-auto flex w-full max-w-[1380px] gap-6">
        <Sidebar
          title="Filters"
          className="sticky top-24 hidden h-fit lg:block"
          items={[
            { label: "Dificultad: Beginner", active: true },
            { label: "Familia: House" },
            { label: "BPM: 120-130" },
            { label: "Nivel Advanced", muted: true },
          ]}
        />

        <section className="min-w-0 flex-1 space-y-7">
          <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6">
            <h1 className="text-4xl font-black tracking-tight text-white">Step Dictionary</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--text-2)]">
              Busca, filtra y revisa técnica paso a paso de cada move.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Input icon={<Search size={16} />} placeholder="Buscar moves..." />
              <Button variant="outline" leftIcon={<SlidersHorizontal size={16} />}>
                Filtros
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="primary">Beginner</Badge>
              <Badge variant="neutral">House</Badge>
              <Badge variant="neutral">120-130 BPM</Badge>
            </div>
          </div>

          <div className="card-grid">
            {movesMock.map((move) => (
              <Link key={move.slug} href={`/moves/${move.slug}`}>
                <Card className="h-full transition-transform hover:-translate-y-1">
                  <CardContent>
                    <div className="mb-3 h-28 rounded-xl bg-gradient-to-br from-[var(--color-primary)]/55 to-cyan-500/25" />
                    <h2 className="text-xl font-bold text-white">{move.name}</h2>
                    <p className="mt-1 text-sm text-[var(--text-2)]">{move.summary}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="neutral">{move.family}</Badge>
                      <Badge variant="primary">{move.difficulty}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <LoadingState />
            <EmptyState />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
