import { AdminActorRole } from "@/server/admin/permissions";

export function buildAdminHref(
  pathname: string,
  _role: AdminActorRole,
  extraParams?: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  if (extraParams) {
    for (const [key, rawValue] of Object.entries(extraParams)) {
      const value = (rawValue ?? "").trim();
      if (value) {
        params.set(key, value);
      }
    }
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
