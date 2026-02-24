import { NextRequest, NextResponse } from "next/server";
import { sessionCookieOptions, SESSION_COOKIE_NAME } from "@/server/auth/session";
import { validateSameOrigin } from "@/server/security/csrf";

export async function POST(request: NextRequest) {
  const sameOrigin = validateSameOrigin(request);
  if (!sameOrigin.ok) {
    return NextResponse.json(
      { ok: false, message: sameOrigin.message },
      { status: 403 },
    );
  }

  const redirectUrl = new URL("/auth/login", request.url);
  const response = NextResponse.redirect(redirectUrl, { status: 303 });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });

  return response;
}
