import { CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastVariant = "success" | "error" | "warning" | "info";

const styleMap: Record<ToastVariant, string> = {
  success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-100",
  error: "border-rose-500/25 bg-rose-500/10 text-rose-100",
  warning: "border-amber-500/25 bg-amber-500/10 text-amber-100",
  info: "border-blue-500/25 bg-blue-500/10 text-blue-100",
};

const iconMap: Record<ToastVariant, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

type ToastProps = {
  title: string;
  message: string;
  variant?: ToastVariant;
  className?: string;
};

export function Toast({
  title,
  message,
  variant = "info",
  className,
}: ToastProps) {
  const Icon = iconMap[variant];

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 shadow-lg",
        styleMap[variant],
        className,
      )}
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-1 text-xs opacity-85">{message}</p>
      </div>
    </div>
  );
}
