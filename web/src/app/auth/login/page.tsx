import Link from "next/link";
import { ArrowRight, KeyRound, Mail } from "lucide-react";
import { Button, Card, CardContent, Input } from "@/components/ui";

type LoginSearchParams = Promise<{
  error?: string;
  success?: string;
  email?: string;
  emailError?: string;
  passwordError?: string;
  next?: string;
}>;

function safeRedirectPath(value?: string) {
  if (!value) {
    return "";
  }

  const normalized = value.trim();
  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    return "";
  }

  return normalized;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: LoginSearchParams;
}) {
  const params = await searchParams;
  const error = (params.error ?? "").trim();
  const success = (params.success ?? "").trim();
  const email = (params.email ?? "").trim();
  const emailError = (params.emailError ?? "").trim();
  const passwordError = (params.passwordError ?? "").trim();
  const nextPath = safeRedirectPath(params.next);

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hero-overlay relative hidden p-10 lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-[0.1em] text-[var(--color-primary-soft)]">
            DANCE ACADEMY
          </p>
          <h1 className="mt-4 max-w-md text-5xl font-black leading-[1.1] text-white">
            Aprende con ritmo, progresa con proposito.
          </h1>
          <p className="mt-4 max-w-md text-sm text-[var(--text-2)]">
            Inicia sesion para acceder a tus clases, progreso y certificados.
          </p>
        </div>
        <p className="max-w-sm text-sm text-[var(--text-3)]">
          Experiencia enciclopedia + academia inspirada en los layouts de Stitch.
        </p>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-5">
            <div>
              <h2 className="text-3xl font-bold text-white">Bienvenido de nuevo</h2>
              <p className="mt-1 text-sm text-[var(--text-2)]">Inicia sesion para continuar tu ruta.</p>
            </div>
            <form className="space-y-4" noValidate action="/api/auth/login" method="post">
              {nextPath ? <input type="hidden" name="redirectTo" value={nextPath} /> : null}
              <div className="space-y-2">
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-3)]"
                >
                  Email
                </label>
                <Input
                  id="login-email"
                  name="email"
                  type="email"
                  defaultValue={email}
                  autoComplete="email"
                  icon={<Mail size={16} />}
                  aria-describedby="login-email-help"
                />
                <p id="login-email-help" className="text-xs text-[var(--text-3)]">
                  Use the email address associated with your account.
                </p>
                {emailError ? (
                  <p className="text-xs text-rose-300">{emailError}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-3)]"
                >
                  Contrasena
                </label>
                <Input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  icon={<KeyRound size={16} />}
                  aria-describedby="login-password-help"
                />
                <p id="login-password-help" className="text-xs text-[var(--text-3)]">
                  Debe coincidir con la contrasena registrada.
                </p>
                {passwordError ? (
                  <p className="text-xs text-rose-300">{passwordError}</p>
                ) : null}
              </div>

              <Button className="w-full" rightIcon={<ArrowRight size={16} />} type="submit">
                Iniciar sesion
              </Button>
            </form>
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
            <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100/90">
              Demo admin: <span className="font-semibold">admin@dance.local</span> /{" "}
              <span className="font-semibold">Admin123!</span>
              <br />
              Demo student: <span className="font-semibold">luna@dance.local</span> /{" "}
              <span className="font-semibold">Student123!</span>
            </div>
            <div className="flex justify-between text-xs text-[var(--text-3)]">
              <Link href="/auth/recovery" className="hover:text-[var(--text-1)]">
                Olvidaste tu contrasena?
              </Link>
              <Link href="/auth/register" className="hover:text-[var(--text-1)]">
                Crear cuenta
              </Link>
            </div>

            <div className="relative pt-2">
              <div className="border-t border-[var(--border-1)]" />
              <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-[var(--surface-1)] px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-3)]">
                O continua con
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link href="/auth/register?provider=google">
                <Button variant="outline" className="w-full" type="button">
                  Google
                </Button>
              </Link>
              <Link href="/auth/register?provider=apple">
                <Button variant="outline" className="w-full" type="button">
                  Apple
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
