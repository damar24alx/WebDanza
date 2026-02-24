import { NextRequest } from "next/server";
import { createAndLinkAdminMediaToEntity } from "@/server/db/admin-media";
import { validateMediaCreateLinkInput } from "@/server/validation/admin";
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
  const parsedInput = validateMediaCreateLinkInput({
    provider: formData.get("provider")?.toString() ?? "",
    url: formData.get("url")?.toString() ?? "",
    title: formData.get("title")?.toString() ?? "",
    rightsStatus: formData.get("rightsStatus")?.toString() ?? "",
    durationSec: formData.get("durationSec")?.toString(),
    entityType: formData.get("entityType")?.toString() ?? "",
    entityRef: formData.get("entityRef")?.toString() ?? "",
    role: formData.get("role")?.toString(),
  });

  if (!parsedInput.ok) {
    return mutationErrorResponse(request, redirectPath, {
      formError: parsedInput.formError,
      fieldErrors: parsedInput.fieldErrors,
      status: 422,
    });
  }

  const result = await createAndLinkAdminMediaToEntity({
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
    data: {
      mediaId: result.mediaId ?? null,
      linkId: result.linkId ?? null,
    },
  });
}
