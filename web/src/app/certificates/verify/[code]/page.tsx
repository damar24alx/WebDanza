import Link from "next/link";
import { Copy, Download, Share2, ShieldCheck, ShieldX, Star } from "lucide-react";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui";
import { getCertificateByCode } from "@/server/db/profile";

export default async function CertificateVerificationPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const certificate = await getCertificateByCode(code);
  const issuedAt = certificate
    ? certificate.issuedAt.toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <AppShell fullWidth hideFooter className="px-0 py-0 sm:px-0">
      <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-[#181205]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,196,58,0.1),transparent_55%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(245,196,58,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(245,196,58,0.08)_1px,transparent_1px)] bg-[size:44px_44px]" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#4f3f1e] bg-[#151005]/80 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="grid size-8 place-items-center rounded-md bg-[#f5c43a] text-[#221704]">
                <Star size={16} />
              </div>
              <span className="text-xl font-bold text-[#f9efd2]">Dance Academy</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-[#5f4a22] bg-[#1d1508] px-3 py-2 text-xs font-semibold tracking-[0.08em] text-[#d9b35b]">
              <ShieldCheck size={14} />
              {certificate?.certificateCode ?? code}
            </div>
          </div>

          {certificate ? (
            <>
              <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#d9b35b]">
                    Achievement unlocked
                  </p>
                  <h1 className="mt-2 text-4xl font-bold text-[#f8f1dd]">{certificate.course.title}</h1>
                  <p className="mt-2 text-base text-[#cbb993]">Completado el {issuedAt}.</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    type="button"
                    className="border-[#4b5f8c] bg-[#1d2940] text-[#d9e5ff] hover:border-[#6b7ba3] hover:bg-[#273754]"
                    leftIcon={<Share2 size={16} />}
                  >
                    Share
                  </Button>
                  <Button
                    type="button"
                    className="bg-[#f5c43a] text-[#1f1502] hover:bg-[#f7cf63]"
                    leftIcon={<Download size={16} />}
                  >
                    Download PDF
                  </Button>
                </div>
              </header>

              <div className="relative overflow-hidden rounded-2xl border border-[#5f4a22] bg-[#110d05] p-3">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,196,58,0.08),transparent_70%)]" />
                <div className="relative rounded-xl border border-[#aa832f] p-8 sm:p-12">
                  <div className="text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#d9b35b]">
                      Dance Academy
                    </p>
                    <p className="mt-6 text-xs font-semibold uppercase tracking-[0.35em] text-[#b59755]">
                      Certificate of Excellence
                    </p>
                    <h2 className="mt-8 text-4xl font-semibold text-[#f8f1dd] sm:text-6xl">
                      Certificate of Completion
                    </h2>
                    <p className="mt-8 text-xs uppercase tracking-[0.25em] text-[#9f8750]">
                      This acknowledges that
                    </p>
                    <p className="mt-4 font-serif text-6xl italic text-[#f5c43a] sm:text-7xl">
                      {certificate.user.name}
                    </p>
                    <p className="mx-auto mt-7 max-w-2xl text-lg text-[#d8c79f]">
                      Ha completado exitosamente el programa y demostro dominio tecnico en el arte del movimiento.
                    </p>
                    <p className="mt-6 text-3xl font-bold uppercase tracking-wide text-[#f5c43a]">
                      {certificate.course.title}
                    </p>
                    <p className="mt-8 text-xs uppercase tracking-[0.3em] text-[#8f7540]">
                      Verification ID: {certificate.certificateCode}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-[#4a3a1d] bg-[#120d04] p-6">
                  <h3 className="text-2xl font-bold text-[#f8f1dd]">Curriculum Details</h3>
                  <ul className="mt-4 space-y-3 text-[#d8c79f]">
                    <li>Fundamentos tecnicos del estilo y control de groove.</li>
                    <li>Drills de coordinacion y transicion musical.</li>
                    <li>Aplicacion en secuencias y practica guiada.</li>
                    <li>Trabajo de precision, dinamica y presencia escenica.</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-[#4a3a1d] bg-[#120d04] p-6">
                  <h3 className="text-2xl font-bold text-[#f8f1dd]">Verification</h3>
                  <p className="mt-4 text-[#d8c79f]">
                    Este certificado puede verificarse con el codigo oficial en la plataforma.
                  </p>
                  <div className="mt-5 inline-flex items-center gap-3 rounded-lg border border-[#7a612f] bg-[#1a1307] px-4 py-3">
                    <span className="text-lg font-semibold tracking-[0.08em] text-[#f5c43a]">
                      {certificate.certificateCode}
                    </span>
                    <Copy size={16} className="text-[#c7ab65]" />
                  </div>
                  <p className="mt-4 text-sm text-[#9a8450]">
                    Emitido por Dance Academy Platform.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-rose-500/35 bg-rose-500/10 p-6">
              <p className="flex items-center gap-2 text-rose-200">
                <ShieldX size={18} />
                Certificado no encontrado
              </p>
              <p className="mt-3 text-sm text-rose-100/85">
                El codigo consultado no existe o no corresponde a un certificado activo.
              </p>
              <p className="mt-2 text-sm text-rose-100/85">
                Codigo: <span className="font-semibold text-white">{code}</span>
              </p>
            </div>
          )}

          <div className="mt-6">
            <Link href="/me/certificates">
              <Button variant="outline" type="button" className="border-[#6d5b32] text-[#f2ddb0] hover:bg-[#1d1407]">
                Ir a certificados
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

