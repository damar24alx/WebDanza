import Link from "next/link";
import { ArrowRight, KeyRound, Mail } from "lucide-react";
import { Button, Card, CardContent, Input } from "@/components/ui";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hero-overlay relative hidden p-10 lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-[0.1em] text-[var(--color-primary-soft)]">
            DANCE ACADEMY
          </p>
          <h1 className="mt-4 max-w-md text-5xl font-black leading-tight text-white">
            Learn with rhythm, progress with purpose.
          </h1>
        </div>
        <p className="max-w-sm text-sm text-[var(--text-2)]">
          MVP UI estática para explorar rutas, técnica y progreso personal.
        </p>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-5">
            <div>
              <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
              <p className="mt-1 text-sm text-[var(--text-2)]">
                Ingresa para continuar tu ruta de aprendizaje.
              </p>
            </div>
            <Input icon={<Mail size={16} />} placeholder="Correo electrónico" />
            <Input icon={<KeyRound size={16} />} type="password" placeholder="Contraseña" />
            <Button className="w-full" rightIcon={<ArrowRight size={16} />}>
              Log In
            </Button>
            <div className="flex justify-between text-xs text-[var(--text-3)]">
              <Link href="/auth/recovery" className="hover:text-[var(--text-1)]">
                Forgot password?
              </Link>
              <Link href="/auth/register" className="hover:text-[var(--text-1)]">
                Create account
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
