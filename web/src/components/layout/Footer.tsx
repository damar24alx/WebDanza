import Link from "next/link";
import { Instagram, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border-1)] bg-[rgba(8,9,17,0.94)]">
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-6 pt-12 sm:px-6 lg:px-8">
        <div className="mb-10 grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-md bg-[var(--color-primary)] text-white">
                ♪
              </span>
              <span className="text-xl font-bold text-white">Dance Academy</span>
            </div>
            <p className="mt-4 text-sm text-[var(--text-2)]">
              Potenciando bailarines de todo el mundo con tecnica, historia y pedagogia.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-3)]">Plataforma</p>
            <div className="mt-4 space-y-2 text-sm text-[var(--text-2)]">
              <Link href="/styles" className="block hover:text-white">Enciclopedia</Link>
              <Link href="/learn" className="block hover:text-white">Academia</Link>
              <Link href="/instructors" className="block hover:text-white">Instructores</Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-3)]">Soporte</p>
            <div className="mt-4 space-y-2 text-sm text-[var(--text-2)]">
              <Link href="/help" className="block hover:text-white">Centro de ayuda</Link>
              <Link href="/legal/terms" className="block hover:text-white">Terminos del servicio</Link>
              <Link href="/legal/privacy" className="block hover:text-white">Privacidad</Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-3)]">Conectar</p>
            <div className="mt-4 flex items-center gap-4 text-[var(--text-2)]">
              <a
                href="https://x.com/danceacademy"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="X"
                className="hover:text-white"
              >
                <Twitter size={18} />
              </a>
              <a
                href="https://instagram.com/danceacademy"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Instagram"
                className="hover:text-white"
              >
                <Instagram size={18} />
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-3 border-t border-[var(--border-1)] pt-6 text-sm text-[var(--text-3)] md:flex-row md:items-center">
          <p>© 2026 Dance Academy. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <Link href="/sitemap.xml" className="hover:text-white">Mapa del sitio</Link>
            <Link href="/legal/cookies" className="hover:text-white">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
