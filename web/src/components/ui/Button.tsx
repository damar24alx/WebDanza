import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variantMap: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-strong)] shadow-[0_12px_30px_-16px_rgba(109,76,255,0.85)]",
  secondary:
    "bg-white/10 text-white hover:bg-white/15 border border-white/15 backdrop-blur-sm",
  ghost: "bg-transparent text-[var(--text-1)] hover:bg-white/10",
  outline:
    "bg-transparent border border-[var(--border-1)] text-[var(--text-1)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]",
  danger: "bg-rose-500 text-white hover:bg-rose-600",
};

const sizeMap: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-sm",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  leftIcon,
  rightIcon,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-0)] disabled:pointer-events-none disabled:opacity-50",
        variantMap[variant],
        sizeMap[size],
        className,
      )}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
