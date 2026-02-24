import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { db } from "../../src/lib/db";
import { getMvpKpisSnapshot } from "../../src/server/db/kpis";

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

describe("mvp kpis repository (integration)", () => {
  test("returns activation, retention and completion metrics", async () => {
    const snapshot = await getMvpKpisSnapshot();

    assert.equal(snapshot.windowDays, 30);
    assert.match(snapshot.asOf, /\d{4}-\d{2}-\d{2}T/);

    const metrics = [
      snapshot.activation24h,
      snapshot.retentionWeek1,
      snapshot.courseCompletion,
    ];
    for (const metric of metrics) {
      assert.ok(metric.label.length > 0);
      assert.ok(metric.description.length > 0);
      assert.ok(metric.numerator >= 0);
      assert.ok(metric.denominator >= 0);
      assert.ok(metric.valuePercent >= 0);
      assert.ok(metric.valuePercent <= 100);
      assert.ok(metric.targetPercent > 0);
    }
  });
});

