import {
  BadgeCheck,
  Check,
  Crown,
  Medal,
  ShieldCheck,
  Sparkles,
  Users2,
} from "lucide-react";
import { AppShell } from "@/components/layout";
import { Badge, Button, Card, CardContent } from "@/components/ui";
import { pricingMock } from "@/mocks";

const compareRows = [
  {
    feature: "Styles Library",
    explorer: "Basico",
    stylePack: "1 estilo",
    pro: "Completo",
    studio: "Completo",
  },
  {
    feature: "Course Progress",
    explorer: "Local",
    stylePack: "Detallado",
    pro: "Detallado",
    studio: "Detallado + analytics",
  },
  {
    feature: "Certificates",
    explorer: "-",
    stylePack: "-",
    pro: "Incluido",
    studio: "Incluido",
  },
  {
    feature: "Admin Dashboard",
    explorer: "-",
    stylePack: "-",
    pro: "-",
    studio: "Incluido",
  },
];

const proReasons = [
  "Cursos completos de todos los estilos MVP",
  "Ruta de progreso y desbloqueo por modulos",
  "Certificados verificables por curso elegible",
];

export default function PricingPage() {
  return (
    <AppShell fullWidth className="max-w-[1440px]">
      <div className="mx-auto w-full max-w-[1380px] space-y-12">
        <section className="hero-overlay relative overflow-hidden rounded-3xl border border-[var(--border-1)] px-6 py-16 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(109,76,255,0.3),transparent_45%)]" />
          <Badge variant="primary">Pricing Plans</Badge>
          <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
            Unlock your full dance potential
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-[var(--text-2)] md:text-base">
            Planes hibridos para explorar gratis, profundizar por estilo o ir por acceso total.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {pricingMock.map((plan) => (
            <Card
              key={plan.id}
              className={
                plan.highlight
                  ? "relative border-[var(--color-primary)] bg-[linear-gradient(180deg,rgba(109,76,255,0.12),rgba(18,21,34,0.95))]"
                  : ""
              }
            >
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">{plan.name}</h2>
                  {plan.highlight ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)]/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-primary-soft)]">
                      <Crown size={12} />
                      popular
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-[var(--text-2)]">{plan.description}</p>
                <div className="border-y border-[var(--border-1)] py-4">
                  <p className="text-4xl font-black text-white">{plan.monthlyPrice}</p>
                  <p className="mt-1 text-xs text-[var(--text-3)]">anual desde {plan.annualPrice}/mes</p>
                </div>
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

        <section className="grid gap-6 lg:grid-cols-[1.1fr,1fr]">
          <Card>
            <CardContent>
              <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-white">
                <Sparkles size={19} className="text-[var(--color-primary-soft)]" />
                Why Go Pro?
              </h2>
              <div className="space-y-3">
                {proReasons.map((reason) => (
                  <div
                    key={reason}
                    className="rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text-2)]"
                  >
                    {reason}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(165deg,rgba(109,76,255,0.18),rgba(18,21,34,1)_68%)]">
            <CardContent className="h-full">
              <h2 className="mb-3 text-3xl font-bold text-white">Earn Official Certificates</h2>
              <p className="text-sm text-[var(--text-2)]">
                Completa cursos elegibles y genera un certificado con codigo verificable.
              </p>
              <div className="mt-6 grid gap-3">
                <FeatureChip icon={<BadgeCheck size={16} />} text="Validacion por codigo unico" />
                <FeatureChip icon={<Medal size={16} />} text="Listo para portfolio y CV" />
                <FeatureChip icon={<ShieldCheck size={16} />} text="Emision controlada en MVP" />
              </div>
              <Button className="mt-6">Comenzar ruta certificable</Button>
            </CardContent>
          </Card>
        </section>

        <section className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6">
          <h2 className="mb-6 text-center text-3xl font-bold text-white">Compare Features</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--border-1)] text-xs uppercase tracking-[0.08em] text-[var(--text-3)]">
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

        <section className="mx-auto max-w-4xl rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6">
          <h2 className="mb-6 text-center text-3xl font-bold text-white">Frequently Asked Questions</h2>
          <div className="space-y-3">
            <FaqItem
              question="Puedo cambiar de plan en cualquier momento?"
              answer="Si. Puedes ajustar tu plan desde cuenta sin perder historial de progreso."
            />
            <FaqItem
              question="El certificado es verificable?"
              answer="Si. Cada certificado MVP tiene codigo unico y pagina de validacion."
            />
            <FaqItem
              question="El plan Studio es para academias?"
              answer="Si. Incluye herramientas internas para seguimiento de grupo y panel admin."
            />
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6">
          <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
            <div>
              <h3 className="text-2xl font-bold text-white">Need a team setup?</h3>
              <p className="mt-1 text-sm text-[var(--text-2)]">
                Configuracion Studio para escuelas y crews con multiples estudiantes.
              </p>
            </div>
            <Button leftIcon={<Users2 size={16} />}>Contactar ventas</Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] p-4 open:border-[var(--color-primary)]/50">
      <summary className="cursor-pointer list-none text-sm font-semibold text-white">{question}</summary>
      <p className="mt-2 text-sm text-[var(--text-2)]">{answer}</p>
    </details>
  );
}

function FeatureChip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[var(--border-1)] bg-black/10 px-3 py-2 text-sm text-[var(--text-2)]">
      <span className="text-[var(--color-primary-soft)]">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
