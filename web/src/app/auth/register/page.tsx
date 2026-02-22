import Link from "next/link";
import { ArrowRight, KeyRound, Mail, UserRound } from "lucide-react";
import { Badge, Button, Card, CardContent, Input } from "@/components/ui";

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen bg-[var(--surface-0)] lg:grid-cols-[1fr,1.2fr]">
      <section className="hero-overlay relative hidden p-10 lg:flex lg:flex-col lg:justify-between">
        <div>
          <Badge variant="primary">Join the movement</Badge>
          <h1 className="mt-5 max-w-md text-5xl font-black leading-tight text-white">
            Build your dance path from day one.
          </h1>
        </div>
        <p className="max-w-sm text-sm text-[var(--text-2)]">
          Crea tu cuenta para acceder a cursos, progreso y certificaciones MVP.
        </p>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <Card className="w-full max-w-xl">
          <CardContent className="space-y-5">
            <div>
              <h2 className="text-4xl font-black text-white">Join the Movement</h2>
              <p className="mt-2 text-sm text-[var(--text-2)]">Registrate y comienza tu ruta guiada.</p>
            </div>

            <form className="space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="register-first-name"
                    className="block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-3)]"
                  >
                    Nombre
                  </label>
                  <Input
                    id="register-first-name"
                    name="firstName"
                    autoComplete="given-name"
                    icon={<UserRound size={16} />}
                    aria-describedby="register-first-name-help"
                  />
                  <p id="register-first-name-help" className="text-xs text-[var(--text-3)]">
                    Tu nombre para el certificado.
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="register-last-name"
                    className="block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-3)]"
                  >
                    Apellido
                  </label>
                  <Input
                    id="register-last-name"
                    name="lastName"
                    autoComplete="family-name"
                    icon={<UserRound size={16} />}
                    aria-describedby="register-last-name-help"
                  />
                  <p id="register-last-name-help" className="text-xs text-[var(--text-3)]">
                    Como quieres que aparezca en tu perfil.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="register-email"
                  className="block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-3)]"
                >
                  Correo electronico
                </label>
                <Input
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  icon={<Mail size={16} />}
                  aria-describedby="register-email-help"
                />
                <p id="register-email-help" className="text-xs text-[var(--text-3)]">
                  Te enviaremos notificaciones de progreso a este correo.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="register-password"
                  className="block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-3)]"
                >
                  Contrasena
                </label>
                <Input
                  id="register-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  icon={<KeyRound size={16} />}
                  aria-describedby="register-password-help"
                />
                <p id="register-password-help" className="text-xs text-[var(--text-3)]">
                  Usa minimo 8 caracteres.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="register-password-confirm"
                  className="block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-3)]"
                >
                  Confirmar contrasena
                </label>
                <Input
                  id="register-password-confirm"
                  name="passwordConfirm"
                  type="password"
                  autoComplete="new-password"
                  icon={<KeyRound size={16} />}
                  aria-describedby="register-password-confirm-help"
                />
                <p id="register-password-confirm-help" className="text-xs text-[var(--text-3)]">
                  Debe coincidir con la contrasena principal.
                </p>
              </div>

              <Button className="w-full" rightIcon={<ArrowRight size={16} />} type="submit">
                Create Account
              </Button>
            </form>

            <p className="text-xs text-[var(--text-3)]">
              Ya tienes cuenta?{" "}
              <Link href="/auth/login" className="text-[var(--color-primary-soft)] hover:text-white">
                Inicia sesion
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
