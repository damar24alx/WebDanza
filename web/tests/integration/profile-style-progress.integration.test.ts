import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { db } from "../../src/lib/db";
import { hashPassword } from "../../src/server/auth/password";
import { getUserStyleProgressSummary } from "../../src/server/db/profile";

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
const styleSlug = `style-progress-${runId}`;
const courseSlugA = `style-progress-a-${runId}`;
const courseSlugB = `style-progress-b-${runId}`;
const userEmail = `style-progress-${runId}@dance.local`;

let styleId = "";
let courseIdA = "";
let courseIdB = "";
let userId = "";

before(async () => {
  loadEnvFile();
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required for integration tests.");
  await db.$queryRaw`SELECT 1`;

  const style = await db.style.create({
    data: {
      slug: styleSlug,
      name: "Style Progress Integration",
      summary: "Synthetic style for progress integration tests.",
      categoryPrimary: "street",
      level: "beginner",
      movementPrinciples: ["timing"],
      publishedStatus: "published",
      isArchived: false,
    },
    select: {
      id: true,
    },
  });
  styleId = style.id;

  const [courseA, courseB] = await Promise.all([
    db.course.create({
      data: {
        slug: courseSlugA,
        title: "Style Progress Course A",
        summary: "Synthetic course A",
        targetLevel: "beginner",
        styleId,
        publishedStatus: "published",
      },
      select: {
        id: true,
      },
    }),
    db.course.create({
      data: {
        slug: courseSlugB,
        title: "Style Progress Course B",
        summary: "Synthetic course B",
        targetLevel: "beginner",
        styleId,
        publishedStatus: "published",
      },
      select: {
        id: true,
      },
    }),
  ]);
  courseIdA = courseA.id;
  courseIdB = courseB.id;

  const user = await db.user.create({
    data: {
      email: userEmail,
      name: "Style Progress User",
      role: "STUDENT",
      passwordHash: hashPassword("DancePass123"),
    },
    select: {
      id: true,
    },
  });
  userId = user.id;
});

after(async () => {
  if (userId) {
    await db.userProgress.deleteMany({
      where: {
        userId,
      },
    });
    await db.user.deleteMany({
      where: {
        id: userId,
      },
    });
  }
  if (courseIdA || courseIdB) {
    await db.course.deleteMany({
      where: {
        id: {
          in: [courseIdA, courseIdB].filter(Boolean),
        },
      },
    });
  }
  if (styleId) {
    await db.style.deleteMany({
      where: {
        id: styleId,
      },
    });
  }
  await db.$disconnect();
});

describe("profile style progress summary (integration)", () => {
  test("aggregates progress by style using course progresses", async () => {
    await db.userProgress.createMany({
      data: [
        {
          userId,
          courseId: courseIdA,
          status: "in_progress",
          percent: 50,
          startedAt: new Date(Date.now() - 10_000),
        },
        {
          userId,
          courseId: courseIdB,
          status: "completed",
          percent: 100,
          startedAt: new Date(Date.now() - 20_000),
          completedAt: new Date(Date.now() - 5_000),
        },
      ],
    });

    const rows = await getUserStyleProgressSummary(userId);
    const styleRow = rows.find((row) => row.styleSlug === styleSlug);

    assert.ok(styleRow, "Expected synthetic style row in summary.");
    assert.equal(styleRow?.coursesTotal, 2);
    assert.equal(styleRow?.coursesStarted, 2);
    assert.equal(styleRow?.coursesCompleted, 1);
    assert.equal(styleRow?.progressPercent, 75);
  });
});

