import { NextRequest } from "next/server";
import { setAdminStyleStatusBySlug } from "@/server/db/admin-taxonomy";
import { validateStyleStatusInput } from "@/server/validation/admin";
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
  const parsedInput = validateStyleStatusInput({
    slug: formData.get("slug")?.toString() ?? "",
    targetStatus: formData.get("targetStatus")?.toString() ?? "",
  });
  const slug = parsedInput.ok ? parsedInput.data.slug : formData.get("slug")?.toString().trim() ?? "";
  const redirectPath = safeAdminRedirectPath(
    formData.get("redirectTo"),
    slug ? `/admin/styles/${encodeURIComponent(slug)}` : "/admin/styles",
  );

  if (!parsedInput.ok) {
    return mutationErrorResponse(request, redirectPath, {
      formError: parsedInput.formError,
      fieldErrors: parsedInput.fieldErrors,
      status: 422,
    });
  }

  const result = await setAdminStyleStatusBySlug({
    slug: parsedInput.data.slug,
    targetStatus: parsedInput.data.targetStatus,
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
      targetStatus: parsedInput.data.targetStatus,
    },
  });
}
