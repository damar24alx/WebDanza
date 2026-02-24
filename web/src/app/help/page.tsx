import Link from "next/link";
import { AppShell } from "@/components/layout";
import { Card, CardContent } from "@/components/ui";

export default function HelpPage() {
  return (
    <AppShell fullWidth className="max-w-[1100px]">
      <section className="mx-auto w-full max-w-4xl space-y-6">
        <header className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6">
          <h1 className="text-3xl font-black text-white">Centro de ayuda</h1>
          <p className="mt-2 text-sm text-[var(--text-2)]">
            Resuelve dudas comunes sobre acceso, planes, progreso y certificados.
          </p>
        </header>

        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-xl font-bold text-white">Preguntas frecuentes</h2>
            <FaqItem title="No puedo abrir un curso" description="Verifica tu plan activo en checkout y asegurate de estar autenticado." />
            <FaqItem title="Quiero cambiar de plan" description="Abre /pricing y continua a checkout para actualizar tu plan." />
            <FaqItem title="No aparece mi certificado" description="Revisa tu avance del curso y valida que el curso sea elegible para certificado." />
          </CardContent>
        </Card>

        <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-5 text-sm text-[var(--text-2)]">
          Necesitas soporte adicional? Escribenos a <a className="text-[var(--color-primary-soft)]" href="mailto:support@dance-academy.local">support@dance-academy.local</a>.
          <div className="mt-3">
            <Link href="/pricing" className="text-[var(--color-primary-soft)] hover:text-white">Ver planes</Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function FaqItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-4 py-3">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm text-[var(--text-2)]">{description}</p>
    </div>
  );
}
