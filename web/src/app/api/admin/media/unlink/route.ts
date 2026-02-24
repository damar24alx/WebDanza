import { NextRequest } from "next/server";
import { unlinkAdminMediaFromEntity } from "@/server/db/admin-media";
import { deleteStoredMedia } from "@/server/media/storage";
import { logEvent } from "@/server/observability/logger";
import { validateMediaUnlinkInput } from "@/server/validation/admin";
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
  const parsedInput = validateMediaUnlinkInput({
    entityType: formData.get("entityType")?.toString() ?? "",
    entityRef: formData.get("entityRef")?.toString() ?? "",
    mediaId: formData.get("mediaId")?.toString(),
    mediaUrl: formData.get("mediaUrl")?.toString(),
  });

  if (!parsedInput.ok) {
    return mutationErrorResponse(request, redirectPath, {
      formError: parsedInput.formError,
      fieldErrors: parsedInput.fieldErrors,
      status: 422,
    });
  }

  const result = await unlinkAdminMediaFromEntity({
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

  if (result.mediaDeleted && result.deletedMediaPath) {
    const removed = await deleteStoredMedia(result.deletedMediaPath);
    if (!removed.ok) {
      logEvent("warn", "admin.media.unlink.file_cleanup_failed", {
        path: request.nextUrl.pathname,
        actorUserId: access.actorUserId,
        mediaId: result.mediaId ?? null,
        mediaPath: result.deletedMediaPath,
        reason: removed.message,
      });
    }
  }

  return mutationSuccessResponse(request, redirectPath, {
    message: result.message,
    data: {
      mediaId: result.mediaId ?? null,
      mediaDeleted: result.mediaDeleted ?? false,
      deletedMediaPath: result.deletedMediaPath ?? null,
    },
  });
}
