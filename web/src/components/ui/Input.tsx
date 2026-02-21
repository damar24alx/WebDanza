import { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  icon?: ReactNode;
};

export function Input({ className, icon, ...props }: InputProps) {
  return (
    <label
      className={cn(
        "flex h-11 items-center gap-2 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm transition-colors focus-within:border-[var(--color-primary)]",
        className,
      )}
    >
      {icon ? <span className="text-[var(--text-3)]">{icon}</span> : null}
      <input
        className="w-full border-none bg-transparent text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none"
        {...props}
      />
    </label>
  );
}
