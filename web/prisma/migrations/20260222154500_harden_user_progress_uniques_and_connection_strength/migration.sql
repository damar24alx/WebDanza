-- Remove duplicated user progress rows before adding unique constraints.
WITH lesson_ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "userId", "lessonId"
      ORDER BY "updatedAt" DESC, id DESC
    ) AS rn
  FROM "UserProgress"
  WHERE "lessonId" IS NOT NULL
)
DELETE FROM "UserProgress" up
USING lesson_ranked
WHERE up.id = lesson_ranked.id
  AND lesson_ranked.rn > 1;

WITH course_ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "userId", "courseId"
      ORDER BY "updatedAt" DESC, id DESC
    ) AS rn
  FROM "UserProgress"
  WHERE "courseId" IS NOT NULL
)
DELETE FROM "UserProgress" up
USING course_ranked
WHERE up.id = course_ranked.id
  AND course_ranked.rn > 1;

ALTER TABLE "UserProgress"
  ADD CONSTRAINT "UserProgress_userId_lessonId_key"
  UNIQUE ("userId", "lessonId");

ALTER TABLE "UserProgress"
  ADD CONSTRAINT "UserProgress_userId_courseId_key"
  UNIQUE ("userId", "courseId");

ALTER TABLE "Connection"
  ADD CONSTRAINT "Connection_strength_range_check"
  CHECK ("strength" IS NULL OR ("strength" >= 1 AND "strength" <= 5));

