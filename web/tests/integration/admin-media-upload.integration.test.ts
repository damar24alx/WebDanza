import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { access, rm } from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { db } from "../../src/lib/db";
import { POST as uploadMediaRoutePost } from "../../src/app/api/admin/media/upload-link/route";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../src/server/auth/token";

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

function buildUploadRequest(token: string, formData: FormData) {
  const headers = new Headers();
  headers.set("accept", "application/json");
  headers.set("origin", "http://localhost:3000");
  headers.set("cookie", `${SESSION_COOKIE_NAME}=${token}`);

  return new NextRequest("http://localhost:3000/api/admin/media/upload-link", {
    method: "POST",
    headers,
    body: formData,
  });
}

const runId = Date.now().toString();
const createdMediaIds: string[] = [];
const createdFilePaths: string[] = [];

let adminToken = "";
let studentToken = "";

async function withTemporaryEnv(
  values: Record<string, string | undefined>,
  action: () => Promise<void>,
) {
  const previous: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    await action();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

before(async () => {
  loadEnvFile();
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required for integration tests.");
  await db.$queryRaw`SELECT 1`;

  adminToken = await createSessionToken({
    id: `admin-upload-${runId}`,
    email: `admin-upload-${runId}@dance.local`,
    name: "Admin Upload",
    role: "ADMIN",
  });
  studentToken = await createSessionToken({
    id: `student-upload-${runId}`,
    email: `student-upload-${runId}@dance.local`,
    name: "Student Upload",
    role: "STUDENT",
  });
});

after(async () => {
  if (createdMediaIds.length > 0) {
    await db.mediaLink.deleteMany({
      where: {
        mediaId: {
          in: createdMediaIds,
        },
      },
    });
    await db.media.deleteMany({
      where: {
        id: {
          in: createdMediaIds,
        },
      },
    });
  }

  for (const mediaPath of createdFilePaths) {
    const absolutePath = path.join(process.cwd(), "public", mediaPath.replace(/^\//, ""));
    await rm(absolutePath, { force: true }).catch(() => undefined);
  }

  await db.$disconnect();
});

describe("admin media upload route (integration)", () => {
  test("uploads internal media file and links it to entity", async () => {
    const formData = new FormData();
    formData.set("title", `Upload test ${runId}`);
    formData.set("rightsStatus", "ok_to_embed");
    formData.set("durationSec", "11");
    formData.set("entityType", "move");
    formData.set("entityRef", "the-shuffle");
    formData.set("role", "demo");
    formData.set("redirectTo", "/admin/review?item=the-shuffle");
    formData.set(
      "file",
      new File([new Uint8Array([0, 0, 0, 0])], `upload-${runId}.mp4`, {
        type: "video/mp4",
      }),
    );

    const response = await uploadMediaRoutePost(buildUploadRequest(adminToken, formData));
    assert.equal(response.status, 200);

    const body = (await response.json()) as {
      ok: boolean;
      mediaId?: string;
      filePath?: string;
    };

    assert.equal(body.ok, true);
    assert.ok(body.mediaId);
    assert.ok(body.filePath);
    assert.equal(body.filePath?.startsWith("/media/uploads/"), true);

    const mediaRow = await db.media.findUnique({
      where: {
        id: body.mediaId ?? "",
      },
      select: {
        id: true,
        provider: true,
        url: true,
      },
    });
    assert.ok(mediaRow);
    assert.equal(mediaRow?.provider, "other");
    assert.equal(mediaRow?.url, body.filePath);

    const linked = await db.mediaLink.findFirst({
      where: {
        mediaId: body.mediaId,
        entityType: "move",
      },
      select: {
        id: true,
      },
    });
    assert.ok(linked);

    const absolutePath = path.join(
      process.cwd(),
      "public",
      (body.filePath ?? "").replace(/^\//, ""),
    );
    await access(absolutePath);

    if (body.mediaId) {
      createdMediaIds.push(body.mediaId);
    }
    if (body.filePath) {
      createdFilePaths.push(body.filePath);
    }
  });

  test("rejects files with invalid extension", async () => {
    const formData = new FormData();
    formData.set("title", `Upload invalid ${runId}`);
    formData.set("rightsStatus", "ok_to_embed");
    formData.set("entityType", "move");
    formData.set("entityRef", "the-shuffle");
    formData.set("redirectTo", "/admin/review?item=the-shuffle");
    formData.set(
      "file",
      new File([new Uint8Array([1, 2, 3])], `upload-${runId}.txt`, {
        type: "text/plain",
      }),
    );

    const response = await uploadMediaRoutePost(buildUploadRequest(adminToken, formData));
    assert.equal(response.status, 422);

    const body = (await response.json()) as {
      ok: boolean;
      fieldErrors: Record<string, string[]>;
    };

    assert.equal(body.ok, false);
    assert.ok(body.fieldErrors.file?.[0]);
  });

  test("falls back to local storage when cloud driver is enabled without credentials", async () => {
    await withTemporaryEnv(
      {
        MEDIA_STORAGE_DRIVER: "cloud",
        MEDIA_CLOUD_ENDPOINT: undefined,
        MEDIA_CLOUD_BUCKET: undefined,
        MEDIA_CLOUD_REGION: undefined,
        MEDIA_CLOUD_ACCESS_KEY_ID: undefined,
        MEDIA_CLOUD_SECRET_ACCESS_KEY: undefined,
      },
      async () => {
        const formData = new FormData();
        formData.set("title", `Upload cloud fallback ${runId}`);
        formData.set("rightsStatus", "ok_to_embed");
        formData.set("durationSec", "9");
        formData.set("entityType", "move");
        formData.set("entityRef", "the-shuffle");
        formData.set("redirectTo", "/admin/review?item=the-shuffle");
        formData.set(
          "file",
          new File([new Uint8Array([5, 5, 5, 5])], `upload-cloud-fallback-${runId}.mp4`, {
            type: "video/mp4",
          }),
        );

        const response = await uploadMediaRoutePost(buildUploadRequest(adminToken, formData));
        assert.equal(response.status, 200);

        const body = (await response.json()) as {
          ok: boolean;
          mediaId?: string;
          filePath?: string;
        };

        assert.equal(body.ok, true);
        assert.ok(body.filePath?.startsWith("/media/uploads/"));

        const absolutePath = path.join(
          process.cwd(),
          "public",
          (body.filePath ?? "").replace(/^\//, ""),
        );
        await access(absolutePath);

        if (body.mediaId) {
          createdMediaIds.push(body.mediaId);
        }
        if (body.filePath) {
          createdFilePaths.push(body.filePath);
        }
      },
    );
  });

  test("requires ADMIN role", async () => {
    const formData = new FormData();
    formData.set("title", `Upload student ${runId}`);
    formData.set("rightsStatus", "ok_to_embed");
    formData.set("entityType", "move");
    formData.set("entityRef", "the-shuffle");
    formData.set("redirectTo", "/admin/review?item=the-shuffle");
    formData.set(
      "file",
      new File([new Uint8Array([0])], `upload-${runId}.mp4`, {
        type: "video/mp4",
      }),
    );

    const response = await uploadMediaRoutePost(buildUploadRequest(studentToken, formData));
    assert.equal(response.status, 403);
  });
});
