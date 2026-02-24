import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { db } from "../../src/lib/db";
import { hashPassword } from "../../src/server/auth/password";
import { getUserAchievementsSummary } from "../../src/server/db/achievements";

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
const createdUserIds: string[] = [];
const createdLessonIds: string[] = [];

async function createTestUser(label: string) {
  const user = await db.user.create({
    data: {
      email: `achievements-${label}-${runId}@dance.local`,
      name: `Achievements ${label}`,
      role: "STUDENT",
      passwordHash: hashPassword("DancePass123"),
    },
    select: {
      id: true,
    },
  });
  createdUserIds.push(user.id);
  return user.id;
}

before(async () => {
  loadEnvFile();
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required for integration tests.");
  await db.$queryRaw`SELECT 1`;
});

after(async () => {
  if (createdLessonIds.length > 0) {
    await db.lesson.deleteMany({
      where: {
        id: {
          in: createdLessonIds,
        },
      },
    });
  }

  if (createdUserIds.length > 0) {
    await db.user.deleteMany({
      where: {
        id: {
          in: createdUserIds,
        },
      },
    });
  }
  await db.$disconnect();
});

describe("achievements summary repository (integration)", () => {
  test("returns locked badges for a new user without activity", async () => {
    const userId = await createTestUser("empty");
    const summary = await getUserAchievementsSummary(userId);

    assert.equal(summary.totalCount, 3);
    assert.equal(summary.unlockedCount, 0);
    assert.equal(summary.currentStreakDays, 0);
    assert.equal(summary.badges.every((badge) => !badge.unlocked), true);
  });

  test("unlocks first lesson and first course badges from completed progress", async () => {
    const userId = await createTestUser("progress");
    const lesson = await db.lesson.findFirst({
      where: {
        publishedStatus: "published",
      },
      select: {
        id: true,
      },
    });
    const course = await db.course.findFirst({
      where: {
        publishedStatus: "published",
      },
      select: {
        id: true,
      },
    });

    assert.ok(lesson?.id, "Se requiere al menos una lesson publicada en seed.");
    assert.ok(course?.id, "Se requiere al menos un course publicado en seed.");

    await db.userProgress.createMany({
      data: [
        {
          userId,
          lessonId: lesson!.id,
          status: "completed",
          percent: 100,
          startedAt: new Date(Date.now() - 300_000),
          completedAt: new Date(Date.now() - 200_000),
        },
        {
          userId,
          courseId: course!.id,
          status: "completed",
          percent: 100,
          startedAt: new Date(Date.now() - 300_000),
          completedAt: new Date(Date.now() - 100_000),
        },
      ],
    });

    const summary = await getUserAchievementsSummary(userId);
    const firstLesson = summary.badges.find((badge) => badge.id === "first_lesson");
    const firstCourse = summary.badges.find((badge) => badge.id === "first_course");

    assert.ok(firstLesson?.unlocked);
    assert.ok(firstCourse?.unlocked);
    assert.equal(summary.unlockedCount >= 2, true);
  });

  test("unlocks weekly streak badge with activity in 7 distinct days", async () => {
    const userId = await createTestUser("streak");
    const lesson = await db.lesson.create({
      data: {
        slug: `achievements-streak-${runId}`,
        title: "Achievements Streak Integration Lesson",
        objective: "Synthetic lesson for streak integration tests.",
        level: "beginner",
        durationMin: 10,
        lessonType: "drill",
        publishedStatus: "published",
      },
      select: {
        id: true,
      },
    });
    createdLessonIds.push(lesson.id);

    for (let offset = 0; offset < 7; offset += 1) {
      const day = new Date();
      day.setUTCHours(12, 0, 0, 0);
      day.setUTCDate(day.getUTCDate() - offset);

      await db.userLessonStepProgress.create({
        data: {
          userId,
          lessonId: lesson!.id,
          stepIndex: offset,
          completedAt: day,
        },
      });
      await db.userLessonStepProgress.updateMany({
        where: {
          userId,
          lessonId: lesson!.id,
          stepIndex: offset,
        },
        data: {
          completedAt: day,
          updatedAt: day,
        },
      });
    }

    const summary = await getUserAchievementsSummary(userId);
    const weeklyStreak = summary.badges.find((badge) => badge.id === "weekly_streak");

    assert.ok(weeklyStreak);
    assert.equal(weeklyStreak?.unlocked, true);
    assert.equal(summary.activityDaysLast14 >= 7, true);
  });
});
