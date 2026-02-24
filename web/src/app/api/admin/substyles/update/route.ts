import { NextRequest } from "next/server";
import { updateAdminSubstyleBySlug } from "@/server/db/admin-taxonomy";
import { validateSubstyleUpdateInput } from "@/server/validation/admin";
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
  const parsedInput = validateSubstyleUpdateInput({
    slug: formData.get("slug")?.toString() ?? "",
    styleSlug: formData.get("styleSlug")?.toString(),
    name: formData.get("name")?.toString(),
    summary: formData.get("summary")?.toString(),
    historicalCulturalContext: formData.get("historicalCulturalContext")?.toString(),
    technicalFocus: formData.get("technicalFocus")?.toString(),
    musicalFocus: formData.get("musicalFocus")?.toString(),
  });
  const slug = parsedInput.ok ? parsedInput.data.slug : formData.get("slug")?.toString().trim() ?? "";
  const redirectPath = safeAdminRedirectPath(
    formData.get("redirectTo"),
    slug ? `/admin/substyles/${encodeURIComponent(slug)}` : "/admin/substyles",
  );

  if (!parsedInput.ok) {
    return mutationErrorResponse(request, redirectPath, {
      formError: parsedInput.formError,
      fieldErrors: parsedInput.fieldErrors,
      status: 422,
    });
  }

  const result = await updateAdminSubstyleBySlug({
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
