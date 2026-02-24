import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { hashPassword } from "@/server/auth/password";

const RESET_TOKEN_TTL_MINUTES = 60;

function getExpiryDate() {
  return new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);
}

function generateRawToken() {
  return randomBytes(32).toString("base64url");
}

function hashToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

function assertDatabaseConfigured() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required. Configure web/.env before using DB repositories.");
  }
}

export async function createPasswordResetRequest(email: string) {
  assertDatabaseConfigured();

  const normalizedEmail = email.trim().toLowerCase();
  const issuedAt = new Date();
  const expiresAt = getExpiryDate();
  const fallbackToken = generateRawToken();

  const user = await db.user.findUnique({
    where: {
      email: normalizedEmail,
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (!user) {
    return {
      issuedTokenForDebug: fallbackToken,
      expiresAt,
    };
  }

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);

  await db.$transaction(async (tx) => {
    await tx.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: issuedAt,
      },
    });

    await tx.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });
  });

  return {
    issuedTokenForDebug: rawToken,
    expiresAt,
  };
}

export async function resetPasswordWithToken(input: {
  token: string;
  newPassword: string;
}) {
  assertDatabaseConfigured();

  const token = input.token.trim();
  if (!token) {
    return {
      ok: false as const,
      message: "Token invalido o expirado.",
    };
  }

  const tokenHash = hashToken(token);
  const now = new Date();

  const resetToken = await db.passwordResetToken.findUnique({
    where: {
      tokenHash,
    },
    include: {
      user: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= now) {
    return {
      ok: false as const,
      message: "Token invalido o expirado.",
    };
  }

  const passwordHash = hashPassword(input.newPassword);

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: {
        id: resetToken.user.id,
      },
      data: {
        passwordHash,
      },
    });

    await tx.passwordResetToken.update({
      where: {
        id: resetToken.id,
      },
      data: {
        usedAt: now,
      },
    });

    await tx.passwordResetToken.updateMany({
      where: {
        userId: resetToken.user.id,
        usedAt: null,
      },
      data: {
        usedAt: now,
      },
    });
  });

  return {
    ok: true as const,
    message: "Contrasena actualizada correctamente.",
  };
}

