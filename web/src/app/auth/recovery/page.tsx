import Link from "next/link";
import { CheckCircle2, Mail, RefreshCcw } from "lucide-react";
import { Button, Card, CardContent, Input } from "@/components/ui";

export default function RecoveryPage() {
  return (
    <main className="min-h-screen bg-[var(--surface-0)] px-4 py-12">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-5">
            <div>
              <h1 className="text-3xl font-bold text-white">Reset Password</h1>
              <p className="mt-2 text-sm text-[var(--text-2)]">
                Introduce tu correo y enviaremos un enlace para recuperar el acceso.
              </p>
            </div>

            <form className="space-y-3" noValidate>
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
                  autoComplete="email"
                  icon={<Mail size={16} />}
                  aria-describedby="recovery-email-help"
                />
                <p id="recovery-email-help" className="text-xs text-[var(--text-3)]">
                  Te enviaremos un enlace de recuperacion si la cuenta existe.
                </p>
              </div>

              <Button className="w-full" type="submit">
                Send Recovery Link
              </Button>
            </form>

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
              Check your mail
            </p>
            <p className="mt-2 text-sm text-emerald-100/80">
              Si el correo existe, recibiras instrucciones en los proximos minutos.
            </p>
            <Button variant="outline" className="mt-5 self-start" leftIcon={<RefreshCcw size={15} />} type="button">
              Reenviar enlace
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
