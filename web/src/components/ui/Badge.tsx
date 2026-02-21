import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type BadgeVariant = "primary" | "neutral" | "success" | "warning" | "danger";

const variantMap: Record<BadgeVariant, string> = {
  primary: "bg-[var(--color-primary)]/15 text-[var(--color-primary-soft)] border-[var(--color-primary)]/35",
  neutral: "bg-white/10 text-[var(--text-2)] border-white/15",
  success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/35",
  warning: "bg-amber-500/15 text-amber-300 border-amber-500/35",
  danger: "bg-rose-500/15 text-rose-300 border-rose-500/35",
};

export function Badge({
  variant = "neutral",
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em]",
        variantMap[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
