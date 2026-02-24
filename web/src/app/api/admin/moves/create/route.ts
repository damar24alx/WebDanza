import { NextRequest } from "next/server";
import { createAdminMove } from "@/server/db/admin-moves";
import { validateMoveCreateInput } from "@/server/validation/admin";
import {
  mutationErrorResponse,
  mutationSuccessResponse,
  requireAdminApiAccess,
} from "../../_shared";

export async function POST(request: NextRequest) {
  const access = await requireAdminApiAccess(request);
  if (!access.ok) {
    return access.response;
  }

  const formData = await request.formData();
  const parsedInput = validateMoveCreateInput({
    slug: formData.get("slug")?.toString(),
    name: formData.get("name")?.toString(),
    summary: formData.get("summary")?.toString(),
    moveType: formData.get("moveType")?.toString(),
    difficulty: formData.get("difficulty")?.toString() ?? "",
    family: formData.get("family")?.toString(),
    bpmRange: formData.get("bpmRange")?.toString(),
  });

  if (!parsedInput.ok) {
    return mutationErrorResponse(request, "/admin", {
      formError: parsedInput.formError,
      fieldErrors: parsedInput.fieldErrors,
      status: 422,
    });
  }

  const result = await createAdminMove({
    ...parsedInput.data,
    actorRole: access.actorRole,
  });

  if (!result.ok || !result.slug) {
    return mutationErrorResponse(request, "/admin", {
      formError: result.message,
      fieldErrors: {},
      status: 422,
    });
  }

  return mutationSuccessResponse(
    request,
    `/admin/review?item=${encodeURIComponent(result.slug)}&tab=breakdown`,
    {
      message: result.message,
      data: {
        slug: result.slug,
      },
    },
  );
}
