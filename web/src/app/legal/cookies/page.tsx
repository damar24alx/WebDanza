import { AppShell } from "@/components/layout";

export default function CookiesPage() {
  return (
    <AppShell fullWidth className="max-w-[1100px]">
      <section className="mx-auto w-full max-w-4xl space-y-4 rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6">
        <h1 className="text-3xl font-black text-white">Politica de cookies</h1>
        <p className="text-sm text-[var(--text-2)]">Ultima actualizacion: 24 de febrero de 2026.</p>
        <p className="text-sm text-[var(--text-2)]">
          Usamos cookies estrictamente necesarias para sesion segura y continuidad de aprendizaje.
        </p>
        <p className="text-sm text-[var(--text-2)]">
          Las cookies de analitica y rendimiento se limitan a medicion tecnica de la plataforma.
        </p>
      </section>
    </AppShell>
  );
}
