import { Lock, RefreshCcw, SearchX, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export function LoadingState({
  title = "Cargando contenido",
  subtitle = "Estamos preparando la siguiente sección de aprendizaje...",
  className,
}: {
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="h-44 w-full animate-pulse bg-gradient-to-r from-white/5 via-white/10 to-white/5" />
      <CardContent>
        <div className="space-y-3">
          <div className="h-8 w-3/4 animate-pulse rounded-md bg-white/10" />
          <div className="h-5 w-full animate-pulse rounded-md bg-white/10" />
          <div className="h-5 w-2/3 animate-pulse rounded-md bg-white/10" />
        </div>
        <div className="mt-6">
          <p className="text-lg font-bold text-[var(--text-1)]">{title}</p>
          <p className="mt-1 text-sm text-[var(--text-3)]">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function EmptyState({
  title = "Sin resultados",
  subtitle = "Prueba con otros filtros o vuelve a la vista general.",
  className,
}: {
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
        <div className="mb-4 rounded-full bg-[var(--color-primary)]/15 p-4 text-[var(--color-primary-soft)]">
          <SearchX size={28} />
        </div>
        <h3 className="text-2xl font-bold text-[var(--text-1)]">{title}</h3>
        <p className="mt-2 max-w-sm text-sm text-[var(--text-2)]">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

export function ErrorState({
  title = "Conexión interrumpida",
  subtitle = "No se pudo completar la operación. Inténtalo de nuevo.",
  buttonLabel = "Reintentar",
  className,
}: {
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  className?: string;
}) {
  return (
    <Card className={cn("border-rose-500/25", className)}>
      <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
        <div className="mb-4 rounded-full bg-rose-500/15 p-4 text-rose-300">
          <WifiOff size={28} />
        </div>
        <h3 className="text-2xl font-bold text-[var(--text-1)]">{title}</h3>
        <p className="mt-2 max-w-sm text-sm text-[var(--text-2)]">{subtitle}</p>
        <Button
          variant="outline"
          className="mt-6"
          leftIcon={<RefreshCcw size={16} />}
          type="button"
        >
          {buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

export function LockedState({
  title = "Contenido bloqueado",
  subtitle = "Completa el módulo previo para desbloquear esta sección.",
  className,
}: {
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <Card className={cn("border-amber-500/25 bg-amber-500/5", className)}>
      <CardContent className="flex min-h-56 flex-col items-center justify-center text-center">
        <div className="mb-4 rounded-full bg-amber-500/15 p-4 text-amber-300">
          <Lock size={26} />
        </div>
        <h3 className="text-xl font-bold text-[var(--text-1)]">{title}</h3>
        <p className="mt-2 max-w-sm text-sm text-[var(--text-2)]">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
