import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { db } from "../../src/lib/db";
import {
  createAdminMedia,
  createAndLinkAdminMediaToEntity,
  linkAdminMediaToEntity,
  listAdminMediaLinksByEntity,
  unlinkAdminMediaFromEntity,
} from "../../src/server/db/admin-media";

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
const videoPath = `/media/integration-${runId}.mp4`;
const drillPath = `/media/integration-${runId}-drill.mp4`;
const createdUrls = [videoPath, drillPath];

before(async () => {
  loadEnvFile();
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required for integration tests.");
  await db.$queryRaw`SELECT 1`;
});

after(async () => {
  const mediaRows = await db.media.findMany({
    where: {
      url: {
        in: createdUrls,
      },
    },
    select: {
      id: true,
    },
  });
  const mediaIds = mediaRows.map((row) => row.id);

  if (mediaIds.length > 0) {
    await db.mediaLink.deleteMany({
      where: {
        mediaId: {
          in: mediaIds,
        },
      },
    });
    await db.media.deleteMany({
      where: {
        id: {
          in: mediaIds,
        },
      },
    });
  }

  await db.$disconnect();
});

describe("admin media repositories (integration)", () => {
  test("validates internal media policy and rightsStatus", async () => {
    const invalidProviderUrl = await createAdminMedia({
      provider: "youtube",
      url: videoPath,
      title: "Broken provider/url",
      rightsStatus: "ok_to_embed",
      actorRole: "ADMIN",
    });
    assert.equal(invalidProviderUrl.ok, false);
    assert.match(invalidProviderUrl.message, /provider invalido/i);

    const invalidExternalUrl = await createAdminMedia({
      provider: "other",
      url: "https://example.org/video.mp4",
      title: "External path blocked",
      rightsStatus: "ok_to_embed",
      actorRole: "ADMIN",
    });
    assert.equal(invalidExternalUrl.ok, false);
    assert.match(invalidExternalUrl.message, /ruta interna/i);

    const invalidRightsStatus = await createAdminMedia({
      provider: "other",
      url: videoPath,
      title: "Invalid rights status",
      rightsStatus: "not_valid",
      actorRole: "ADMIN",
    });
    assert.equal(invalidRightsStatus.ok, false);
    assert.match(invalidRightsStatus.message, /rightsStatus/i);
  });

  test("enforces role permissions for create and link", async () => {
    const createAsReviewer = await createAdminMedia({
      provider: "other",
      url: videoPath,
      title: `Media ${runId}`,
      rightsStatus: "ok_to_embed",
      actorRole: "REVIEWER",
    });
    assert.equal(createAsReviewer.ok, false);
    assert.match(createAsReviewer.message, /Rol REVIEWER/i);

    const createAsAdmin = await createAdminMedia({
      provider: "other",
      url: videoPath,
      title: `Media ${runId}`,
      rightsStatus: "ok_to_embed",
      actorRole: "ADMIN",
    });
    assert.equal(createAsAdmin.ok, true);
    assert.ok(createAsAdmin.mediaId);

    const linkAsReviewer = await linkAdminMediaToEntity({
      entityType: "move",
      entityRef: "the-shuffle",
      mediaId: createAsAdmin.mediaId,
      actorRole: "REVIEWER",
    });
    assert.equal(linkAsReviewer.ok, false);
    assert.match(linkAsReviewer.message, /Rol REVIEWER/i);
  });

  test("creates, links, lists and unlinks media by entity", async () => {
    const createdAndLinked = await createAndLinkAdminMediaToEntity({
      provider: "other",
      url: drillPath,
      title: `Docs ${runId}`,
      rightsStatus: "restricted",
      entityType: "style",
      entityRef: "house",
      role: "reference",
      actorRole: "EDITOR",
    });
    assert.equal(createdAndLinked.ok, true);
    assert.ok(createdAndLinked.mediaId);

    const linkedToMove = await linkAdminMediaToEntity({
      entityType: "move",
      entityRef: "the-shuffle",
      mediaUrl: drillPath,
      role: "drill",
      actorRole: "EDITOR",
    });
    assert.equal(linkedToMove.ok, true);

    const moveMedia = await listAdminMediaLinksByEntity({
      entityType: "move",
      entityRef: "the-shuffle",
    });
    assert.ok(moveMedia.some((row) => row.url === drillPath && row.role === "drill"));

    const styleMedia = await listAdminMediaLinksByEntity({
      entityType: "style",
      entityRef: "house",
    });
    assert.ok(styleMedia.some((row) => row.url === drillPath && row.role === "reference"));

    const unlinked = await unlinkAdminMediaFromEntity({
      entityType: "move",
      entityRef: "the-shuffle",
      mediaUrl: drillPath,
      actorRole: "ADMIN",
    });
    assert.equal(unlinked.ok, true);

    const moveMediaAfter = await listAdminMediaLinksByEntity({
      entityType: "move",
      entityRef: "the-shuffle",
    });
    assert.equal(moveMediaAfter.some((row) => row.url === drillPath), false);
  });

  test("rejects invalid entity types and missing entity refs", async () => {
    const invalidEntityType = await linkAdminMediaToEntity({
      entityType: "connection",
      entityRef: "x",
      mediaUrl: videoPath,
      actorRole: "ADMIN",
    });
    assert.equal(invalidEntityType.ok, false);
    assert.match(invalidEntityType.message, /entityType invalido/i);

    const missingEntity = await linkAdminMediaToEntity({
      entityType: "course",
      entityRef: "course-does-not-exist",
      mediaUrl: videoPath,
      actorRole: "ADMIN",
    });
    assert.equal(missingEntity.ok, false);
    assert.match(missingEntity.message, /Entidad destino no encontrada/i);
  });
});
