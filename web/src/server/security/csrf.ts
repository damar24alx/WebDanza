import { NextRequest } from "next/server";

type SameOriginResult =
  | { ok: true }
  | { ok: false; message: string };

function parseOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function validateSameOrigin(request: NextRequest): SameOriginResult {
  const expectedOrigin = request.nextUrl.origin;
  const originHeader = request.headers.get("origin");
  const refererHeader = request.headers.get("referer");

  if (!originHeader && !refererHeader) {
    // Some non-browser and test flows omit these headers.
    return { ok: true };
  }

  if (originHeader) {
    const origin = parseOrigin(originHeader);
    if (!origin || origin !== expectedOrigin) {
      return {
        ok: false,
        message: "Invalid request origin.",
      };
    }
  }

  if (refererHeader) {
    const refererOrigin = parseOrigin(refererHeader);
    if (!refererOrigin || refererOrigin !== expectedOrigin) {
      return {
        ok: false,
        message: "Invalid request referer.",
      };
    }
  }

  return { ok: true };
}

