import { NextRequest, NextResponse } from "next/server";
import { getCertificateByCode } from "@/server/db/profile";
import { logEvent } from "@/server/observability/logger";
import { validateCertificateCodeInput } from "@/server/validation/certificate";

type RouteContext = {
  params: Promise<{
    code: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { code } = await context.params;
  const requestPath = `/api/certificates/verify/${code}`;
  const parsedInput = validateCertificateCodeInput({
    code,
  });

  if (!parsedInput.ok) {
    logEvent("warn", "certificates.verify.validation_failed", {
      path: requestPath,
      fieldErrors: Object.keys(parsedInput.fieldErrors),
    });
    return NextResponse.json(
      {
        ok: false,
        formError: parsedInput.formError,
        fieldErrors: parsedInput.fieldErrors,
      },
      { status: 422 },
    );
  }

  const certificate = await getCertificateByCode(parsedInput.data.code);
  if (!certificate) {
    logEvent("warn", "certificates.verify.not_found", {
      path: requestPath,
      code: parsedInput.data.code,
    });
    return NextResponse.json(
      {
        ok: false,
        formError: "Certificado no encontrado.",
        fieldErrors: {
          code: ["Certificado no encontrado."],
        },
      },
      { status: 404 },
    );
  }

  logEvent("info", "certificates.verify.success", {
    path: requestPath,
    code: certificate.certificateCode,
  });

  return NextResponse.json({
    ok: true,
    certificate: {
      code: certificate.certificateCode,
      issuedAt: certificate.issuedAt.toISOString(),
      student: {
        name: certificate.user.name,
      },
      course: {
        title: certificate.course.title,
      },
    },
  });
}
