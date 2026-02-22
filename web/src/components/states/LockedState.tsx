import Link from "next/link";
import { Lock } from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/cn";

type LockedStateProps = {
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
};

export function LockedState({
  title = "Contenido bloqueado",
  description = "Completa el modulo previo o mejora tu plan para desbloquear esta leccion.",
  ctaLabel = "Ver planes",
  ctaHref = "/pricing",
  className,
}: LockedStateProps) {
  return (
    <Card className={cn("border-amber-500/30 bg-amber-500/5", className)}>
      <CardContent className="flex min-h-56 flex-col items-center justify-center text-center">
        <div className="mb-4 rounded-full bg-amber-500/15 p-4 text-amber-300">
          <Lock size={26} />
        </div>
        <h2 className="text-xl font-bold text-[var(--text-1)]">{title}</h2>
        <p className="mt-2 max-w-md text-sm text-[var(--text-2)]">{description}</p>
        <Link href={ctaHref} className="mt-6">
          <Button>{ctaLabel}</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
