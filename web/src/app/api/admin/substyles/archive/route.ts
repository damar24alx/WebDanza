import { NextRequest } from "next/server";
import { archiveAdminSubstyleBySlug } from "@/server/db/admin-taxonomy";
import { validateSubstyleArchiveInput } from "@/server/validation/admin";
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
  const parsedInput = validateSubstyleArchiveInput({
    slug: formData.get("slug")?.toString() ?? "",
  });
  const redirectPath = safeAdminRedirectPath(formData.get("redirectTo"), "/admin/substyles");

  if (!parsedInput.ok) {
    return mutationErrorResponse(request, redirectPath, {
      formError: parsedInput.formError,
      fieldErrors: parsedInput.fieldErrors,
      status: 422,
    });
  }

  const result = await archiveAdminSubstyleBySlug({
    slug: parsedInput.data.slug,
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
