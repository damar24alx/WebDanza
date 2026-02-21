import Link from "next/link";
import { Instagram, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border-1)] bg-[var(--surface-2)]/40">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <h3 className="font-display text-xl font-bold text-[var(--text-1)]">
            Dance Academy
          </h3>
          <p className="mt-3 text-sm text-[var(--text-2)]">
            Enciclopedia y academia digital para aprender danza con rutas claras.
          </p>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-3)]">
            Plataforma
          </p>
          <div className="space-y-2 text-sm text-[var(--text-2)]">
            <Link href="/styles" className="block hover:text-[var(--text-1)]">
              Styles
            </Link>
            <Link href="/moves" className="block hover:text-[var(--text-1)]">
              Moves
            </Link>
            <Link href="/learn" className="block hover:text-[var(--text-1)]">
              Learn
            </Link>
          </div>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-3)]">
            Cuenta
          </p>
          <div className="space-y-2 text-sm text-[var(--text-2)]">
            <Link href="/me" className="block hover:text-[var(--text-1)]">
              Dashboard
            </Link>
            <Link href="/me/certificates" className="block hover:text-[var(--text-1)]">
              Certificados
            </Link>
            <Link href="/auth/register" className="block hover:text-[var(--text-1)]">
              Crear cuenta
            </Link>
          </div>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-3)]">
            Comunidad
          </p>
          <div className="flex items-center gap-3 text-[var(--text-2)]">
            <span className="rounded-lg border border-[var(--border-1)] p-2">
              <Instagram size={16} />
            </span>
            <span className="rounded-lg border border-[var(--border-1)] p-2">
              <Youtube size={16} />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
