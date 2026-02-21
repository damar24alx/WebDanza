import { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  onCloseLabel?: string;
  className?: string;
};

export function Modal({
  open,
  title,
  description,
  children,
  onCloseLabel = "Cerrar",
  className,
}: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
      <div
        className={cn(
          "w-full max-w-lg rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6 shadow-2xl",
          className,
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-[var(--text-1)]">{title}</h3>
            {description ? (
              <p className="mt-1 text-sm text-[var(--text-2)]">{description}</p>
            ) : null}
          </div>
          <button
            className="rounded-lg p-1 text-[var(--text-3)] transition-colors hover:bg-white/10 hover:text-[var(--text-1)]"
            type="button"
          >
            <X size={18} />
          </button>
        </div>
        <div>{children}</div>
        <div className="mt-6 flex justify-end">
          <Button variant="outline" type="button">
            {onCloseLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
