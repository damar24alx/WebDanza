import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { db } from "../../src/lib/db";
import {
  archiveAdminStyleBySlug,
  createAdminStyle,
  createAdminSubstyle,
  linkCitationToStyleBySlug,
  listAdminStyles,
  listAdminSubstyles,
  setAdminStyleStatusBySlug,
  setAdminSubstyleStatusBySlug,
  updateAdminStyleBySlug,
} from "../../src/server/db/admin-taxonomy";

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
const styleSlug = `it-style-${runId}`;
const substyleSlug = `it-substyle-${runId}`;
const createdCitationTitle = `Integration Style Citation ${runId}`;

before(async () => {
  loadEnvFile();
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required for integration tests.");
  await db.$queryRaw`SELECT 1`;
});

after(async () => {
  const style = await db.style.findFirst({
    where: {
      slug: styleSlug,
    },
    select: {
      id: true,
    },
  });
  const substyle = await db.substyle.findFirst({
    where: {
      slug: substyleSlug,
    },
    select: {
      id: true,
    },
  });

  const entityIds = [style?.id, substyle?.id].filter((id): id is string => Boolean(id));
  if (entityIds.length > 0) {
    await db.citationLink.deleteMany({
      where: {
        OR: [
          {
            entityType: "style",
            entityId: {
              in: entityIds,
            },
          },
          {
            entityType: "substyle",
            entityId: {
              in: entityIds,
            },
          },
        ],
      },
    });
  }

  await db.substyle.deleteMany({
    where: {
      slug: substyleSlug,
    },
  });
  await db.style.deleteMany({
    where: {
      slug: styleSlug,
    },
  });
  await db.citation.deleteMany({
    where: {
      title: createdCitationTitle,
    },
  });
  await db.$disconnect();
});

describe("admin taxonomy repositories (integration)", () => {
  test("enforces role permissions and style guardrails", async () => {
    const reviewerCreate = await createAdminStyle({
      slug: `${styleSlug}-blocked`,
      name: "Blocked by Reviewer",
      summary: "Intento sin permiso.",
      categoryPrimary: "Street",
      level: "beginner",
      actorRole: "REVIEWER",
    });
    assert.equal(reviewerCreate.ok, false);
    assert.match(reviewerCreate.message, /Rol REVIEWER/i);

    const created = await createAdminStyle({
      slug: styleSlug,
      name: `Integration Style ${runId}`,
      summary: "PLACEHOLDER contenido inicial.",
      categoryPrimary: "Street",
      level: "beginner",
      historicalCulturalContext: "PLACEHOLDER contexto historico en revision.",
      movementPrinciples: "Bounce\nGroove",
      actorRole: "ADMIN",
    });
    assert.equal(created.ok, true);

    const toReadyBlocked = await setAdminStyleStatusBySlug({
      slug: styleSlug,
      targetStatus: "ready",
      actorRole: "ADMIN",
    });
    assert.equal(toReadyBlocked.ok, false);
    assert.match(toReadyBlocked.message, /PLACEHOLDER/i);

    const updated = await updateAdminStyleBySlug({
      slug: styleSlug,
      summary: "Contenido editorial validado para publish flow.",
      historicalCulturalContext: "Contexto historico-cultural con claim verificable.",
      actorRole: "EDITOR",
    });
    assert.equal(updated.ok, true);

    const toReady = await setAdminStyleStatusBySlug({
      slug: styleSlug,
      targetStatus: "ready",
      actorRole: "EDITOR",
    });
    assert.equal(toReady.ok, true);

    const publishWithoutCitation = await setAdminStyleStatusBySlug({
      slug: styleSlug,
      targetStatus: "published",
      actorRole: "ADMIN",
    });
    assert.equal(publishWithoutCitation.ok, false);
    assert.match(publishWithoutCitation.message, /citation/i);

    const linkCitation = await linkCitationToStyleBySlug({
      slug: styleSlug,
      title: createdCitationTitle,
      url: `https://example.org/style-${runId}`,
      actorRole: "REVIEWER",
    });
    assert.equal(linkCitation.ok, true);

    const publishByEditor = await setAdminStyleStatusBySlug({
      slug: styleSlug,
      targetStatus: "published",
      actorRole: "EDITOR",
    });
    assert.equal(publishByEditor.ok, false);
    assert.match(publishByEditor.message, /Rol EDITOR/i);

    const publishByAdmin = await setAdminStyleStatusBySlug({
      slug: styleSlug,
      targetStatus: "published",
      actorRole: "ADMIN",
    });
    assert.equal(publishByAdmin.ok, true);
  });

  test("creates substyle and applies status transitions", async () => {
    const createdSubstyle = await createAdminSubstyle({
      slug: substyleSlug,
      styleSlug,
      name: `Integration Substyle ${runId}`,
      summary: "Substyle con contexto listo para guardrails.",
      historicalCulturalContext: "",
      technicalFocus: "Control de peso\nRebote",
      actorRole: "EDITOR",
    });
    assert.equal(createdSubstyle.ok, true);

    const toReady = await setAdminSubstyleStatusBySlug({
      slug: substyleSlug,
      targetStatus: "ready",
      actorRole: "REVIEWER",
    });
    assert.equal(toReady.ok, true);

    const publishByReviewer = await setAdminSubstyleStatusBySlug({
      slug: substyleSlug,
      targetStatus: "published",
      actorRole: "REVIEWER",
    });
    assert.equal(publishByReviewer.ok, false);
    assert.match(publishByReviewer.message, /Rol REVIEWER/i);

    const publishByAdmin = await setAdminSubstyleStatusBySlug({
      slug: substyleSlug,
      targetStatus: "published",
      actorRole: "ADMIN",
    });
    assert.equal(publishByAdmin.ok, true);
  });

  test("archives style logically and removes taxonomy rows from active listings", async () => {
    const archiveAsEditor = await archiveAdminStyleBySlug({
      slug: styleSlug,
      actorRole: "EDITOR",
    });
    assert.equal(archiveAsEditor.ok, false);
    assert.match(archiveAsEditor.message, /Rol EDITOR/i);

    const archived = await archiveAdminStyleBySlug({
      slug: styleSlug,
      actorRole: "ADMIN",
    });
    assert.equal(archived.ok, true);

    const styles = await listAdminStyles({
      status: "all",
      sort: "updated",
      query: styleSlug,
    });
    assert.equal(styles.some((item) => item.slug === styleSlug), false);

    const substyles = await listAdminSubstyles({
      status: "all",
      sort: "updated",
      query: substyleSlug,
    });
    assert.equal(substyles.some((item) => item.slug === substyleSlug), false);
  });
});
