import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Lock, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout";
import { Badge, Button, Card, CardContent } from "@/components/ui";
import { getCurrentUser } from "@/server/auth/current-user";
import {
  getUserEntitlement,
  parseCheckoutPlanId,
  planLabel,
  toSubscriptionPlan,
  type CheckoutPlanId,
} from "@/server/db/subscriptions";
import { getStylesCatalog } from "@/server/db/catalog";

type CheckoutSearchParams = Promise<{
  plan?: string;
  style?: string;
  next?: string;
  error?: string;
  success?: string;
}>;

function safeRedirectPath(value?: string) {
  if (!value) {
    return "/learn";
  }

  const normalized = value.trim();
  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    return "/learn";
  }

  return normalized;
}

function checkoutParams(input: {
  plan: CheckoutPlanId;
  styleSlug?: string;
  nextPath?: string;
}) {
  const search = new URLSearchParams();
  search.set("plan", input.plan);
  if (input.styleSlug) {
    search.set("style", input.styleSlug);
  }
  if (input.nextPath) {
    search.set("next", input.nextPath);
  }
  return `/checkout?${search.toString()}`;
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: CheckoutSearchParams;
}) {
  const params = await searchParams;
  const planId = parseCheckoutPlanId(params.plan ?? "") ?? "pro";
  const styleSlug = (params.style ?? "").trim().toLowerCase();
  const nextPath = safeRedirectPath(params.next);
  const loginNext = checkoutParams({
    plan: planId,
    styleSlug: styleSlug || undefined,
    nextPath,
  });

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect(`/auth/login?next=${encodeURIComponent(loginNext)}`);
  }

  const [entitlement, styles] = await Promise.all([
    getUserEntitlement(currentUser.id),
    getStylesCatalog(),
  ]);
  const error = (params.error ?? "").trim();
  const success = (params.success ?? "").trim();

  const selectedPlan = toSubscriptionPlan(planId);
  const selectedStyle = styles.find((style) => style.slug === styleSlug) ?? styles[0] ?? null;
  const currentPlanLabel = entitlement ? planLabel(entitlement.plan) : "Free";

  return (
    <AppShell fullWidth className="max-w-[1160px]">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr,1fr]">
        <Card className="h-fit">
          <CardContent className="space-y-4">
            <Badge variant="primary">Checkout</Badge>
            <h1 className="text-3xl font-black text-white">Activar plan</h1>
            <p className="text-sm text-[var(--text-2)]">
              Completa la activacion para desbloquear acceso segun tu tipo de plan.
            </p>

            <div className="space-y-2 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] p-4 text-sm">
              <p className="text-[var(--text-3)]">Cuenta</p>
              <p className="font-semibold text-white">{currentUser.email}</p>
              <p className="text-[var(--text-2)]">
                Plan actual: <span className="font-semibold text-white">{currentPlanLabel}</span>
              </p>
              {entitlement?.styleSlug ? (
                <p className="text-[var(--text-2)]">
                  Estilo activo en Pack:{" "}
                  <span className="font-semibold text-white">{entitlement.styleSlug}</span>
                </p>
              ) : null}
            </div>

            {error ? (
              <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
                {success}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-300" />
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-3)]">
                Confirmacion de acceso
              </p>
            </div>

            <form action="/api/billing/subscribe" method="post" className="space-y-4">
              <input type="hidden" name="plan" value={planId} />
              <input type="hidden" name="redirectTo" value={nextPath} />

              <div className="rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] p-4">
                <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-3)]">Plan seleccionado</p>
                <p className="mt-1 text-lg font-bold text-white">{planLabel(selectedPlan)}</p>
              </div>

              {planId === "style-pack" ? (
                <div className="space-y-2">
                  <label
                    htmlFor="checkout-style"
                    className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-3)]"
                  >
                    Selecciona estilo
                  </label>
                  <select
                    id="checkout-style"
                    name="styleSlug"
                    defaultValue={selectedStyle?.slug ?? ""}
                    className="h-11 w-full rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-1)]"
                  >
                    {styles.map((style) => (
                      <option key={style.slug} value={style.slug}>
                        {style.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-xs text-amber-200">
                <span className="inline-flex items-center gap-2 font-semibold">
                  <Lock size={14} />
                  Flujo MVP sin pasarela externa
                </span>
                <p className="mt-1">
                  Esta activacion aplica el plan en tu cuenta para validar permisos y navegacion.
                </p>
              </div>

              <Button className="w-full" rightIcon={<ArrowRight size={16} />} type="submit">
                Confirmar plan
              </Button>
            </form>

            <div className="text-xs text-[var(--text-3)]">
              <Link href={nextPath} className="hover:text-white">
                Continuar sin cambios
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

