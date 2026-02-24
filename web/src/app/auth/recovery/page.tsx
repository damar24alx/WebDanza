import Link from "next/link";
import { CheckCircle2, Mail, RefreshCcw } from "lucide-react";
import { Button, Card, CardContent, Input } from "@/components/ui";

type RecoverySearchParams = Promise<{
  success?: string;
  error?: string;
  email?: string;
  emailError?: string;
  debugToken?: string;
}>;

export default async function RecoveryPage({
  searchParams,
}: {
  searchParams: RecoverySearchParams;
}) {
  const params = await searchParams;
  const success = (params.success ?? "").trim();
  const error = (params.error ?? "").trim();
  const email = (params.email ?? "").trim();
  const emailError = (params.emailError ?? "").trim();
  const debugToken = (params.debugToken ?? "").trim();

  return (
    <main className="min-h-screen bg-[var(--surface-0)] px-4 py-12">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-5">
            <div>
              <h1 className="text-3xl font-bold text-white">Recuperar contrasena</h1>
              <p className="mt-2 text-sm text-[var(--text-2)]">
                Introduce tu correo y enviaremos un enlace para recuperar el acceso.
              </p>
            </div>

            <form action="/api/auth/recovery/request" method="post" className="space-y-3" noValidate>
              <div className="space-y-2">
                <label
                  htmlFor="recovery-email"
                  className="block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-3)]"
                >
                  Correo electronico
                </label>
                <Input
                  id="recovery-email"
                  name="email"
                  type="email"
                  defaultValue={email}
                  autoComplete="email"
                  icon={<Mail size={16} />}
                  aria-describedby="recovery-email-help"
                />
                <p id="recovery-email-help" className="text-xs text-[var(--text-3)]">
                  Te enviaremos un enlace de recuperacion si la cuenta existe.
                </p>
                {emailError ? <p className="text-xs text-rose-300">{emailError}</p> : null}
              </div>

              <Button className="w-full" type="submit">
                Enviar enlace de recuperacion
              </Button>
            </form>

            {success ? (
              <p className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                {success}
              </p>
            ) : null}
            {debugToken ? (
              <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                Token de desarrollo: <span className="font-semibold text-white">{debugToken}</span>
                <div className="mt-2">
                  <Link
                    href={`/auth/recovery/reset?token=${encodeURIComponent(debugToken)}`}
                    className="text-[var(--color-primary-soft)] hover:text-white"
                  >
                    Abrir formulario de reset
                  </Link>
                </div>
              </div>
            ) : null}
            {error ? (
              <p className="rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                {error}
              </p>
            ) : null}

            <p className="text-xs text-[var(--text-3)]">
              Recordaste tu contrasena?{" "}
              <Link href="/auth/login" className="text-[var(--color-primary-soft)] hover:text-white">
                Volver al login
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/25 bg-emerald-500/10">
          <CardContent className="flex h-full flex-col justify-center">
            <p className="flex items-center gap-2 text-lg font-bold text-emerald-100">
              <CheckCircle2 size={18} />
              Revisa tu correo
            </p>
            <p className="mt-2 text-sm text-emerald-100/80">
              Si el correo existe, recibiras instrucciones en los proximos minutos.
            </p>
            <Link href="/auth/recovery/reset" className="mt-4 inline-flex">
              <Button variant="outline" type="button">
                Ya tengo un token
              </Button>
            </Link>
            <Button
              variant="outline"
              className="mt-5 self-start"
              leftIcon={<RefreshCcw size={15} />}
              type="button"
              disabled
            >
              Integracion de email pendiente
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
