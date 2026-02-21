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
            <Input icon={<Mail size={16} />} placeholder="Correo electrónico" />
            <Button className="w-full">Send Recovery Link</Button>
            <p className="text-xs text-[var(--text-3)]">
              ¿Recordaste tu contraseña?{" "}
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
              Si el correo existe, recibirás instrucciones en los próximos minutos.
            </p>
            <Button variant="outline" className="mt-5 self-start" leftIcon={<RefreshCcw size={15} />}>
              Reenviar enlace
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
