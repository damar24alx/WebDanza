import { NextRequest } from "next/server";
import { createAndLinkAdminMediaToEntity } from "@/server/db/admin-media";
import { deleteStoredMedia, saveUploadedMedia } from "@/server/media/storage";
import { validateMediaUploadLinkInput } from "@/server/validation/admin";
import { logEvent } from "@/server/observability/logger";
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
  const parsedInput = validateMediaUploadLinkInput({
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

  const fileEntry = formData.get("file");
  if (!(fileEntry instanceof File) || fileEntry.size <= 0) {
    return mutationErrorResponse(request, redirectPath, {
      formError: "Debes seleccionar un archivo de video.",
      fieldErrors: {
        file: ["Debes seleccionar un archivo de video."],
      },
      status: 422,
    });
  }

  const savedMedia = await saveUploadedMedia(fileEntry);
  if (!savedMedia.ok) {
    return mutationErrorResponse(request, redirectPath, {
      formError: savedMedia.message,
      fieldErrors: {
        file: [savedMedia.message],
      },
      status: savedMedia.message.includes("No se pudo guardar") ? 500 : 422,
    });
  }

  const result = await createAndLinkAdminMediaToEntity({
    provider: "other",
    url: savedMedia.mediaPath,
    title: parsedInput.data.title,
    rightsStatus: parsedInput.data.rightsStatus,
    durationSec: parsedInput.data.durationSec,
    entityType: parsedInput.data.entityType,
    entityRef: parsedInput.data.entityRef,
    role: parsedInput.data.role,
    actorRole: access.actorRole,
  });

  if (!result.ok) {
    await deleteStoredMedia(savedMedia.mediaPath).catch(() => undefined);
    return mutationErrorResponse(request, redirectPath, {
      formError: result.message,
      fieldErrors: {},
      status: 422,
    });
  }

  logEvent("info", "admin.media.upload.success", {
    path: request.nextUrl.pathname,
    actorUserId: access.actorUserId,
    mediaId: result.mediaId ?? null,
    linkId: result.linkId ?? null,
    filePath: savedMedia.mediaPath,
    fileSizeBytes: savedMedia.fileSizeBytes,
  });

  return mutationSuccessResponse(request, redirectPath, {
    message: "Media subida y vinculada correctamente.",
    data: {
      mediaId: result.mediaId ?? null,
      linkId: result.linkId ?? null,
      filePath: savedMedia.mediaPath,
    },
  });
}
