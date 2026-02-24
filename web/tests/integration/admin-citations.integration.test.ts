import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { db } from "../../src/lib/db";
import {
  linkCitationToEntityByRef,
  listCitationsByEntityRef,
} from "../../src/server/db/admin-citations";

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
const lessonCitationTitle = `Lesson Citation ${runId}`;
const courseCitationTitle = `Course Citation ${runId}`;
const connectionCitationTitle = `Connection Citation ${runId}`;

before(async () => {
  loadEnvFile();
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required for integration tests.");
  await db.$queryRaw`SELECT 1`;
});

after(async () => {
  await db.citation.deleteMany({
    where: {
      title: {
        in: [lessonCitationTitle, courseCitationTitle, connectionCitationTitle],
      },
    },
  });
  await db.$disconnect();
});

describe("admin citations repositories (integration)", () => {
  test("links citation to lesson and course by slug", async () => {
    const lessonLink = await linkCitationToEntityByRef({
      entityType: "lesson",
      entityRef: "rock-fundamentals",
      title: lessonCitationTitle,
      url: `https://example.org/lesson-${runId}`,
      actorRole: "ADMIN",
    });
    assert.equal(lessonLink.ok, true);

    const courseLink = await linkCitationToEntityByRef({
      entityType: "course",
      entityRef: "hip-hop-foundations",
      title: courseCitationTitle,
      url: `https://example.org/course-${runId}`,
      actorRole: "ADMIN",
    });
    assert.equal(courseLink.ok, true);

    const lessonCitations = await listCitationsByEntityRef({
      entityType: "lesson",
      entityRef: "rock-fundamentals",
    });
    assert.ok(lessonCitations.some((citation) => citation.title === lessonCitationTitle));

    const courseCitations = await listCitationsByEntityRef({
      entityType: "course",
      entityRef: "hip-hop-foundations",
    });
    assert.ok(courseCitations.some((citation) => citation.title === courseCitationTitle));
  });

  test("links citation to connection by id", async () => {
    const connection = await db.connection.findFirst({
      select: {
        id: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    assert.ok(connection?.id, "Se requiere al menos una connection en seed.");

    const connectionLink = await linkCitationToEntityByRef({
      entityType: "connection",
      entityRef: connection!.id,
      title: connectionCitationTitle,
      url: `https://example.org/connection-${runId}`,
      actorRole: "ADMIN",
    });

    assert.equal(connectionLink.ok, true);

    const connectionCitations = await listCitationsByEntityRef({
      entityType: "connection",
      entityRef: connection!.id,
    });
    assert.ok(
      connectionCitations.some((citation) => citation.title === connectionCitationTitle),
    );
  });

  test("rejects invalid entity types", async () => {
    const result = await linkCitationToEntityByRef({
      entityType: "move",
      entityRef: "the-shuffle",
      title: `Invalid Entity ${runId}`,
      actorRole: "ADMIN",
    });

    assert.equal(result.ok, false);
    assert.match(result.message, /entityType invalido/i);
  });

  test("rejects citations with invalid URL protocol", async () => {
    const result = await linkCitationToEntityByRef({
      entityType: "lesson",
      entityRef: "rock-fundamentals",
      title: `Invalid URL ${runId}`,
      url: "javascript:alert(1)",
      actorRole: "ADMIN",
    });

    assert.equal(result.ok, false);
    assert.match(result.message, /URL de la citation es invalida/i);
  });
});
