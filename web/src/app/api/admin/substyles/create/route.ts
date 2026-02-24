import { NextRequest } from "next/server";
import { createAdminSubstyle } from "@/server/db/admin-taxonomy";
import { validateSubstyleCreateInput } from "@/server/validation/admin";
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
  const parsedInput = validateSubstyleCreateInput({
    styleSlug: formData.get("styleSlug")?.toString() ?? "",
    slug: formData.get("slug")?.toString(),
    name: formData.get("name")?.toString(),
    summary: formData.get("summary")?.toString(),
    historicalCulturalContext: formData.get("historicalCulturalContext")?.toString(),
    technicalFocus: formData.get("technicalFocus")?.toString(),
    musicalFocus: formData.get("musicalFocus")?.toString(),
  });

  if (!parsedInput.ok) {
    return mutationErrorResponse(request, "/admin/substyles", {
      formError: parsedInput.formError,
      fieldErrors: parsedInput.fieldErrors,
      status: 422,
    });
  }

  const result = await createAdminSubstyle({
    ...parsedInput.data,
    actorRole: access.actorRole,
  });

  if (!result.ok || !result.slug) {
    return mutationErrorResponse(request, "/admin/substyles", {
      formError: result.message,
      fieldErrors: {},
      status: 422,
    });
  }

  return mutationSuccessResponse(
    request,
    `/admin/substyles/${encodeURIComponent(result.slug)}`,
    {
      message: result.message,
      data: {
        slug: result.slug,
      },
    },
  );
}
