import Link from "next/link";
import { ArrowLeft, WifiOff } from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import { RetryActionButton } from "@/components/state/RetryActionButton";

export function NotFoundView() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardContent className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--color-primary-soft)]">
            Error 404
          </p>
          <p className="mt-2 text-[110px] font-black leading-none text-[var(--surface-2)]">404</p>
          <h1 className="mt-3 text-3xl font-bold text-white">Fuera de ritmo</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-2)]">
            La pagina que buscas dejo el escenario. Volvamos al flujo principal.
          </p>
          <Link href="/">
            <Button className="mt-6" leftIcon={<ArrowLeft size={16} />}>
              Volver al inicio
            </Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}

export function AppErrorView() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-xl border-rose-500/25">
        <CardContent className="text-center">
          <div className="mx-auto mb-4 inline-flex rounded-full bg-rose-500/10 p-3 text-rose-300">
            <WifiOff size={26} />
          </div>
          <h1 className="text-2xl font-bold text-white">Conexion interrumpida</h1>
          <p className="mt-2 text-sm text-[var(--text-2)]">
            Ocurrio un error del sistema. Puedes reintentar o volver al inicio.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <RetryActionButton />
            <Link href="/">
              <Button>Ir al inicio</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

