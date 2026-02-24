import { NextRequest } from "next/server";
import { reissueCertificateByCode } from "@/server/db/admin-certificates";
import { validateAdminCertificateActionInput } from "@/server/validation/certificate";
import {
  mutationErrorResponse,
  mutationSuccessResponse,
  requireAdminApiAccess,
  safeAdminRedirectPath,
} from "../../_shared";

export async function POST(request: NextRequest) {
  const access = await requireAdminApiAccess(request);
  if (!access.ok) {
    return access.response;
  }

  const formData = await request.formData();
  const redirectPath = safeAdminRedirectPath(formData.get("redirectTo"), "/admin/certificates");
  const parsedInput = validateAdminCertificateActionInput({
    code: formData.get("code")?.toString() ?? "",
    reason: formData.get("reason")?.toString() ?? "",
  });

  if (!parsedInput.ok) {
    return mutationErrorResponse(request, redirectPath, {
      formError: parsedInput.formError,
      fieldErrors: parsedInput.fieldErrors,
      status: 422,
    });
  }

  const result = await reissueCertificateByCode({
    code: parsedInput.data.code,
    reason: parsedInput.data.reason,
    actorRole: access.actorRole,
    actorUserId: access.actorUserId,
  });

  if (!result.ok) {
    return mutationErrorResponse(request, redirectPath, {
      formError: result.message,
      fieldErrors: {},
      status: 422,
    });
  }

  return mutationSuccessResponse(request, redirectPath, {
    message: result.nextCode
      ? `${result.message} Nuevo codigo: ${result.nextCode}.`
      : result.message,
    data: result.nextCode ? { nextCode: result.nextCode } : undefined,
  });
}

