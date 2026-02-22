import Link from "next/link";
import { RefreshCcw, WifiOff } from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/cn";

type ErrorStateProps = {
  title?: string;
  description?: string;
  retryHref?: string;
  retryLabel?: string;
  className?: string;
};

export function ErrorState({
  title = "Connection interrupted",
  description = "No pudimos cargar este contenido. Revisa tu conexion e intenta nuevamente.",
  retryHref,
  retryLabel = "Reintentar",
  className,
}: ErrorStateProps) {
  return (
    <Card className={cn("border-rose-500/25", className)}>
      <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
        <div className="mb-4 rounded-full bg-rose-500/15 p-4 text-rose-300">
          <WifiOff size={28} />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-1)]">{title}</h2>
        <p className="mt-2 max-w-md text-sm text-[var(--text-2)]">{description}</p>
        {retryHref ? (
          <Link href={retryHref} className="mt-6">
            <Button leftIcon={<RefreshCcw size={16} />} variant="outline">
              {retryLabel}
            </Button>
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
