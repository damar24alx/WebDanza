import Link from "next/link";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Button, Card, CardContent, Input } from "@/components/ui";

type RecoveryResetSearchParams = Promise<{
  token?: string;
  error?: string;
  tokenError?: string;
  passwordError?: string;
  passwordConfirmError?: string;
}>;

export default async function RecoveryResetPage({
  searchParams,
}: {
  searchParams: RecoveryResetSearchParams;
}) {
  const params = await searchParams;
  const token = (params.token ?? "").trim();
  const error = (params.error ?? "").trim();
  const tokenError = (params.tokenError ?? "").trim();
  const passwordError = (params.passwordError ?? "").trim();
  const passwordConfirmError = (params.passwordConfirmError ?? "").trim();

  return (
    <main className="min-h-screen bg-[var(--surface-0)] px-4 py-12">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-5">
            <div>
              <h1 className="text-3xl font-bold text-white">Definir nueva contrasena</h1>
              <p className="mt-2 text-sm text-[var(--text-2)]">
                Ingresa el token de recuperacion y define tu nueva contrasena.
              </p>
            </div>

            <form action="/api/auth/recovery/reset" method="post" className="space-y-3" noValidate>
              <div className="space-y-2">
                <label
                  htmlFor="recovery-token"
                  className="block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-3)]"
                >
                  Token
                </label>
                <Input
                  id="recovery-token"
                  name="token"
                  defaultValue={token}
                  icon={<ShieldCheck size={16} />}
                  aria-describedby="recovery-token-help"
                />
                <p id="recovery-token-help" className="text-xs text-[var(--text-3)]">
                  Token enviado por correo o entregado en entorno de desarrollo.
                </p>
                {tokenError ? <p className="text-xs text-rose-300">{tokenError}</p> : null}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="recovery-password"
                  className="block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-3)]"
                >
                  Nueva contrasena
                </label>
                <Input
                  id="recovery-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  icon={<KeyRound size={16} />}
                />
                {passwordError ? <p className="text-xs text-rose-300">{passwordError}</p> : null}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="recovery-password-confirm"
                  className="block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-3)]"
                >
                  Confirmar nueva contrasena
                </label>
                <Input
                  id="recovery-password-confirm"
                  name="passwordConfirm"
                  type="password"
                  autoComplete="new-password"
                  icon={<KeyRound size={16} />}
                />
                {passwordConfirmError ? (
                  <p className="text-xs text-rose-300">{passwordConfirmError}</p>
                ) : null}
              </div>

              <Button className="w-full" type="submit">
                Actualizar contrasena
              </Button>
            </form>

            {error ? (
              <p className="rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                {error}
              </p>
            ) : null}

            <p className="text-xs text-[var(--text-3)]">
              Volver a{" "}
              <Link href="/auth/login" className="text-[var(--color-primary-soft)] hover:text-white">
                iniciar sesion
              </Link>
              .
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/25 bg-emerald-500/10">
          <CardContent className="flex h-full flex-col justify-center">
            <p className="text-lg font-bold text-emerald-100">Politica de recuperacion</p>
            <ul className="mt-3 space-y-2 text-sm text-emerald-100/80">
              <li>- El token expira automaticamente.</li>
              <li>- Solo puede usarse una vez.</li>
              <li>- Al cambiar contrasena se invalidan tokens anteriores.</li>
            </ul>
            <Link href="/auth/recovery" className="mt-5 inline-flex">
              <Button variant="outline" type="button">
                Solicitar nuevo token
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
