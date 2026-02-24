import { NextRequest } from "next/server";

export function wantsJsonResponse(request: NextRequest) {
  const accept = request.headers.get("accept")?.toLowerCase() ?? "";
  if (accept.includes("application/json")) {
    return true;
  }

  const requested = request.headers.get("x-response-format")?.toLowerCase() ?? "";
  return requested === "json";
}

