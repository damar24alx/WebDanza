import { NextRequest } from "next/server";
import { updateAdminMoveBySlug } from "@/server/db/admin-moves";
import { validateMoveUpdateInput } from "@/server/validation/admin";
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
  const parsedInput = validateMoveUpdateInput({
    slug: formData.get("slug")?.toString() ?? "",
    name: formData.get("name")?.toString(),
    summary: formData.get("summary")?.toString(),
    moveType: formData.get("moveType")?.toString(),
    difficulty: formData.get("difficulty")?.toString(),
    family: formData.get("family")?.toString(),
    bpmRange: formData.get("bpmRange")?.toString(),
    stepByStep: formData.get("stepByStep")?.toString(),
    commonMistakes: formData.get("commonMistakes")?.toString(),
  });
  const slug = parsedInput.ok ? parsedInput.data.slug : formData.get("slug")?.toString().trim() ?? "";
  const redirectPath = safeAdminRedirectPath(
    formData.get("redirectTo"),
    slug ? `/admin/review?item=${encodeURIComponent(slug)}&tab=tags` : "/admin",
  );

  if (!parsedInput.ok) {
    return mutationErrorResponse(request, redirectPath, {
      formError: parsedInput.formError,
      fieldErrors: parsedInput.fieldErrors,
      status: 422,
    });
  }

  const result = await updateAdminMoveBySlug({
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
      slug: result.slug ?? parsedInput.data.slug,
    },
  });
}
