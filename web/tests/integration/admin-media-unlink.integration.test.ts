import assert from "node:assert/strict";
import { access, mkdir, rm, writeFile } from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { NextRequest } from "next/server";
import { db } from "../../src/lib/db";
import { POST as unlinkMediaRoutePost } from "../../src/app/api/admin/media/unlink/route";
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

function buildUnlinkRequest(token: string, formData: FormData) {
  const headers = new Headers();
  headers.set("accept", "application/json");
  headers.set("origin", "http://localhost:3000");
  headers.set("cookie", `${SESSION_COOKIE_NAME}=${token}`);

  return new NextRequest("http://localhost:3000/api/admin/media/unlink", {
    method: "POST",
    headers,
    body: formData,
  });
}

const runId = Date.now().toString();
const createdMediaIds: string[] = [];
const createdFilePaths: string[] = [];
let adminToken = "";

before(async () => {
  loadEnvFile();
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required for integration tests.");
  await db.$queryRaw`SELECT 1`;

  adminToken = await createSessionToken({
    id: `admin-unlink-${runId}`,
    email: `admin-unlink-${runId}@dance.local`,
    name: "Admin Unlink",
    role: "ADMIN",
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

async function createInternalMediaFixture(input: {
  mediaPath: string;
  links: Array<{ entityType: "move" | "style"; entitySlug: string }>;
}) {
  const [moveRows, styleRows] = await Promise.all([
    db.move.findMany({
      where: {
        slug: {
          in: input.links
            .filter((item) => item.entityType === "move")
            .map((item) => item.entitySlug),
        },
      },
      select: { id: true, slug: true },
    }),
    db.style.findMany({
      where: {
        slug: {
          in: input.links
            .filter((item) => item.entityType === "style")
            .map((item) => item.entitySlug),
        },
      },
      select: { id: true, slug: true },
    }),
  ]);

  const entityIdBySlug = new Map<string, string>();
  for (const row of moveRows) {
    entityIdBySlug.set(`move:${row.slug}`, row.id);
  }
  for (const row of styleRows) {
    entityIdBySlug.set(`style:${row.slug}`, row.id);
  }

  const media = await db.media.create({
    data: {
      provider: "other",
      url: input.mediaPath,
      title: `Unlink fixture ${runId}`,
      rightsStatus: "ok_to_embed",
      durationSec: 15,
    },
  });

  for (const link of input.links) {
    const entityId = entityIdBySlug.get(`${link.entityType}:${link.entitySlug}`);
    assert.ok(entityId, `Missing fixture entity for ${link.entityType}:${link.entitySlug}`);
    await db.mediaLink.create({
      data: {
        mediaId: media.id,
        entityType: link.entityType,
        entityId,
        role: "integration",
      },
    });
  }

  const absolutePath = path.join(process.cwd(), "public", input.mediaPath.replace(/^\//, ""));
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, Buffer.from([1, 2, 3, 4]));

  createdMediaIds.push(media.id);
  createdFilePaths.push(input.mediaPath);
  return media;
}

describe("admin media unlink route cleanup (integration)", () => {
  test("removes orphan media record and file when last link is removed", async () => {
    const mediaPath = `/media/uploads/integration/unlink-single-${runId}.mp4`;
    const media = await createInternalMediaFixture({
      mediaPath,
      links: [{ entityType: "move", entitySlug: "the-shuffle" }],
    });

    const formData = new FormData();
    formData.set("entityType", "move");
    formData.set("entityRef", "the-shuffle");
    formData.set("mediaId", media.id);
    formData.set("redirectTo", "/admin/review?item=the-shuffle");

    const response = await unlinkMediaRoutePost(buildUnlinkRequest(adminToken, formData));
    assert.equal(response.status, 200);

    const body = (await response.json()) as {
      ok: boolean;
      mediaDeleted: boolean;
      deletedMediaPath: string | null;
    };
    assert.equal(body.ok, true);
    assert.equal(body.mediaDeleted, true);
    assert.equal(body.deletedMediaPath, mediaPath);

    const mediaRow = await db.media.findUnique({
      where: { id: media.id },
      select: { id: true },
    });
    assert.equal(mediaRow, null);

    const absolutePath = path.join(process.cwd(), "public", mediaPath.replace(/^\//, ""));
    await assert.rejects(() => access(absolutePath));
  });

  test("keeps media record and file when media is still linked elsewhere", async () => {
    const mediaPath = `/media/uploads/integration/unlink-shared-${runId}.mp4`;
    const media = await createInternalMediaFixture({
      mediaPath,
      links: [
        { entityType: "move", entitySlug: "the-shuffle" },
        { entityType: "style", entitySlug: "house" },
      ],
    });

    const formData = new FormData();
    formData.set("entityType", "move");
    formData.set("entityRef", "the-shuffle");
    formData.set("mediaId", media.id);
    formData.set("redirectTo", "/admin/review?item=the-shuffle");

    const response = await unlinkMediaRoutePost(buildUnlinkRequest(adminToken, formData));
    assert.equal(response.status, 200);

    const body = (await response.json()) as {
      ok: boolean;
      mediaDeleted: boolean;
      deletedMediaPath: string | null;
    };
    assert.equal(body.ok, true);
    assert.equal(body.mediaDeleted, false);
    assert.equal(body.deletedMediaPath, null);

    const mediaRow = await db.media.findUnique({
      where: { id: media.id },
      select: { id: true },
    });
    assert.ok(mediaRow);

    const styleLinkCount = await db.mediaLink.count({
      where: {
        mediaId: media.id,
        entityType: "style",
      },
    });
    assert.equal(styleLinkCount, 1);

    const absolutePath = path.join(process.cwd(), "public", mediaPath.replace(/^\//, ""));
    await access(absolutePath);
  });
});
