import Link from "next/link";
import { AppShell } from "@/components/layout";
import { Button, Card, CardContent } from "@/components/ui";

const instructorTracks = [
  {
    title: "Plan Studio",
    summary: "Gestion de grupos, seguimiento por alumno y workflows para academias.",
  },
  {
    title: "Ruta pedagogica",
    summary: "Organiza progresiones por nivel con trazabilidad de contenido.",
  },
  {
    title: "Verificacion de certificados",
    summary: "Valida logros de estudiantes con codigo publico verificable.",
  },
];

export default function InstructorsPage() {
  return (
    <AppShell fullWidth className="max-w-[1200px]">
      <section className="mx-auto w-full max-w-5xl space-y-6">
        <header className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6">
          <h1 className="text-3xl font-black text-white">Instructores y academias</h1>
          <p className="mt-2 text-sm text-[var(--text-2)]">
            Recursos para equipos docentes que quieren administrar aprendizaje de forma estructurada.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {instructorTracks.map((item) => (
            <Card key={item.title}>
              <CardContent>
                <p className="text-lg font-bold text-white">{item.title}</p>
                <p className="mt-2 text-sm text-[var(--text-2)]">{item.summary}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6">
          <p className="text-sm text-[var(--text-2)]">
            Quieres activar Studio para tu equipo? inicia checkout o habla con ventas.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/checkout?plan=studio">
              <Button type="button">Activar Studio</Button>
            </Link>
            <a href="mailto:sales@dance-academy.local?subject=Studio%20for%20Instructors">
              <Button variant="outline" type="button">Contactar ventas</Button>
            </a>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
