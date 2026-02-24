import { NextRequest } from "next/server";
import { linkCitationToEntityByRef } from "@/server/db/admin-citations";
import { validateCitationLinkInput } from "@/server/validation/admin";
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
  const redirectPath = safeAdminRedirectPath(formData.get("redirectTo"), "/admin");
  const parsedInput = validateCitationLinkInput({
    entityType: formData.get("entityType")?.toString() ?? "",
    entityRef: formData.get("entityRef")?.toString() ?? "",
    title: formData.get("title")?.toString() ?? "",
    url: formData.get("url")?.toString(),
    author: formData.get("author")?.toString(),
    year: formData.get("year")?.toString(),
  });

  if (!parsedInput.ok) {
    return mutationErrorResponse(request, redirectPath, {
      formError: parsedInput.formError,
      fieldErrors: parsedInput.fieldErrors,
      status: 422,
    });
  }

  const result = await linkCitationToEntityByRef({
    ...parsedInput.data,
    actorRole: access.actorRole,
  });

  if (!result.ok) {
    return mutationErrorResponse(request, redirectPath, {
      formError: result.message,
      fieldErrors: {},
      status: 422,
    });
  }

  return mutationSuccessResponse(request, redirectPath, {
    message: result.message,
  });
}
