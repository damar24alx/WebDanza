import { Check, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout";
import { Badge, Button, Card, CardContent } from "@/components/ui";
import { pricingMock } from "@/mocks";

const compareRows = [
  { feature: "Styles Library", explorer: "Básico", stylePack: "1 estilo", pro: "Completo", studio: "Completo" },
  { feature: "Course Progress", explorer: "Local", stylePack: "Detallado", pro: "Detallado", studio: "Detallado + reportes" },
  { feature: "Certificates", explorer: "-", stylePack: "-", pro: "Incluido", studio: "Incluido" },
  { feature: "Admin Tools", explorer: "-", stylePack: "-", pro: "-", studio: "Incluido" },
];

export default function PricingPage() {
  return (
    <AppShell fullWidth className="max-w-[1440px]">
      <div className="mx-auto w-full max-w-[1380px] space-y-10">
        <section className="hero-overlay overflow-hidden rounded-3xl border border-[var(--border-1)] px-6 py-16 text-center">
          <Badge variant="primary">Pricing Plans</Badge>
          <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-black tracking-tight text-white md:text-6xl">
            Elige un plan y acelera tu progreso
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-[var(--text-2)] md:text-base">
            Desde exploración gratuita hasta rutas completas con certificación.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {pricingMock.map((plan) => (
            <Card
              key={plan.id}
              className={plan.highlight ? "border-[var(--color-primary)] shadow-[0_18px_35px_-20px_rgba(109,76,255,0.9)]" : ""}
            >
              <CardContent className="space-y-4">
                {plan.highlight ? <Badge variant="primary">Most Popular</Badge> : null}
                <h2 className="text-2xl font-bold text-white">{plan.name}</h2>
                <p className="text-sm text-[var(--text-2)]">{plan.description}</p>
                <p className="text-3xl font-black text-white">{plan.monthlyPrice}</p>
                <p className="text-xs text-[var(--text-3)]">anual desde {plan.annualPrice}/mes</p>
                <ul className="space-y-2 text-sm text-[var(--text-2)]">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <Check size={16} className="mt-0.5 shrink-0 text-emerald-300" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={plan.highlight ? "primary" : "outline"}>
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6">
          <h2 className="mb-5 text-center text-3xl font-bold text-white">Compare Features</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--border-1)] text-sm text-[var(--text-3)]">
                  <th className="py-3">Feature</th>
                  <th className="py-3">Explorador</th>
                  <th className="py-3">Pack Estilo</th>
                  <th className="py-3">Pro</th>
                  <th className="py-3">Studio</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row) => (
                  <tr key={row.feature} className="border-b border-[var(--border-1)] text-sm">
                    <td className="py-3 text-[var(--text-2)]">{row.feature}</td>
                    <td className="py-3 text-[var(--text-1)]">{row.explorer}</td>
                    <td className="py-3 text-[var(--text-1)]">{row.stylePack}</td>
                    <td className="py-3 text-[var(--text-1)]">{row.pro}</td>
                    <td className="py-3 text-[var(--text-1)]">{row.studio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mx-auto max-w-3xl rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6">
          <h2 className="mb-5 text-center text-3xl font-bold text-white">Frequently Asked Questions</h2>
          <div className="space-y-3">
            <FaqItem
              question="¿Puedo cambiar de plan en cualquier momento?"
              answer="Sí, puedes subir o bajar de plan desde tu panel sin perder progreso."
            />
            <FaqItem
              question="¿El certificado es verificable?"
              answer="Sí, cada certificado MVP incluye código único y vista de validación."
            />
            <FaqItem
              question="¿Incluye acceso al panel admin?"
              answer="Solo el plan Studio incluye panel administrativo interno."
            />
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-7 text-center">
          <h2 className="flex items-center justify-center gap-2 text-3xl font-bold text-white">
            <Sparkles size={20} className="text-[var(--color-primary-soft)]" />
            Earn Official Certificates
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-[var(--text-2)]">
            Completa rutas elegibles y obtén un certificado verificable para compartir tu progreso.
          </p>
          <Button className="mt-5">Empezar ahora</Button>
        </section>
      </div>
    </AppShell>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] p-4">
      <p className="text-sm font-semibold text-white">{question}</p>
      <p className="mt-1 text-sm text-[var(--text-2)]">{answer}</p>
    </div>
  );
}
