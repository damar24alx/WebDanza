import Link from "next/link";
import { cn } from "@/lib/cn";

export type SidebarItem = {
  label: string;
  href?: string;
  active?: boolean;
  muted?: boolean;
};

export function Sidebar({
  title,
  items,
  className,
}: {
  title: string;
  items: SidebarItem[];
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "w-full rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-4 lg:w-72",
        className,
      )}
    >
      <p className="mb-4 px-2 text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-3)]">
        {title}
      </p>
      <nav className="space-y-1">
        {items.map((item) => {
          const classes = cn(
            "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            item.active
              ? "bg-[var(--color-primary)]/15 text-[var(--color-primary-soft)]"
              : "text-[var(--text-2)] hover:bg-white/5 hover:text-[var(--text-1)]",
            item.muted && "opacity-45",
          );

          if (item.href && !item.muted) {
            return (
              <Link key={item.label} href={item.href} className={classes}>
                {item.label}
              </Link>
            );
          }

          return (
            <div key={item.label} className={classes}>
              {item.label}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
