import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, SessionUser, verifySessionToken } from "@/server/auth/token";

export { createSessionToken, sessionCookieOptions, SESSION_COOKIE_NAME } from "@/server/auth/token";
export type { SessionUser } from "@/server/auth/token";

export async function getSessionFromRequest(
  request: Pick<NextRequest, "cookies">,
): Promise<SessionUser | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export async function getSessionFromCookieStore(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}
