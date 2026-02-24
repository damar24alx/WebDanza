import Link from "next/link";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout";
import { Badge, Button, Card, CardContent } from "@/components/ui";
import { requireAuthenticatedUser } from "@/server/auth/current-user";
import { getUserCertificates } from "@/server/db/profile";

type CertificatesSearchParams = Promise<{
  code?: string;
}>;

export default async function CertificatesPage({
  searchParams,
}: {
  searchParams: CertificatesSearchParams;
}) {
  const user = await requireAuthenticatedUser();
  const params = await searchParams;
  const certificates = await getUserCertificates(user.id);
  const certificate = certificates.find((item) => item.status === "active") ?? certificates[0] ?? null;

  const normalizedCode = (params.code ?? "").trim().toUpperCase();
  const hasCode = normalizedCode.length > 0;
  const activeCodes = new Set(
    certificates
      .filter((item) => item.status === "active")
      .map((item) => item.certificateCode.toUpperCase()),
  );
  const isValidCode = hasCode && activeCodes.has(normalizedCode);
  const isCertificateActive = certificate?.status === "active";

  return (
    <AppShell fullWidth>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-6">
        <header className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6">
          <Badge variant="primary">Logro desbloqueado</Badge>
          <h1 className="mt-3 text-4xl font-bold text-white">Certificado de finalizacion</h1>
          <p className="mt-2 text-sm text-[var(--text-2)]">
            Certificados verificables emitidos por finalizacion de rutas MVP.
          </p>
        </header>

        <Card className="overflow-hidden">
          <div className="hero-overlay p-8 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--color-primary-soft)]">
              Certificado de excelencia
            </p>
            <h2 className="mt-6 text-5xl font-semibold text-white">Certificado de finalizacion</h2>
            <p className="mt-4 text-sm text-[var(--text-2)]">Se certifica que</p>
            <p className="mt-1 text-3xl font-bold text-white">{user.name}</p>
            <p className="mt-3 text-sm text-[var(--text-2)]">ha completado exitosamente</p>
            <p className="mt-1 text-3xl font-bold uppercase tracking-tight text-[var(--color-primary-soft)]">
              {certificate?.course.title ?? "Sin certificado todavia"}
            </p>
            {certificate ? (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-[var(--text-3)]">
                <span>Emitido: {certificate.issuedAt.toISOString().slice(0, 10)}</span>
                <span>Codigo: {certificate.certificateCode}</span>
                <span>Estado: {certificate.status}</span>
              </div>
            ) : null}
          </div>

          <CardContent className="grid gap-4 md:grid-cols-[1fr,auto]">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
                <ShieldCheck size={16} />
                {certificate
                  ? isCertificateActive
                    ? "Certificado disponible"
                    : "Certificado revocado"
                  : "Aun no hay certificados emitidos"}
              </p>
              <p className="mt-1 text-xs text-emerald-100/80">
                Estado: {certificate ? (isCertificateActive ? "Valido" : "Revocado") : "Pendiente"}
              </p>
            </div>

            <form action="/me/certificates" className="flex flex-col gap-2">
              <label
                htmlFor="certificate-code"
                className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-3)]"
              >
                Validar codigo
              </label>
              <input
                id="certificate-code"
                name="code"
                defaultValue={params.code}
                placeholder={certificate?.certificateCode ?? "Sin certificados"}
                className="h-10 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]"
              />
              <Button leftIcon={<CheckCircle2 size={16} />} type="submit">
                Validar codigo
              </Button>
              {certificate && isCertificateActive ? (
                <Link href={`/certificates/verify/${encodeURIComponent(certificate.certificateCode)}`}>
                  <Button variant="outline" type="button">
                    Verificacion publica
                  </Button>
                </Link>
              ) : null}
            </form>
          </CardContent>
        </Card>

        {hasCode ? (
          <Card className={isValidCode ? "border-emerald-500/40" : "border-rose-500/40"}>
            <CardContent>
              <p className={`text-sm font-semibold ${isValidCode ? "text-emerald-200" : "text-rose-200"}`}>
                {isValidCode
                  ? "Codigo valido: certificado confirmado."
                  : "Codigo invalido: verifica el valor ingresado."}
              </p>
              {!isValidCode ? (
                <Link href="/me/certificates" className="mt-3 inline-flex">
                  <Button variant="outline" size="sm" type="button">
                    Limpiar validacion
                  </Button>
                </Link>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
