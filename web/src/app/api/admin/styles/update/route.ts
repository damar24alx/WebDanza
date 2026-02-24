import { NextRequest } from "next/server";
import { updateAdminStyleBySlug } from "@/server/db/admin-taxonomy";
import { validateStyleUpdateInput } from "@/server/validation/admin";
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
  const parsedInput = validateStyleUpdateInput({
    slug: formData.get("slug")?.toString() ?? "",
    name: formData.get("name")?.toString(),
    summary: formData.get("summary")?.toString(),
    categoryPrimary: formData.get("categoryPrimary")?.toString(),
    level: formData.get("level")?.toString(),
    historicalCulturalContext: formData.get("historicalCulturalContext")?.toString(),
    movementPrinciples: formData.get("movementPrinciples")?.toString(),
    musicalityBasics: formData.get("musicalityBasics")?.toString(),
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

  const result = await updateAdminStyleBySlug({
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
