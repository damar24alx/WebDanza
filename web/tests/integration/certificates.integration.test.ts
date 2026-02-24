import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { GET as verifyCertificateGet } from "../../src/app/api/certificates/verify/[code]/route";
import { db } from "../../src/lib/db";

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
const email = `integration-certificate-${runId}@dance.local`;
const courseSlug = `integration-certificate-course-${runId}`;
const certificateCode = `DA-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomBytes(4)
  .toString("hex")
  .toUpperCase()}`;
let userId = "";
let courseId = "";

before(async () => {
  loadEnvFile();
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required for integration tests.");
  await db.$queryRaw`SELECT 1`;

  const user = await db.user.create({
    data: {
      email,
      name: `Certificate Integration ${runId}`,
      role: "STUDENT",
    },
    select: {
      id: true,
    },
  });
  userId = user.id;

  const course = await db.course.create({
    data: {
      slug: courseSlug,
      title: `Certificate Course ${runId}`,
      summary: "Synthetic course for certificate verification tests.",
      targetLevel: "beginner",
      certificateEligible: true,
      publishedStatus: "published",
    },
    select: {
      id: true,
    },
  });
  courseId = course.id;

  await db.certificate.create({
    data: {
      userId,
      courseId,
      certificateCode,
      metadataJson: {
        source: "integration-test",
      },
    },
  });
});

after(async () => {
  if (courseId) {
    await db.certificate.deleteMany({
      where: {
        courseId,
      },
    });
    await db.userProgress.deleteMany({
      where: {
        courseId,
      },
    });
    await db.course.deleteMany({
      where: {
        id: courseId,
      },
    });
  }

  if (userId) {
    await db.user.deleteMany({
      where: {
        id: userId,
      },
    });
  }

  await db.$disconnect();
});

describe("certificate verification API (integration)", () => {
  test("returns certificate payload for valid code", async () => {
    const request = new NextRequest(
      `http://localhost:3000/api/certificates/verify/${encodeURIComponent(certificateCode)}`,
    );

    const response = await verifyCertificateGet(request, {
      params: Promise.resolve({ code: certificateCode }),
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      ok: boolean;
      certificate: {
        code: string;
        student: { name: string; id?: string };
        course: { title: string; id?: string };
      };
    };

    assert.equal(body.ok, true);
    assert.equal(body.certificate.code, certificateCode);
    assert.match(body.certificate.student.name, /Certificate Integration/);
    assert.match(body.certificate.course.title, /Certificate Course/);
    assert.equal(body.certificate.student.id, undefined);
    assert.equal(body.certificate.course.id, undefined);
  });

  test("returns 404 when certificate code does not exist", async () => {
    const missingCode = "DA-20260222-FFFFFFFF";
    const request = new NextRequest(
      `http://localhost:3000/api/certificates/verify/${encodeURIComponent(missingCode)}`,
    );

    const response = await verifyCertificateGet(request, {
      params: Promise.resolve({ code: missingCode }),
    });

    assert.equal(response.status, 404);
    const body = (await response.json()) as {
      ok: boolean;
      formError: string;
      fieldErrors: Record<string, string[]>;
    };

    assert.equal(body.ok, false);
    assert.match(body.formError, /Certificado no encontrado/i);
    assert.ok(body.fieldErrors.code?.[0]);
  });

  test("returns 422 for malformed codes", async () => {
    const invalidCode = "BAD CODE!";
    const request = new NextRequest(
      `http://localhost:3000/api/certificates/verify/${encodeURIComponent(invalidCode)}`,
    );

    const response = await verifyCertificateGet(request, {
      params: Promise.resolve({ code: invalidCode }),
    });

    assert.equal(response.status, 422);
    const body = (await response.json()) as {
      ok: boolean;
      fieldErrors: Record<string, string[]>;
    };

    assert.equal(body.ok, false);
    assert.ok(body.fieldErrors.code?.[0]);
  });
});
