import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/server/auth/token";

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/auth/login", request.url);
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  loginUrl.searchParams.set("next", nextPath);
  return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionToken ? await verifySessionToken(sessionToken) : null;

  if (pathname.startsWith("/api/admin")) {
    if (!session) {
      return NextResponse.json(
        { ok: false, message: "Autenticacion requerida." },
        { status: 401 },
      );
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, message: "Se requiere rol ADMIN." },
        { status: 403 },
      );
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!session) {
      return redirectToLogin(request);
    }

    if (session.role !== "ADMIN") {
      const target = new URL("/me", request.url);
      target.searchParams.set("error", "admin_only");
      return NextResponse.redirect(target);
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/me")) {
    if (!session) {
      return redirectToLogin(request);
    }

    return NextResponse.next();
  }

  if (pathname === "/auth/login" && session) {
    const target = new URL(session.role === "ADMIN" ? "/admin" : "/me", request.url);
    return NextResponse.redirect(target);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/me/:path*", "/auth/login"],
};
