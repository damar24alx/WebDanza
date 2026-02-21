import { cn } from "@/lib/cn";

type ProgressProps = {
  value: number;
  max?: number;
  label?: string;
  className?: string;
  showValue?: boolean;
};

export function Progress({
  value,
  max = 100,
  label,
  className,
  showValue = true,
}: ProgressProps) {
  const safeValue = Math.min(Math.max(value, 0), max);
  const percentage = Math.round((safeValue / max) * 100);

  return (
    <div className={cn("w-full space-y-2", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-[var(--text-2)]">{label}</span>
          {showValue ? (
            <span className="text-[var(--color-primary-soft)]">{percentage}%</span>
          ) : null}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-2 rounded-full bg-[var(--color-primary)] transition-[width] duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
