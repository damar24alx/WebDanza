import Link from "next/link";
import { ShieldCheck, ShieldX } from "lucide-react";
import { AppShell } from "@/components/layout";
import { Badge, Button, Card, CardContent } from "@/components/ui";
import { getCertificateByCode } from "@/server/db/profile";

export default async function CertificateVerificationPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const certificate = await getCertificateByCode(code);

  return (
    <AppShell fullWidth>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 sm:px-6">
        <header className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6">
          <Badge variant="primary">Verificacion de certificado</Badge>
          <h1 className="mt-3 text-3xl font-bold text-white">Validacion publica</h1>
          <p className="mt-2 text-sm text-[var(--text-2)]">
            Codigo consultado: <span className="font-semibold text-white">{code}</span>
          </p>
        </header>

        <Card className={certificate ? "border-emerald-500/35" : "border-rose-500/35"}>
          <CardContent>
            {certificate ? (
              <>
                <p className="flex items-center gap-2 text-emerald-200">
                  <ShieldCheck size={18} />
                  Certificado valido
                </p>
                <ul className="mt-4 space-y-2 text-sm text-[var(--text-2)]">
                  <li className="rounded-lg border border-[var(--border-1)] px-3 py-2">
                    Estudiante: <span className="font-semibold text-white">{certificate.user.name}</span>
                  </li>
                  <li className="rounded-lg border border-[var(--border-1)] px-3 py-2">
                    Curso: <span className="font-semibold text-white">{certificate.course.title}</span>
                  </li>
                  <li className="rounded-lg border border-[var(--border-1)] px-3 py-2">
                    Fecha de emision:{" "}
                    <span className="font-semibold text-white">
                      {certificate.issuedAt.toISOString().slice(0, 10)}
                    </span>
                  </li>
                </ul>
              </>
            ) : (
              <>
                <p className="flex items-center gap-2 text-rose-200">
                  <ShieldX size={18} />
                  Certificado no encontrado
                </p>
                <p className="mt-3 text-sm text-[var(--text-2)]">
                  El codigo no existe o no es valido.
                </p>
              </>
            )}

            <div className="mt-6">
              <Link href="/me/certificates">
                <Button variant="outline" type="button">
                  Ir a certificados
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
