CREATE TABLE "UserLessonStepProgress" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "lessonId" UUID NOT NULL,
  "stepIndex" INTEGER NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserLessonStepProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserLessonStepProgress_userId_lessonId_stepIndex_key"
ON "UserLessonStepProgress"("userId", "lessonId", "stepIndex");

CREATE INDEX "UserLessonStepProgress_userId_lessonId_idx"
ON "UserLessonStepProgress"("userId", "lessonId");

CREATE INDEX "UserLessonStepProgress_lessonId_idx"
ON "UserLessonStepProgress"("lessonId");

ALTER TABLE "UserLessonStepProgress"
  ADD CONSTRAINT "UserLessonStepProgress_userId_fkey"
  FOREIGN KEY ("userId")
  REFERENCES "User"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "UserLessonStepProgress"
  ADD CONSTRAINT "UserLessonStepProgress_lessonId_fkey"
  FOREIGN KEY ("lessonId")
  REFERENCES "Lesson"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "UserLessonStepProgress"
  ADD CONSTRAINT "UserLessonStepProgress_stepIndex_range"
  CHECK ("stepIndex" >= 0);
