import { NextRequest } from "next/server";
import { createAdminStyle } from "@/server/db/admin-taxonomy";
import { validateStyleCreateInput } from "@/server/validation/admin";
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
  const parsedInput = validateStyleCreateInput({
    slug: formData.get("slug")?.toString(),
    name: formData.get("name")?.toString(),
    summary: formData.get("summary")?.toString(),
    categoryPrimary: formData.get("categoryPrimary")?.toString(),
    level: formData.get("level")?.toString(),
    historicalCulturalContext: formData.get("historicalCulturalContext")?.toString(),
    movementPrinciples: formData.get("movementPrinciples")?.toString(),
    musicalityBasics: formData.get("musicalityBasics")?.toString(),
  });

  if (!parsedInput.ok) {
    return mutationErrorResponse(request, "/admin/styles", {
      formError: parsedInput.formError,
      fieldErrors: parsedInput.fieldErrors,
      status: 422,
    });
  }

  const result = await createAdminStyle({
    ...parsedInput.data,
    actorRole: access.actorRole,
  });

  if (!result.ok || !result.slug) {
    return mutationErrorResponse(request, "/admin/styles", {
      formError: result.message,
      fieldErrors: {},
      status: 422,
    });
  }

  return mutationSuccessResponse(
    request,
    `/admin/styles/${encodeURIComponent(result.slug)}`,
    {
      message: result.message,
      data: {
        slug: result.slug,
      },
    },
  );
}
