import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/cn";

type EmptyStateProps = {
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
};

export function EmptyState({
  title = "Sin resultados",
  description = "No encontramos contenido con esos filtros. Ajusta la busqueda y vuelve a intentar.",
  ctaLabel = "Limpiar filtros",
  ctaHref,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
        <div className="mb-4 rounded-full bg-[var(--color-primary)]/15 p-4 text-[var(--color-primary-soft)]">
          <SearchX size={28} />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-1)]">{title}</h2>
        <p className="mt-2 max-w-md text-sm text-[var(--text-2)]">{description}</p>
        {ctaHref ? (
          <Link href={ctaHref} className="mt-6">
            <Button>{ctaLabel}</Button>
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
