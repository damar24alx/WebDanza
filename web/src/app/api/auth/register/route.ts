import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/server/auth/password";
import { validateSameOrigin } from "@/server/security/csrf";
import { createSessionToken, sessionCookieOptions } from "@/server/auth/session";
import { logEvent } from "@/server/observability/logger";
import { validateRegisterInput } from "@/server/validation/auth";

function withError(
  request: NextRequest,
  payload: {
    message: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    fieldErrors?: Record<string, string[]>;
  },
) {
  const url = new URL("/auth/register", request.url);
  url.searchParams.set("error", payload.message);
  if (payload.firstName) {
    url.searchParams.set("firstName", payload.firstName);
  }
  if (payload.lastName) {
    url.searchParams.set("lastName", payload.lastName);
  }
  if (payload.email) {
    url.searchParams.set("email", payload.email);
  }

  if (payload.fieldErrors?.firstName?.[0]) {
    url.searchParams.set("firstNameError", payload.fieldErrors.firstName[0]);
  }
  if (payload.fieldErrors?.lastName?.[0]) {
    url.searchParams.set("lastNameError", payload.fieldErrors.lastName[0]);
  }
  if (payload.fieldErrors?.email?.[0]) {
    url.searchParams.set("emailError", payload.fieldErrors.email[0]);
  }
  if (payload.fieldErrors?.password?.[0]) {
    url.searchParams.set("passwordError", payload.fieldErrors.password[0]);
  }
  if (payload.fieldErrors?.passwordConfirm?.[0]) {
    url.searchParams.set("passwordConfirmError", payload.fieldErrors.passwordConfirm[0]);
  }

  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: NextRequest) {
  const requestPath = request.nextUrl.pathname;
  const sameOrigin = validateSameOrigin(request);
  if (!sameOrigin.ok) {
    logEvent("warn", "auth.register.csrf_rejected", {
      path: requestPath,
    });
    return withError(request, {
      message: "Solicitud invalida.",
    });
  }

  const formData = await request.formData();
  const parsedInput = validateRegisterInput({
    firstName: formData.get("firstName")?.toString() ?? "",
    lastName: formData.get("lastName")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
    passwordConfirm: formData.get("passwordConfirm")?.toString() ?? "",
  });

  const firstName = formData.get("firstName")?.toString().trim() ?? "";
  const lastName = formData.get("lastName")?.toString().trim() ?? "";
  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";

  if (!parsedInput.ok) {
    logEvent("warn", "auth.register.validation_failed", {
      path: requestPath,
      email,
      fieldErrors: Object.keys(parsedInput.fieldErrors),
    });
    return withError(request, {
      message: parsedInput.formError,
      firstName,
      lastName,
      email,
      fieldErrors: parsedInput.fieldErrors,
    });
  }

  const existing = await db.user.findUnique({
    where: {
      email: parsedInput.data.email,
    },
    select: {
      id: true,
    },
  });
  if (existing) {
    logEvent("warn", "auth.register.duplicate_email", {
      path: requestPath,
      email: parsedInput.data.email,
    });
    return withError(request, {
      message: "Ya existe una cuenta con ese correo.",
      firstName: parsedInput.data.firstName,
      lastName: parsedInput.data.lastName,
      email: parsedInput.data.email,
    });
  }

  const fullName = `${parsedInput.data.firstName} ${parsedInput.data.lastName}`.trim();
  const user = await db.user.create({
    data: {
      name: fullName,
      email: parsedInput.data.email,
      role: "STUDENT",
      passwordHash: hashPassword(parsedInput.data.password),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  const token = await createSessionToken({
    id: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
  });

  const response = NextResponse.redirect(new URL("/me", request.url), { status: 303 });
  response.cookies.set("dance_session", token, sessionCookieOptions());

  logEvent("info", "auth.register.success", {
    path: requestPath,
    userId: user.id,
    role: user.role,
  });

  return response;
}
