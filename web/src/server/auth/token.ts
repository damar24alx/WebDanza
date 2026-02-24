import { UserRole } from "@prisma/client";
import { JWTPayload, SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "dance_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

type SessionTokenPayload = JWTPayload & {
  sub: string;
  role: UserRole;
  email: string;
  name: string;
};

export type SessionUser = {
  id: string;
  role: UserRole;
  email: string;
  name: string;
};

function getAuthSecret() {
  const configured = process.env.AUTH_SECRET?.trim();
  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required in production.");
  }

  return "dev-insecure-auth-secret-change-me";
}

function getSecretKey() {
  return new TextEncoder().encode(getAuthSecret());
}

export async function createSessionToken(input: SessionUser) {
  const token = await new SignJWT({
    role: input.role,
    email: input.email,
    name: input.name,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(input.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());

  return token;
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify<SessionTokenPayload>(token, getSecretKey(), {
      algorithms: ["HS256"],
    });

    if (!payload.sub || !payload.role || !payload.email || !payload.name) {
      return null;
    }

    if (
      payload.role !== "ADMIN" &&
      payload.role !== "EDITOR" &&
      payload.role !== "REVIEWER" &&
      payload.role !== "STUDENT"
    ) {
      return null;
    }

    return {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  };
}
