import Link from "next/link";
import { cn } from "@/lib/cn";

export type TabItem = {
  label: string;
  value: string;
  href?: string;
  count?: number;
  disabled?: boolean;
};

type TabsProps = {
  items: TabItem[];
  activeValue: string;
  className?: string;
};

export function Tabs({ items, activeValue, className }: TabsProps) {
  return (
    <div
      className={cn(
        "inline-flex max-w-full gap-2 overflow-x-auto rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] p-1",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === activeValue;
        const body = (
          <span
            className={cn(
              "inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              active
                ? "bg-[var(--color-primary)] text-white"
                : "text-[var(--text-2)] hover:bg-white/5 hover:text-[var(--text-1)]",
              item.disabled && "pointer-events-none opacity-40",
            )}
          >
            {item.label}
            {typeof item.count === "number" ? (
              <span className="rounded-full bg-black/20 px-2 py-0.5 text-[11px]">
                {item.count}
              </span>
            ) : null}
          </span>
        );

        if (item.href && !item.disabled) {
          return (
            <Link key={item.value} href={item.href}>
              {body}
            </Link>
          );
        }

        return <div key={item.value}>{body}</div>;
      })}
    </div>
  );
}
