import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { POST as reissueCertificateRoutePost } from "../../src/app/api/admin/certificates/reissue/route";
import { POST as revokeCertificateRoutePost } from "../../src/app/api/admin/certificates/revoke/route";
import { db } from "../../src/lib/db";
import { hashPassword } from "../../src/server/auth/password";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../src/server/auth/token";
import {
  reissueCertificateByCode,
  revokeCertificateByCode,
} from "../../src/server/db/admin-certificates";
import { GET as verifyCertificateGet } from "../../src/app/api/certificates/verify/[code]/route";

function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const runId = Date.now().toString();
const adminEmail = `admin-certs-${runId}@dance.local`;
const studentEmail = `student-certs-${runId}@dance.local`;
const courseSlug = `course-certs-${runId}`;
const initialCode = `DA-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-A1${runId.slice(-6).toUpperCase()}`;

let adminId = "";
let studentId = "";
let courseId = "";
let certificateId = "";
let adminToken = "";
let studentToken = "";

function buildAdminFormRequest(
  pathname: string,
  token: string,
  bodyValues: Record<string, string>,
) {
  const headers = new Headers();
  headers.set("content-type", "application/x-www-form-urlencoded");
  headers.set("accept", "application/json");
  headers.set("origin", "http://localhost:3000");
  headers.set("cookie", `${SESSION_COOKIE_NAME}=${token}`);
  const body = new URLSearchParams(bodyValues);

  return new NextRequest(`http://localhost:3000${pathname}`, {
    method: "POST",
    headers,
    body: body.toString(),
  });
}

before(async () => {
  loadEnvFile();
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required for integration tests.");
  await db.$queryRaw`SELECT 1`;

  const [admin, student] = await Promise.all([
    db.user.create({
      data: {
        email: adminEmail,
        name: "Admin Certs",
        role: "ADMIN",
        passwordHash: hashPassword("Admin123!"),
      },
      select: {
        id: true,
      },
    }),
    db.user.create({
      data: {
        email: studentEmail,
        name: "Student Certs",
        role: "STUDENT",
        passwordHash: hashPassword("Student123!"),
      },
      select: {
        id: true,
      },
    }),
  ]);
  adminId = admin.id;
  studentId = student.id;
  adminToken = await createSessionToken({
    id: adminId,
    email: adminEmail,
    name: "Admin Certs",
    role: "ADMIN",
  });
  studentToken = await createSessionToken({
    id: studentId,
    email: studentEmail,
    name: "Student Certs",
    role: "STUDENT",
  });

  const course = await db.course.create({
    data: {
      slug: courseSlug,
      title: "Course Certs Integration",
      summary: "Synthetic course for admin certificate actions.",
      targetLevel: "beginner",
      certificateEligible: true,
      publishedStatus: "published",
    },
    select: {
      id: true,
    },
  });
  courseId = course.id;

  const certificate = await db.certificate.create({
    data: {
      userId: studentId,
      courseId,
      status: "active",
      certificateCode: initialCode,
    },
    select: {
      id: true,
    },
  });
  certificateId = certificate.id;
});

after(async () => {
  if (certificateId) {
    await db.certificateEvent.deleteMany({
      where: {
        certificateId,
      },
    });
    await db.certificate.deleteMany({
      where: {
        id: certificateId,
      },
    });
  }
  if (courseId) {
    await db.course.deleteMany({
      where: {
        id: courseId,
      },
    });
  }
  if (adminId || studentId) {
    await db.user.deleteMany({
      where: {
        id: {
          in: [adminId, studentId].filter(Boolean),
        },
      },
    });
  }
  await db.$disconnect();
});

describe("admin certificate repository (integration)", () => {
  test("revokes and reissues certificate while verification reflects status", async () => {
    const revokeResult = await revokeCertificateByCode({
      code: initialCode,
      reason: "Incidencia de auditoria",
      actorRole: "ADMIN",
      actorUserId: adminId,
    });
    assert.equal(revokeResult.ok, true);

    const revokedRow = await db.certificate.findUnique({
      where: {
        id: certificateId,
      },
      select: {
        status: true,
        revokedAt: true,
      },
    });
    assert.equal(revokedRow?.status, "revoked");
    assert.ok(revokedRow?.revokedAt);

    const revokedVerifyResponse = await verifyCertificateGet(
      new NextRequest(
        `http://localhost:3000/api/certificates/verify/${encodeURIComponent(initialCode)}`,
      ),
      {
        params: Promise.resolve({ code: initialCode }),
      },
    );
    assert.equal(revokedVerifyResponse.status, 404);

    const reissueResult = await reissueCertificateByCode({
      code: initialCode,
      reason: "Reemision por correccion administrativa",
      actorRole: "ADMIN",
      actorUserId: adminId,
    });
    assert.equal(reissueResult.ok, true);
    assert.ok(reissueResult.nextCode);

    const currentRow = await db.certificate.findUnique({
      where: {
        id: certificateId,
      },
      select: {
        certificateCode: true,
        status: true,
        revokedAt: true,
        revokedReason: true,
      },
    });
    assert.equal(currentRow?.status, "active");
    assert.equal(currentRow?.revokedAt, null);
    assert.equal(currentRow?.revokedReason, null);
    assert.equal(currentRow?.certificateCode, reissueResult.nextCode);

    const oldCodeResponse = await verifyCertificateGet(
      new NextRequest(
        `http://localhost:3000/api/certificates/verify/${encodeURIComponent(initialCode)}`,
      ),
      {
        params: Promise.resolve({ code: initialCode }),
      },
    );
    assert.equal(oldCodeResponse.status, 404);

    const newCodeResponse = await verifyCertificateGet(
      new NextRequest(
        `http://localhost:3000/api/certificates/verify/${encodeURIComponent(reissueResult.nextCode ?? "")}`,
      ),
      {
        params: Promise.resolve({ code: reissueResult.nextCode ?? "" }),
      },
    );
    assert.equal(newCodeResponse.status, 200);

    const events = await db.certificateEvent.findMany({
      where: {
        certificateId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    assert.equal(events.some((event) => event.eventType === "revoked"), true);
    assert.equal(events.some((event) => event.eventType === "reissued"), true);
  });

  test("admin certificate API routes enforce ADMIN role", async () => {
    const request = buildAdminFormRequest(
      "/api/admin/certificates/revoke",
      studentToken,
      {
        code: initialCode,
      },
    );

    const response = await revokeCertificateRoutePost(request);
    assert.equal(response.status, 403);
  });

  test("admin certificate API routes revoke and reissue certificates", async () => {
    const freshCode = `DA-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomBytes(4)
      .toString("hex")
      .toUpperCase()}`;
    await db.certificate.update({
      where: {
        id: certificateId,
      },
      data: {
        certificateCode: freshCode,
        status: "active",
        revokedAt: null,
        revokedReason: null,
      },
    });

    const revokeResponse = await revokeCertificateRoutePost(
      buildAdminFormRequest(
        "/api/admin/certificates/revoke",
        adminToken,
        {
          code: freshCode,
          reason: "Revocacion por inconsistencia operativa",
        },
      ),
    );
    assert.equal(revokeResponse.status, 200);
    const revokeBody = (await revokeResponse.json()) as {
      ok: boolean;
      message: string;
    };
    assert.equal(revokeBody.ok, true);

    const reissueResponse = await reissueCertificateRoutePost(
      buildAdminFormRequest(
        "/api/admin/certificates/reissue",
        adminToken,
        {
          code: freshCode,
          reason: "Reemision aprobada por soporte",
        },
      ),
    );
    assert.equal(reissueResponse.status, 200);
    const reissueBody = (await reissueResponse.json()) as {
      ok: boolean;
      nextCode?: string;
    };
    assert.equal(reissueBody.ok, true);
    assert.ok(reissueBody.nextCode);

    const certificate = await db.certificate.findUnique({
      where: {
        id: certificateId,
      },
      select: {
        status: true,
        revokedAt: true,
        certificateCode: true,
      },
    });

    assert.equal(certificate?.status, "active");
    assert.equal(certificate?.revokedAt, null);
    assert.equal(certificate?.certificateCode, reissueBody.nextCode);
  });
});
