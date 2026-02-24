import { NextRequest } from "next/server";
import { linkAdminMediaToEntity } from "@/server/db/admin-media";
import { validateMediaLinkInput } from "@/server/validation/admin";
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
  const parsedInput = validateMediaLinkInput({
    entityType: formData.get("entityType")?.toString() ?? "",
    entityRef: formData.get("entityRef")?.toString() ?? "",
    mediaId: formData.get("mediaId")?.toString(),
    mediaUrl: formData.get("mediaUrl")?.toString(),
    role: formData.get("role")?.toString(),
  });

  if (!parsedInput.ok) {
    return mutationErrorResponse(request, redirectPath, {
      formError: parsedInput.formError,
      fieldErrors: parsedInput.fieldErrors,
      status: 422,
    });
  }

  const result = await linkAdminMediaToEntity({
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
