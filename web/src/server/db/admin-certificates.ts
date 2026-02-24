import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { AdminActorRole, parseAdminActorRole } from "@/server/admin/permissions";

export type AdminCertificateRow = {
  id: string;
  code: string;
  status: "active" | "revoked";
  issuedAt: Date;
  revokedAt: Date | null;
  revokedReason: string | null;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
};

export type AdminCertificateMutationResult = {
  ok: boolean;
  message: string;
  code?: string;
  nextCode?: string;
};

function assertDatabaseConfigured() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for admin certificate operations.");
  }
}

function normalizeCode(value: string) {
  return value.trim().toUpperCase();
}

function requireAdminRole(roleInput: unknown) {
  const role = parseAdminActorRole(roleInput);
  if (role !== "ADMIN") {
    return {
      ok: false as const,
      result: {
        ok: false,
        message: "Se requiere rol ADMIN para gestionar certificados.",
      } satisfies AdminCertificateMutationResult,
    };
  }

  return {
    ok: true as const,
    role,
  };
}

function generateCertificateCode() {
  const dateSegment = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const randomSegment = randomBytes(4).toString("hex").toUpperCase();
  return `DA-${dateSegment}-${randomSegment}`;
}

async function findCertificateByCodeCaseInsensitive(code: string) {
  return db.certificate.findFirst({
    where: {
      certificateCode: {
        equals: code,
        mode: "insensitive",
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      course: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
}

export async function listAdminCertificates(query?: string): Promise<AdminCertificateRow[]> {
  assertDatabaseConfigured();
  const search = (query ?? "").trim();
  const where: Prisma.CertificateWhereInput = search
    ? {
        OR: [
          {
            certificateCode: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            user: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
          {
            user: {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
          {
            course: {
              title: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        ],
      }
    : {};

  const rows = await db.certificate.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      course: {
        select: {
          title: true,
        },
      },
    },
    orderBy: {
      issuedAt: "desc",
    },
    take: 120,
  });

  return rows.map((row) => ({
    id: row.id,
    code: row.certificateCode,
    status: row.status,
    issuedAt: row.issuedAt,
    revokedAt: row.revokedAt,
    revokedReason: row.revokedReason,
    studentName: row.user.name,
    studentEmail: row.user.email,
    courseTitle: row.course.title,
  }));
}

export async function revokeCertificateByCode(input: {
  code: string;
  reason?: string;
  actorRole?: AdminActorRole | string;
  actorUserId?: string;
}): Promise<AdminCertificateMutationResult> {
  assertDatabaseConfigured();
  const permission = requireAdminRole(input.actorRole);
  if (!permission.ok) {
    return permission.result;
  }

  const code = normalizeCode(input.code);
  if (!code) {
    return {
      ok: false,
      message: "code es obligatorio.",
    };
  }

  const certificate = await findCertificateByCodeCaseInsensitive(code);
  if (!certificate) {
    return {
      ok: false,
      message: "Certificado no encontrado.",
    };
  }

  if (certificate.status === "revoked") {
    return {
      ok: false,
      message: "El certificado ya se encuentra revocado.",
      code: certificate.certificateCode,
    };
  }

  const now = new Date();
  await db.$transaction(async (tx) => {
    await tx.certificate.update({
      where: {
        id: certificate.id,
      },
      data: {
        status: "revoked",
        revokedAt: now,
        revokedReason: (input.reason ?? "").trim() || null,
      },
    });

    await tx.certificateEvent.create({
      data: {
        certificateId: certificate.id,
        actorUserId: input.actorUserId || null,
        actorRole: permission.role,
        eventType: "revoked",
        previousCode: certificate.certificateCode,
        reason: (input.reason ?? "").trim() || "Revocacion manual por admin.",
      },
    });
  });

  return {
    ok: true,
    message: `Certificado ${certificate.certificateCode} revocado.`,
    code: certificate.certificateCode,
  };
}

export async function reissueCertificateByCode(input: {
  code: string;
  reason?: string;
  actorRole?: AdminActorRole | string;
  actorUserId?: string;
}): Promise<AdminCertificateMutationResult> {
  assertDatabaseConfigured();
  const permission = requireAdminRole(input.actorRole);
  if (!permission.ok) {
    return permission.result;
  }

  const code = normalizeCode(input.code);
  if (!code) {
    return {
      ok: false,
      message: "code es obligatorio.",
    };
  }

  const certificate = await findCertificateByCodeCaseInsensitive(code);
  if (!certificate) {
    return {
      ok: false,
      message: "Certificado no encontrado.",
    };
  }

  const previousCode = certificate.certificateCode;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const nextCode = generateCertificateCode();
    if (nextCode === previousCode) {
      continue;
    }

    try {
      await db.$transaction(async (tx) => {
        await tx.certificate.update({
          where: {
            id: certificate.id,
          },
          data: {
            certificateCode: nextCode,
            issuedAt: new Date(),
            status: "active",
            revokedAt: null,
            revokedReason: null,
          },
        });

        await tx.certificateEvent.create({
          data: {
            certificateId: certificate.id,
            actorUserId: input.actorUserId || null,
            actorRole: permission.role,
            eventType: "reissued",
            previousCode,
            nextCode,
            reason: (input.reason ?? "").trim() || "Reemision manual por admin.",
          },
        });
      });

      return {
        ok: true,
        message: "Certificado reemitido correctamente.",
        code: previousCode,
        nextCode,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }
      throw error;
    }
  }

  return {
    ok: false,
    message: "No se pudo generar un nuevo codigo unico para el certificado.",
    code: previousCode,
  };
}

