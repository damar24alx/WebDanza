"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, Music2 } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { cn } from "@/lib/cn";

type NavbarSessionUser = {
  role: UserRole;
  name: string;
} | null;

function buildNavItems(session: NavbarSessionUser) {
  const items = [
    { href: "/", label: "Inicio" },
    { href: "/search", label: "Buscar" },
    { href: "/styles", label: "Estilos" },
    { href: "/moves", label: "Movimientos" },
    { href: "/learn", label: "Aprender" },
    { href: "/maps", label: "Mapas" },
    { href: "/pricing", label: "Precios" },
  ];

  if (session?.role === "ADMIN") {
    items.push({ href: "/admin", label: "Admin" });
  }

  if (session) {
    items.push({ href: "/me", label: "Mi Panel" });
  }

  return items;
}

export function Navbar({ session }: { session: NavbarSessionUser }) {
  const pathname = usePathname();
  const navItems = buildNavItems(session);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-white/10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
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
          {session ? (
            <>
              <Link
                href="/me"
                className="hidden rounded-lg p-2 text-[var(--text-3)] transition-colors hover:bg-white/10 hover:text-[var(--text-1)] sm:inline-flex"
                aria-label="Notificaciones"
              >
                <Bell size={18} />
              </Link>
              <form action="/api/auth/logout" method="post" className="hidden sm:block">
                <button
                  type="submit"
                  className="rounded-lg border border-[var(--border-1)] px-4 py-2 text-sm font-semibold text-[var(--text-2)] transition-colors hover:bg-white/5 hover:text-[var(--text-1)]"
                >
                  Salir
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="hidden rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-strong)] sm:inline-flex"
            >
              Ingresar
            </Link>
          )}
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
              {session ? (
                <form action="/api/auth/logout" method="post" className="mt-1">
                  <button
                    type="submit"
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--text-2)] hover:bg-white/5 hover:text-[var(--text-1)]"
                  >
                    Salir
                  </button>
                </form>
              ) : null}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
