import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { db } from "../../src/lib/db";
import { searchGlobalCatalog } from "../../src/server/db/search";

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

before(async () => {
  loadEnvFile();
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required for integration tests.");
  await db.$queryRaw`SELECT 1`;
});

after(async () => {
  await db.$disconnect();
});

describe("global search repository (integration)", () => {
  test("returns grouped results with partial matches", async () => {
    const result = await searchGlobalCatalog("hous");

    assert.equal(result.query, "hous");
    assert.ok(result.totalHits > 0);
    assert.ok(result.styles.some((entry) => entry.slug === "house"));
    assert.ok(result.courses.some((entry) => entry.slug === "house-foundations"));
  });

  test("returns lesson links pointing to course player", async () => {
    const result = await searchGlobalCatalog("rock");
    assert.ok(result.lessons.length > 0);
    const lesson = result.lessons[0];
    assert.ok(lesson);
    assert.match(lesson?.href ?? "", /^\/learn\/.+\?lesson=/);
  });

  test("empty query returns empty groups", async () => {
    const result = await searchGlobalCatalog("   ");

    assert.equal(result.query, "");
    assert.equal(result.totalHits, 0);
    assert.equal(result.styles.length, 0);
    assert.equal(result.moves.length, 0);
    assert.equal(result.courses.length, 0);
    assert.equal(result.lessons.length, 0);
  });
});
