"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, Music2 } from "lucide-react";
import { cn } from "@/lib/cn";

const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/styles", label: "Styles" },
  { href: "/moves", label: "Moves" },
  { href: "/learn", label: "Learn" },
  { href: "/pricing", label: "Pricing" },
  { href: "/me", label: "Mi Panel" },
  { href: "/admin", label: "Admin" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-1)] bg-[color:rgba(10,11,22,0.88)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-[var(--color-primary)] text-white">
            <Music2 size={18} />
          </span>
          <span className="font-display text-base font-bold tracking-tight text-[var(--text-1)]">
            Dance Academy
          </span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "bg-[var(--color-primary)]/15 text-[var(--color-primary-soft)]"
                    : "text-[var(--text-2)] hover:bg-white/5 hover:text-[var(--text-1)]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            className="hidden rounded-lg p-2 text-[var(--text-3)] transition-colors hover:bg-white/10 hover:text-[var(--text-1)] sm:inline-flex"
            type="button"
            aria-label="Notificaciones"
          >
            <Bell size={18} />
          </button>
          <Link
            href="/auth/login"
            className="hidden rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-strong)] sm:inline-flex"
          >
            Ingresar
          </Link>
          <details className="relative md:hidden">
            <summary className="list-none rounded-lg p-2 text-[var(--text-2)] hover:bg-white/10">
              <Menu size={19} />
            </summary>
            <div className="absolute right-0 mt-2 w-52 rounded-xl border border-[var(--border-1)] bg-[var(--surface-1)] p-2 shadow-xl">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-lg px-3 py-2 text-sm text-[var(--text-2)] hover:bg-white/5 hover:text-[var(--text-1)]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
