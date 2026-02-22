import { cn } from "@/lib/cn";

type LoadingSkeletonProps = {
  variant?: "list" | "detail" | "player";
  className?: string;
};

export function LoadingSkeleton({
  variant = "list",
  className,
}: LoadingSkeletonProps) {
  if (variant === "detail") {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="shimmer h-72 rounded-3xl border border-[var(--border-1)] bg-[var(--surface-1)]" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="shimmer h-48 rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] lg:col-span-2" />
          <div className="shimmer h-48 rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)]" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="shimmer h-64 rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)]" />
          <div className="shimmer h-64 rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)]" />
        </div>
      </div>
    );
  }

  if (variant === "player") {
    return (
      <div className={cn("grid min-h-[calc(100vh-4rem)] gap-0 lg:grid-cols-[320px,1fr]", className)}>
        <aside className="border-r border-[var(--border-1)] bg-[var(--surface-1)] p-4">
          <div className="shimmer mb-3 h-4 w-32 rounded bg-[var(--surface-2)]" />
          <div className="shimmer mb-6 h-6 w-44 rounded bg-[var(--surface-2)]" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={`lesson-skeleton-${idx}`}
                className="shimmer h-18 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)]"
              />
            ))}
          </div>
        </aside>
        <main className="space-y-6 p-6 lg:p-8">
          <div className="shimmer aspect-video rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)]" />
          <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
            <div className="shimmer h-56 rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)]" />
            <div className="shimmer h-56 rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)]" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="shimmer h-36 rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={`card-skeleton-${idx}`}
            className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-4"
          >
            <div className="shimmer mb-4 h-28 rounded-xl bg-[var(--surface-2)]" />
            <div className="shimmer mb-2 h-6 w-2/3 rounded bg-[var(--surface-2)]" />
            <div className="shimmer mb-1 h-4 w-full rounded bg-[var(--surface-2)]" />
            <div className="shimmer h-4 w-4/5 rounded bg-[var(--surface-2)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
