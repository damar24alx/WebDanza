import { AppShell } from "@/components/layout";

export default function TermsPage() {
  return (
    <AppShell fullWidth className="max-w-[1100px]">
      <section className="mx-auto w-full max-w-4xl space-y-4 rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6">
        <h1 className="text-3xl font-black text-white">Terminos del servicio</h1>
        <p className="text-sm text-[var(--text-2)]">Ultima actualizacion: 24 de febrero de 2026.</p>
        <p className="text-sm text-[var(--text-2)]">
          Al usar Dance Academy aceptas usar la plataforma de forma legal, respetar derechos de contenido y no compartir acceso de cuenta.
        </p>
        <p className="text-sm text-[var(--text-2)]">
          El acceso a rutas de aprendizaje depende del plan activo y puede cambiar si tu suscripcion se cancela o expira.
        </p>
      </section>
    </AppShell>
  );
}
