import Link from "next/link";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import { AppShell } from "@/components/layout";
import { EmptyState } from "@/components/states";
import { Badge, Button, Card, CardContent, Input } from "@/components/ui";
import { searchGlobalCatalog } from "@/server/db/search";

export const metadata: Metadata = {
  title: "Busqueda global | Dance Academy",
  description: "Encuentra estilos, movimientos, lecciones y cursos en un solo lugar.",
};

type SearchPageParams = Promise<{
  q?: string;
}>;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchPageParams;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const result = await searchGlobalCatalog(query);

  return (
    <AppShell fullWidth className="max-w-[1320px]">
      <section className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6">
        <header className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6">
          <h1 className="text-3xl font-bold text-white">Busqueda global</h1>
          <p className="mt-2 text-sm text-[var(--text-2)]">
            Busca por nombre, slug o descripcion en estilos, movimientos, lecciones y cursos.
          </p>
          <form action="/search" className="mt-4 grid gap-3 md:grid-cols-[1fr,auto]">
            <Input
              icon={<Search size={16} />}
              placeholder="Ej: house, shuffle, foundations..."
              name="q"
              defaultValue={query}
            />
            <Button type="submit">Buscar</Button>
          </form>
          {query ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant="primary">Query: {query}</Badge>
              <Badge variant="neutral">Resultados: {result.totalHits}</Badge>
              <Badge variant="neutral">Tiempo: {result.elapsedMs}ms</Badge>
            </div>
          ) : null}
        </header>

        {!query ? (
          <EmptyState
            title="Escribe algo para buscar"
            description="Prueba con un estilo, movimiento, curso o termino tecnico."
            ctaHref="/styles"
            ctaLabel="Explorar estilos"
          />
        ) : result.totalHits === 0 ? (
          <EmptyState
            title="Sin resultados"
            description="No encontramos coincidencias con tu busqueda. Ajusta el termino e intenta nuevamente."
            ctaHref="/search"
            ctaLabel="Nueva busqueda"
          />
        ) : (
          <div className="grid gap-6">
            <ResultSection title="Estilos" items={result.styles} emptyLabel="Sin estilos para este termino." />
            <ResultSection title="Movimientos" items={result.moves} emptyLabel="Sin movimientos para este termino." />
            <ResultSection title="Cursos" items={result.courses} emptyLabel="Sin cursos para este termino." />
            <section>
              <h2 className="text-xl font-bold text-white">Lecciones</h2>
              {result.lessons.length === 0 ? (
                <p className="mt-3 rounded-xl border border-[var(--border-1)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-2)]">
                  Sin lecciones para este termino.
                </p>
              ) : (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {result.lessons.map((lesson) => (
                    <Card key={`${lesson.courseSlug}-${lesson.slug}`} className="h-full">
                      <CardContent>
                        <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-3)]">
                          Curso: {lesson.courseTitle}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold text-white">{lesson.title}</h3>
                        <p className="mt-1 text-sm text-[var(--text-2)]">{lesson.summary}</p>
                        <Link href={lesson.href} className="mt-4 inline-flex">
                          <Button size="sm">Abrir leccion</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </section>
    </AppShell>
  );
}

function ResultSection({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: Array<{ slug: string; title: string; summary: string; href: string }>;
  emptyLabel: string;
}) {
  return (
    <section>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 rounded-xl border border-[var(--border-1)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-2)]">
          {emptyLabel}
        </p>
      ) : (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <Card key={`${title}-${item.slug}`} className="h-full">
              <CardContent>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-1 text-sm text-[var(--text-2)]">{item.summary}</p>
                <Link href={item.href} className="mt-4 inline-flex">
                  <Button size="sm">Abrir</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
