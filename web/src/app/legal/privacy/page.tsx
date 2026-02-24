import { AppShell } from "@/components/layout";

export default function PrivacyPage() {
  return (
    <AppShell fullWidth className="max-w-[1100px]">
      <section className="mx-auto w-full max-w-4xl space-y-4 rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6">
        <h1 className="text-3xl font-black text-white">Politica de privacidad</h1>
        <p className="text-sm text-[var(--text-2)]">Ultima actualizacion: 24 de febrero de 2026.</p>
        <p className="text-sm text-[var(--text-2)]">
          Recopilamos solo los datos necesarios para autenticacion, progreso academico y emision de certificados.
        </p>
        <p className="text-sm text-[var(--text-2)]">
          No vendemos datos personales. Puedes solicitar soporte sobre tus datos en support@dance-academy.local.
        </p>
      </section>
    </AppShell>
  );
}
