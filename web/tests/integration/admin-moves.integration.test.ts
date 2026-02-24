import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { db } from "../../src/lib/db";
import {
  createAdminMove,
  getAdminMoveReview,
  linkCitationToMoveBySlug,
  listAdminMoves,
  setAdminMoveStatusBySlug,
} from "../../src/server/db/admin-moves";

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
const placeholderSlug = `it-placeholder-${runId}`;
const publishSlug = `it-publish-${runId}`;
const createdSlugs = [placeholderSlug, publishSlug];
const createdCitationTitle = `Integration Citation ${runId}`;

before(async () => {
  loadEnvFile();
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required for integration tests.");
  await db.$queryRaw`SELECT 1`;
});

after(async () => {
  const moves = await db.move.findMany({
    where: {
      slug: {
        in: createdSlugs,
      },
    },
    select: {
      id: true,
    },
  });
  const moveIds = moves.map((move) => move.id);
  if (moveIds.length > 0) {
    await db.citationLink.deleteMany({
      where: {
        entityType: "move",
        entityId: {
          in: moveIds,
        },
      },
    });
    await db.mediaLink.deleteMany({
      where: {
        entityType: "move",
        entityId: {
          in: moveIds,
        },
      },
    });
  }
  await db.move.deleteMany({
    where: {
      slug: {
        in: createdSlugs,
      },
    },
  });
  await db.citation.deleteMany({
    where: {
      title: createdCitationTitle,
    },
  });
  await db.$disconnect();
});

describe("admin move repositories (integration)", () => {
  test("blocks ready transition when content contains placeholder", async () => {
    const created = await createAdminMove({
      slug: placeholderSlug,
      name: `Placeholder Move ${runId}`,
      summary: "PLACEHOLDER contenido pendiente de validacion.",
      moveType: "Groove",
      difficulty: "beginner",
      actorRole: "ADMIN",
    });

    assert.equal(created.ok, true);

    const moveToReady = await setAdminMoveStatusBySlug({
      slug: placeholderSlug,
      targetStatus: "ready",
      actorRole: "ADMIN",
    });

    assert.equal(moveToReady.ok, false);
    assert.match(moveToReady.message, /PLACEHOLDER/i);
  });

  test("blocks publish without citation and allows publish after linking citation", async () => {
    const created = await createAdminMove({
      slug: publishSlug,
      name: `Publish Move ${runId}`,
      summary: "Secuencia tecnica validada para pruebas de publicacion.",
      moveType: "Footwork",
      difficulty: "intermediate",
      actorRole: "ADMIN",
    });

    assert.equal(created.ok, true);

    const moveToReady = await setAdminMoveStatusBySlug({
      slug: publishSlug,
      targetStatus: "ready",
      actorRole: "ADMIN",
    });
    assert.equal(moveToReady.ok, true);

    const publishWithoutCitation = await setAdminMoveStatusBySlug({
      slug: publishSlug,
      targetStatus: "published",
      actorRole: "ADMIN",
    });
    assert.equal(publishWithoutCitation.ok, false);
    assert.match(publishWithoutCitation.message, /citation/i);

    const citation = await linkCitationToMoveBySlug({
      slug: publishSlug,
      title: createdCitationTitle,
      url: `https://example.org/integration-${runId}`,
      author: "QA Bot",
      year: "2026",
      actorRole: "ADMIN",
    });
    assert.equal(citation.ok, true);

    const publishWithCitation = await setAdminMoveStatusBySlug({
      slug: publishSlug,
      targetStatus: "published",
      actorRole: "ADMIN",
    });
    assert.equal(publishWithCitation.ok, true);

    const review = await getAdminMoveReview(publishSlug);
    assert.ok(review);
    assert.equal(review.move.status, "published");
    assert.equal(review.checklist.hasCitation, true);
    assert.equal(review.canPublish, false);
  });

  test("lists admin rows with citation counts and search filters", async () => {
    const rows = await listAdminMoves({
      status: "all",
      sort: "updated",
      query: publishSlug,
    });

    assert.ok(rows.length >= 1);
    const row = rows.find((item) => item.slug === publishSlug);
    assert.ok(row);
    assert.equal(row.citationCount >= 1, true);
    assert.equal(row.status, "published");
  });
});
