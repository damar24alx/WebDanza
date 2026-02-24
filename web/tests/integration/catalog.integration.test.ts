import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { db } from "../../src/lib/db";
import {
  getCourseDetailBySlug,
  getCoursesCatalog,
  getMoveDetailBySlug,
  getMovesCatalog,
  getStyleDetailBySlug,
  getStyleDetailBySlugWithOptions,
  getStyleLookup,
  getStylesCatalog,
  getStylesCatalogWithOptions,
  getSubstyleDetailBySlug,
  getSubstylesByStyleSlug,
} from "../../src/server/db/catalog";

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

describe("catalog repositories (integration)", () => {
  test("returns only published styles in public catalog", async () => {
    const styles = await getStylesCatalog();
    assert.ok(styles.length >= 5);
    assert.ok(styles.some((style) => style.slug === "house"));
    assert.equal(styles.some((style) => style.slug === "hip-hop"), false);
    assert.equal(styles.some((style) => style.slug === "dancehall"), false);
  });

  test("returns style detail by slug when style is published", async () => {
    const style = await getStyleDetailBySlug("house");
    assert.ok(style);
    assert.equal(style.slug, "house");
    assert.equal(style.name, "House");
  });

  test("keeps unpublished style hidden in public catalog but visible with admin option", async () => {
    const hiddenStyle = await getStyleDetailBySlug("hip-hop");
    assert.equal(hiddenStyle, undefined);

    const adminStyle = await getStyleDetailBySlugWithOptions("hip-hop", {
      includeUnpublished: true,
    });
    assert.ok(adminStyle);
    assert.equal(adminStyle.slug, "hip-hop");
  });

  test("returns substyles for a style", async () => {
    const substyles = await getSubstylesByStyleSlug("house");
    assert.ok(substyles.length >= 2);
    assert.ok(substyles.some((substyle) => substyle.slug === "litefeet"));
  });

  test("returns substyle detail by slug", async () => {
    const substyle = await getSubstyleDetailBySlug("boogaloo");
    assert.ok(substyle);
    assert.equal(substyle.styleSlug, "popping");
  });

  test("returns moves catalog from DB", async () => {
    const moves = await getMovesCatalog();
    assert.ok(moves.length >= 13);
    assert.ok(moves.some((move) => move.slug === "dancehall-bounce"));
  });

  test("returns move detail by slug", async () => {
    const move = await getMoveDetailBySlug("the-shuffle");
    assert.ok(move);
    assert.equal(move.slug, "the-shuffle");
    assert.ok(move.styleSlugs.includes("house"));
    assert.equal(move.media.some((media) => media.provider !== "other"), false);
    assert.equal(move.media.some((media) => !media.url.startsWith("/media/")), false);
  });

  test("returns courses catalog from DB", async () => {
    const courses = await getCoursesCatalog();
    assert.ok(courses.length >= 3);
    assert.ok(courses.some((course) => course.slug === "hip-hop-foundations"));
  });

  test("returns course detail with ordered lessons", async () => {
    const course = await getCourseDetailBySlug("hip-hop-foundations");
    assert.ok(course);
    assert.equal(course.lessons.length, 3);
    assert.equal(course.lessons[0]?.slug, "rock-fundamentals");
    assert.equal(course.media.some((media) => media.provider !== "other"), false);
    assert.equal(course.media.some((media) => !media.url.startsWith("/media/")), false);
    assert.ok((course.citations?.length ?? 0) >= 1);
    assert.ok((course.lessons[0]?.citations?.length ?? 0) >= 1);
    assert.equal(
      course.media.some(
        (media) =>
          media.rightsStatus !== "unknown" &&
          media.rightsStatus !== "ok_to_embed" &&
          media.rightsStatus !== "restricted" &&
          media.rightsStatus !== "blocked",
      ),
      false,
    );
  });

  test("public catalog excludes unpublished lessons inside published courses", async () => {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 1000)}`;
    const hiddenLessonSlug = `hidden-lesson-${suffix}`;
    const visibleLessonSlug = `visible-lesson-${suffix}`;
    const mixedCourseSlug = `mixed-course-${suffix}`;
    const hiddenOnlyCourseSlug = `hidden-only-course-${suffix}`;

    const hiddenLesson = await db.lesson.create({
      data: {
        slug: hiddenLessonSlug,
        title: "Hidden lesson",
        objective: "Should not be visible in public course detail.",
        level: "beginner",
        durationMin: 8,
        publishedStatus: "ready",
      },
    });
    const visibleLesson = await db.lesson.create({
      data: {
        slug: visibleLessonSlug,
        title: "Visible lesson",
        objective: "Should be visible in public course detail.",
        level: "beginner",
        durationMin: 8,
        publishedStatus: "published",
      },
    });

    const mixedCourse = await db.course.create({
      data: {
        slug: mixedCourseSlug,
        title: "Mixed visibility course",
        summary: "Contains one published lesson and one unpublished lesson.",
        targetLevel: "beginner",
        publishedStatus: "published",
      },
    });
    const hiddenOnlyCourse = await db.course.create({
      data: {
        slug: hiddenOnlyCourseSlug,
        title: "Hidden-only course",
        summary: "Contains only unpublished lessons.",
        targetLevel: "beginner",
        publishedStatus: "published",
      },
    });

    await db.courseLesson.createMany({
      data: [
        {
          courseId: mixedCourse.id,
          lessonId: hiddenLesson.id,
          orderIndex: 1,
          gateStatus: "active",
        },
        {
          courseId: mixedCourse.id,
          lessonId: visibleLesson.id,
          orderIndex: 2,
          gateStatus: "locked",
        },
        {
          courseId: hiddenOnlyCourse.id,
          lessonId: hiddenLesson.id,
          orderIndex: 1,
          gateStatus: "active",
        },
      ],
      skipDuplicates: true,
    });

    try {
      const mixedDetail = await getCourseDetailBySlug(mixedCourseSlug);
      assert.ok(mixedDetail);
      assert.equal(mixedDetail?.lessons.length, 1);
      assert.equal(mixedDetail?.lessons[0]?.slug, visibleLessonSlug);

      const catalog = await getCoursesCatalog();
      assert.equal(catalog.some((course) => course.slug === mixedCourseSlug), true);
      assert.equal(catalog.some((course) => course.slug === hiddenOnlyCourseSlug), false);

      const hiddenOnlyDetail = await getCourseDetailBySlug(hiddenOnlyCourseSlug);
      assert.equal(hiddenOnlyDetail, undefined);

      const adminVisible = await getCourseDetailBySlug(hiddenOnlyCourseSlug, undefined, {
        includeUnpublished: true,
      });
      assert.ok(adminVisible);
      assert.equal(adminVisible?.lessons.length, 1);
      assert.equal(adminVisible?.lessons[0]?.slug, hiddenLessonSlug);
    } finally {
      await db.courseLesson.deleteMany({
        where: {
          courseId: {
            in: [mixedCourse.id, hiddenOnlyCourse.id],
          },
        },
      });
      await db.course.deleteMany({
        where: {
          id: {
            in: [mixedCourse.id, hiddenOnlyCourse.id],
          },
        },
      });
      await db.lesson.deleteMany({
        where: {
          id: {
            in: [hiddenLesson.id, visibleLesson.id],
          },
        },
      });
    }
  });

  test("does not leak other users progress to anonymous catalog consumers", async () => {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 1000)}`;
    const userEmail = `anon-leak-${suffix}@dance.local`;
    const lessonSlug = `anon-leak-lesson-${suffix}`;
    const courseSlug = `anon-leak-course-${suffix}`;

    const user = await db.user.create({
      data: {
        email: userEmail,
        name: "Anon Leak Test User",
        role: "STUDENT",
      },
    });

    const lesson = await db.lesson.create({
      data: {
        slug: lessonSlug,
        title: "Anon leak lesson",
        objective: "Verify anonymous progress visibility is zero.",
        level: "beginner",
        durationMin: 12,
        publishedStatus: "published",
      },
    });

    const course = await db.course.create({
      data: {
        slug: courseSlug,
        title: "Anon leak course",
        summary: "Synthetic course for visibility tests.",
        targetLevel: "beginner",
        publishedStatus: "published",
      },
    });

    await db.courseLesson.create({
      data: {
        courseId: course.id,
        lessonId: lesson.id,
        orderIndex: 1,
        gateStatus: "done",
      },
    });

    await db.userProgress.create({
      data: {
        userId: user.id,
        courseId: course.id,
        status: "in_progress",
        percent: 87,
      },
    });

    try {
      const anonymousCatalog = await getCoursesCatalog();
      const anonymousRow = anonymousCatalog.find((entry) => entry.slug === courseSlug);
      assert.ok(anonymousRow);
      assert.equal(anonymousRow.progressPercent, 0);

      const anonymousDetail = await getCourseDetailBySlug(courseSlug);
      assert.ok(anonymousDetail);
      assert.equal(anonymousDetail.progressPercent, 0);

      const userCatalog = await getCoursesCatalog(user.id);
      const userRow = userCatalog.find((entry) => entry.slug === courseSlug);
      assert.ok(userRow);
      assert.equal(userRow.progressPercent, 87);

      const userDetail = await getCourseDetailBySlug(courseSlug, user.id);
      assert.ok(userDetail);
      assert.equal(userDetail.progressPercent, 87);
    } finally {
      await db.userProgress.deleteMany({
        where: {
          userId: user.id,
          courseId: course.id,
        },
      });
      await db.courseLesson.deleteMany({
        where: {
          courseId: course.id,
          lessonId: lesson.id,
        },
      });
      await db.course.delete({
        where: {
          id: course.id,
        },
      });
      await db.lesson.delete({
        where: {
          id: lesson.id,
        },
      });
      await db.user.delete({
        where: {
          id: user.id,
        },
      });
    }
  });

  test("builds style lookup map using public visibility by default", async () => {
    const lookup = await getStyleLookup();
    assert.ok(lookup.has("house"));
    assert.equal(lookup.has("hip-hop"), false);
  });

  test("returns unpublished styles for admin visibility options", async () => {
    const styles = await getStylesCatalogWithOptions({
      includeUnpublished: true,
    });
    assert.ok(styles.some((style) => style.slug === "hip-hop"));
    assert.ok(styles.some((style) => style.slug === "dancehall"));
  });
});
