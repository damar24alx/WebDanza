import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { db } from "../../src/lib/db";
import { getCourseDetailBySlug } from "../../src/server/db/catalog";
import {
  completeLessonByCourseAndLessonSlug,
  setLessonStepProgress,
} from "../../src/server/db/progress";
import { getUserDashboardSummary } from "../../src/server/db/profile";

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
const email = `integration-progress-${runId}@dance.local`;
let userId = "";

before(async () => {
  loadEnvFile();
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required for integration tests.");
  await db.$queryRaw`SELECT 1`;

  const user = await db.user.create({
    data: {
      email,
      name: `Integration Progress ${runId}`,
      role: "STUDENT",
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
    await db.certificate.deleteMany({
      where: {
        userId,
      },
    });
    await db.user.delete({
      where: {
        id: userId,
      },
    });
  }
  await db.$disconnect();
});

describe("progress repositories (integration)", () => {
  test("marks lesson complete and updates active course", async () => {
    const result = await completeLessonByCourseAndLessonSlug({
      userId,
      courseSlug: "hip-hop-foundations",
      lessonSlug: "rock-fundamentals",
    });

    assert.equal(result.ok, true);
    assert.equal(result.courseSlug, "hip-hop-foundations");
    assert.equal(result.lessonSlug, "rock-fundamentals");
    assert.equal(result.status, "in_progress");
    assert.ok((result.percent ?? 0) > 0);

    const summary = await getUserDashboardSummary(userId);
    assert.equal(summary.activeCourseSlug, "hip-hop-foundations");
  });

  test("completes all lessons and sets course progress to 100", async () => {
    await completeLessonByCourseAndLessonSlug({
      userId,
      courseSlug: "hip-hop-foundations",
      lessonSlug: "party-groove-combos",
    });

    const result = await completeLessonByCourseAndLessonSlug({
      userId,
      courseSlug: "hip-hop-foundations",
      lessonSlug: "freestyle-framework",
    });

    assert.equal(result.ok, true);
    assert.equal(result.status, "completed");
    assert.equal(result.percent, 100);
    assert.equal(result.nextLessonSlug, null);
    assert.equal(result.certificateIssued, true);
    assert.ok(result.certificateCode);

    const repeatResult = await completeLessonByCourseAndLessonSlug({
      userId,
      courseSlug: "hip-hop-foundations",
      lessonSlug: "freestyle-framework",
    });
    assert.equal(repeatResult.ok, true);
    assert.equal(repeatResult.status, "completed");
    assert.equal(repeatResult.certificateIssued, false);
    assert.equal(repeatResult.certificateCode, result.certificateCode);

    const row = await db.userProgress.findFirst({
      where: {
        userId,
        course: {
          slug: "hip-hop-foundations",
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    assert.ok(row);
    assert.equal(row?.status, "completed");
    assert.equal(row?.percent, 100);

    const certificates = await db.certificate.findMany({
      where: {
        userId,
        course: {
          slug: "hip-hop-foundations",
        },
      },
    });
    assert.equal(certificates.length, 1);
    assert.equal(certificates[0]?.certificateCode, result.certificateCode);
  });

  test("supports percent_90 completion rule and issues certificate once", async () => {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 1000)}`;
    const courseSlug = `it-percent-90-course-${suffix}`;
    const lessonSlugs = Array.from({ length: 10 }).map((_, index) => `it-percent-90-lesson-${index + 1}-${suffix}`);

    const createdCourse = await db.course.create({
      data: {
        slug: courseSlug,
        title: `Percent 90 Course ${suffix}`,
        summary: "Synthetic course to validate percent_90 completion rule.",
        targetLevel: "beginner",
        completionRule: "percent_90",
        certificateEligible: true,
        publishedStatus: "published",
      },
    });

    const lessons = await Promise.all(
      lessonSlugs.map((lessonSlug, index) =>
        db.lesson.create({
          data: {
            slug: lessonSlug,
            title: `Percent 90 Lesson ${index + 1}`,
            objective: "Integration validation.",
            level: "beginner",
            durationMin: 5,
            publishedStatus: "published",
          },
        }),
      ),
    );

    await Promise.all(
      lessons.map((lesson, index) =>
        db.courseLesson.create({
          data: {
            courseId: createdCourse.id,
            lessonId: lesson.id,
            orderIndex: index + 1,
            gateStatus: "done",
          },
        }),
      ),
    );

    try {
      let result = await completeLessonByCourseAndLessonSlug({
        userId,
        courseSlug,
        lessonSlug: lessonSlugs[0] ?? "",
      });

      for (let index = 1; index < 9; index += 1) {
        result = await completeLessonByCourseAndLessonSlug({
          userId,
          courseSlug,
          lessonSlug: lessonSlugs[index] ?? "",
        });
      }

      assert.equal(result.ok, true);
      assert.equal(result.status, "completed");
      assert.equal(result.percent, 90);
      assert.equal(result.certificateIssued, true);
      assert.ok(result.certificateCode);

      const finalResult = await completeLessonByCourseAndLessonSlug({
        userId,
        courseSlug,
        lessonSlug: lessonSlugs[9] ?? "",
      });
      assert.equal(finalResult.ok, true);
      assert.equal(finalResult.status, "completed");
      assert.equal(finalResult.percent, 100);
      assert.equal(finalResult.certificateIssued, false);
      assert.equal(finalResult.certificateCode, result.certificateCode);

      const progressRow = await db.userProgress.findFirst({
        where: {
          userId,
          courseId: createdCourse.id,
        },
      });
      assert.ok(progressRow);
      assert.equal(progressRow?.status, "completed");
      assert.equal(progressRow?.percent, 100);

      const certificates = await db.certificate.findMany({
        where: {
          userId,
          courseId: createdCourse.id,
        },
      });
      assert.equal(certificates.length, 1);
      assert.equal(certificates[0]?.certificateCode, result.certificateCode);
    } finally {
      await db.certificate.deleteMany({
        where: {
          courseId: createdCourse.id,
        },
      });
      await db.userProgress.deleteMany({
        where: {
          userId,
          OR: [
            {
              courseId: createdCourse.id,
            },
            {
              lessonId: {
                in: lessons.map((lesson) => lesson.id),
              },
            },
          ],
        },
      });
      await db.courseLesson.deleteMany({
        where: {
          courseId: createdCourse.id,
        },
      });
      await db.lesson.deleteMany({
        where: {
          id: {
            in: lessons.map((lesson) => lesson.id),
          },
        },
      });
      await db.course.delete({
        where: {
          id: createdCourse.id,
        },
      });
    }
  });

  test("enforces checklist gating and exact resume target", async () => {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 1000)}`;
    const courseSlug = `it-gating-course-${suffix}`;
    const lessonOneSlug = `it-gating-lesson-1-${suffix}`;
    const lessonTwoSlug = `it-gating-lesson-2-${suffix}`;

    const createdCourse = await db.course.create({
      data: {
        slug: courseSlug,
        title: `Gating Course ${suffix}`,
        summary: "Synthetic course to validate checklist gating.",
        targetLevel: "beginner",
        completionRule: "all_lessons",
        certificateEligible: false,
        publishedStatus: "published",
      },
    });
    const lessonOne = await db.lesson.create({
      data: {
        slug: lessonOneSlug,
        title: "Gating Lesson 1",
        objective: "First lesson objective",
        level: "beginner",
        durationMin: 10,
        steps: ["Paso 1", "Paso 2"],
        publishedStatus: "published",
      },
    });
    const lessonTwo = await db.lesson.create({
      data: {
        slug: lessonTwoSlug,
        title: "Gating Lesson 2",
        objective: "Second lesson objective",
        level: "beginner",
        durationMin: 10,
        steps: ["Paso A", "Paso B"],
        publishedStatus: "published",
      },
    });

    await db.courseLesson.createMany({
      data: [
        {
          courseId: createdCourse.id,
          lessonId: lessonOne.id,
          orderIndex: 1,
          gateStatus: "active",
        },
        {
          courseId: createdCourse.id,
          lessonId: lessonTwo.id,
          orderIndex: 2,
          gateStatus: "locked",
        },
      ],
      skipDuplicates: true,
    });

    try {
      const blocked = await setLessonStepProgress({
        userId,
        courseSlug,
        lessonSlug: lessonTwoSlug,
        stepIndex: 0,
        completed: true,
      });
      assert.equal(blocked.ok, false);
      assert.match(blocked.message, /completar la leccion activa/i);

      const firstStep = await setLessonStepProgress({
        userId,
        courseSlug,
        lessonSlug: lessonOneSlug,
        stepIndex: 0,
        completed: true,
      });
      assert.equal(firstStep.ok, true);

      const secondStep = await setLessonStepProgress({
        userId,
        courseSlug,
        lessonSlug: lessonOneSlug,
        stepIndex: 1,
        completed: true,
      });
      assert.equal(secondStep.ok, true);
      assert.equal(secondStep.nextLessonSlug, lessonTwoSlug);
      assert.equal(secondStep.resumeLessonSlug, lessonTwoSlug);
      assert.equal(secondStep.resumeStepIndex, 0);

      const detailAfterUnlock = await getCourseDetailBySlug(courseSlug, userId);
      assert.ok(detailAfterUnlock);
      const detailLessonOne = detailAfterUnlock?.lessons.find((lesson) => lesson.slug === lessonOneSlug);
      const detailLessonTwo = detailAfterUnlock?.lessons.find((lesson) => lesson.slug === lessonTwoSlug);
      assert.equal(detailLessonOne?.status, "done");
      assert.equal(detailLessonTwo?.status, "active");
      assert.equal(detailAfterUnlock?.resumeLessonSlug, lessonTwoSlug);
      assert.equal(detailAfterUnlock?.resumeStepIndex, 0);

      const rollback = await setLessonStepProgress({
        userId,
        courseSlug,
        lessonSlug: lessonOneSlug,
        stepIndex: 1,
        completed: false,
      });
      assert.equal(rollback.ok, true);

      const detailAfterRollback = await getCourseDetailBySlug(courseSlug, userId);
      assert.ok(detailAfterRollback);
      const rollbackLessonOne = detailAfterRollback?.lessons.find((lesson) => lesson.slug === lessonOneSlug);
      const rollbackLessonTwo = detailAfterRollback?.lessons.find((lesson) => lesson.slug === lessonTwoSlug);
      assert.equal(rollbackLessonOne?.status, "active");
      assert.equal(rollbackLessonTwo?.status, "locked");
      assert.equal(detailAfterRollback?.resumeLessonSlug, lessonOneSlug);
      assert.equal(detailAfterRollback?.resumeStepIndex, 1);
    } finally {
      await db.userLessonStepProgress.deleteMany({
        where: {
          userId,
          lessonId: {
            in: [lessonOne.id, lessonTwo.id],
          },
        },
      });
      await db.userProgress.deleteMany({
        where: {
          userId,
          OR: [
            {
              courseId: createdCourse.id,
            },
            {
              lessonId: {
                in: [lessonOne.id, lessonTwo.id],
              },
            },
          ],
        },
      });
      await db.courseLesson.deleteMany({
        where: {
          courseId: createdCourse.id,
        },
      });
      await db.lesson.deleteMany({
        where: {
          id: {
            in: [lessonOne.id, lessonTwo.id],
          },
        },
      });
      await db.course.delete({
        where: {
          id: createdCourse.id,
        },
      });
    }
  });
});
