import { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { cn } from "@/lib/cn";

export function AppShell({
  children,
  fullWidth = false,
  hideFooter = false,
  className,
}: {
  children: ReactNode;
  fullWidth?: boolean;
  hideFooter?: boolean;
  className?: string;
}) {
  return (
    <div className="min-h-screen bg-[var(--surface-0)]">
      <Navbar />
      <main
        className={cn(
          "mx-auto w-full px-4 py-8 sm:px-6",
          fullWidth ? "max-w-none" : "max-w-7xl",
          className,
        )}
      >
        {children}
      </main>
      {!hideFooter ? <Footer /> : null}
    </div>
  );
}
