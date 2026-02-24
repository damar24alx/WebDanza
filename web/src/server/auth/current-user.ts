import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { getSessionFromCookieStore } from "@/server/auth/session";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await getSessionFromCookieStore();
  if (!session) {
    return null;
  }

  const user = await db.user.findUnique({
    where: {
      id: session.id,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!user) {
    return null;
  }

  return user;
}

export async function requireAuthenticatedUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  return user;
}

export async function requireAdminUser() {
  const user = await requireAuthenticatedUser();
  if (user.role !== "ADMIN") {
    redirect("/me");
  }

  return user;
}
