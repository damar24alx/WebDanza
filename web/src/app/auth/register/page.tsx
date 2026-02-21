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
              <p className="mt-2 text-sm text-[var(--text-2)]">
                Regístrate y comienza tu ruta guiada.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input icon={<UserRound size={16} />} placeholder="Nombre" />
              <Input icon={<UserRound size={16} />} placeholder="Apellido" />
            </div>
            <Input icon={<Mail size={16} />} placeholder="Correo electrónico" />
            <Input icon={<KeyRound size={16} />} type="password" placeholder="Contraseña" />
            <Input icon={<KeyRound size={16} />} type="password" placeholder="Confirmar contraseña" />
            <Button className="w-full" rightIcon={<ArrowRight size={16} />}>
              Create Account
            </Button>
            <p className="text-xs text-[var(--text-3)]">
              ¿Ya tienes cuenta?{" "}
              <Link href="/auth/login" className="text-[var(--color-primary-soft)] hover:text-white">
                Inicia sesión
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
