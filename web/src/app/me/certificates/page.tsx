import { CheckCircle2, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout";
import { Badge, Button, Card, CardContent } from "@/components/ui";
import { getCourseBySlug, userMock } from "@/mocks";

export default function CertificatesPage() {
  const certificate = userMock.certificates[0];
  const course = certificate ? getCourseBySlug(certificate.courseSlug) : null;

  return (
    <AppShell fullWidth>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-6">
        <header className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6">
          <Badge variant="primary">Achievement Unlocked</Badge>
          <h1 className="mt-3 text-4xl font-bold text-white">Course Completion Certificate</h1>
          <p className="mt-2 text-sm text-[var(--text-2)]">
            Certificados verificables emitidos por finalización de rutas MVP.
          </p>
        </header>

        <Card className="overflow-hidden">
          <div className="hero-overlay p-8 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--color-primary-soft)]">
              Certificate of Excellence
            </p>
            <h2 className="mt-6 text-5xl font-semibold text-white">Certificate of Completion</h2>
            <p className="mt-4 text-sm text-[var(--text-2)]">This certifies that</p>
            <p className="mt-1 text-3xl font-bold text-white">{userMock.name}</p>
            <p className="mt-3 text-sm text-[var(--text-2)]">has successfully completed</p>
            <p className="mt-1 text-3xl font-bold uppercase tracking-tight text-[var(--color-primary-soft)]">
              {course?.title ?? "Course"}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-[var(--text-3)]">
              <span>Issued: {certificate?.issuedAt}</span>
              <span>Code: {certificate?.code}</span>
            </div>
          </div>

          <CardContent className="grid gap-4 md:grid-cols-[1fr,auto]">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
                <ShieldCheck size={16} />
                Certificado verificado
              </p>
              <p className="mt-1 text-xs text-emerald-100/80">
                Estado: {certificate?.verified ? "Válido" : "Pendiente"}
              </p>
            </div>
            <Button leftIcon={<CheckCircle2 size={16} />}>Validar código</Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
