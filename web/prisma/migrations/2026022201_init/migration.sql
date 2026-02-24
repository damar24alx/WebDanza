-- CreateEnum
CREATE TYPE "EditorialStatus" AS ENUM ('draft', 'review', 'ready', 'published');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('beginner', 'intermediate', 'advanced');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('not_started', 'in_progress', 'completed');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EDITOR', 'REVIEWER', 'STUDENT');

-- CreateEnum
CREATE TYPE "MediaProvider" AS ENUM ('youtube', 'vimeo', 'other');

-- CreateEnum
CREATE TYPE "RightsStatus" AS ENUM ('unknown', 'ok_to_embed', 'restricted', 'blocked');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('book', 'article', 'website', 'interview', 'archive', 'video', 'academic_paper', 'other');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('style', 'substyle', 'move', 'lesson', 'course', 'connection');

-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('style', 'substyle', 'move');

-- CreateEnum
CREATE TYPE "ConnectionType" AS ENUM ('influence', 'derived', 'fusion', 'migration');

-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('drill', 'combo', 'theory', 'assessment');

-- CreateEnum
CREATE TYPE "CourseCompletionRule" AS ENUM ('all_lessons', 'percent_90');

-- CreateEnum
CREATE TYPE "LessonGateStatus" AS ENUM ('done', 'active', 'locked');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Style" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "categoryPrimary" TEXT NOT NULL,
    "level" "Difficulty" NOT NULL DEFAULT 'beginner',
    "featuredTag" TEXT,
    "classesCount" INTEGER NOT NULL DEFAULT 0,
    "imageGradient" TEXT,
    "historicalCulturalContext" TEXT,
    "pedagogyOverview" TEXT,
    "movementPrinciples" TEXT[],
    "musicalityBasics" TEXT,
    "vocabularyCoreJson" JSONB,
    "publishedStatus" "EditorialStatus" NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Style_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Substyle" (
    "id" UUID NOT NULL,
    "styleId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "historicalCulturalContext" TEXT,
    "technicalFocus" TEXT[],
    "musicalFocus" TEXT,
    "vocabularyFocusJson" JSONB,
    "origin" TEXT,
    "playlistBpm" TEXT,
    "vibe" TEXT,
    "publishedStatus" "EditorialStatus" NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Substyle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Move" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "moveType" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "family" TEXT,
    "bpmRange" TEXT,
    "bodyMechanics" TEXT,
    "stepByStep" JSONB,
    "commonMistakes" JSONB,
    "corrections" JSONB,
    "safetyNotes" TEXT,
    "publishedStatus" "EditorialStatus" NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Move_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "level" "Difficulty" NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "lessonType" "LessonType" NOT NULL DEFAULT 'drill',
    "steps" JSONB,
    "successCriteria" JSONB,
    "publishedStatus" "EditorialStatus" NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" UUID NOT NULL,
    "styleId" UUID,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "targetLevel" "Difficulty" NOT NULL,
    "durationHours" INTEGER NOT NULL DEFAULT 1,
    "learningOutcomes" JSONB,
    "completionRule" "CourseCompletionRule" NOT NULL DEFAULT 'all_lessons',
    "certificateEligible" BOOLEAN NOT NULL DEFAULT false,
    "publishedStatus" "EditorialStatus" NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" UUID NOT NULL,
    "provider" "MediaProvider" NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "durationSec" INTEGER,
    "rightsStatus" "RightsStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Citation" (
    "id" UUID NOT NULL,
    "sourceType" "SourceType" NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "year" INTEGER,
    "url" TEXT,
    "accessedAt" TIMESTAMP(3),
    "claimScope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Citation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProgress" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "lessonId" UUID,
    "courseId" UUID,
    "status" "ProgressStatus" NOT NULL DEFAULT 'not_started',
    "percent" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "certificateCode" TEXT NOT NULL,
    "metadataJson" JSONB,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechniqueConcept" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechniqueConcept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicConcept" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "bpmMin" INTEGER,
    "bpmMax" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MusicConcept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Node" (
    "id" UUID NOT NULL,
    "nodeType" "NodeType" NOT NULL,
    "styleId" UUID,
    "substyleId" UUID,
    "moveId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Node_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Connection" (
    "id" UUID NOT NULL,
    "fromNodeId" UUID NOT NULL,
    "toNodeId" UUID NOT NULL,
    "connectionType" "ConnectionType" NOT NULL,
    "strength" INTEGER,
    "note" TEXT,
    "startPeriod" TEXT,
    "endPeriod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoveStyle" (
    "moveId" UUID NOT NULL,
    "styleId" UUID NOT NULL,
    "relevance" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "MoveStyle_pkey" PRIMARY KEY ("moveId","styleId")
);

-- CreateTable
CREATE TABLE "MoveSubstyle" (
    "moveId" UUID NOT NULL,
    "substyleId" UUID NOT NULL,
    "relevance" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "MoveSubstyle_pkey" PRIMARY KEY ("moveId","substyleId")
);

-- CreateTable
CREATE TABLE "LessonMove" (
    "lessonId" UUID NOT NULL,
    "moveId" UUID NOT NULL,
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "LessonMove_pkey" PRIMARY KEY ("lessonId","moveId")
);

-- CreateTable
CREATE TABLE "CourseLesson" (
    "courseId" UUID NOT NULL,
    "lessonId" UUID NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "gateStatus" "LessonGateStatus" NOT NULL DEFAULT 'locked',

    CONSTRAINT "CourseLesson_pkey" PRIMARY KEY ("courseId","lessonId")
);

-- CreateTable
CREATE TABLE "MoveTechniqueConcept" (
    "moveId" UUID NOT NULL,
    "techniqueConceptId" UUID NOT NULL,

    CONSTRAINT "MoveTechniqueConcept_pkey" PRIMARY KEY ("moveId","techniqueConceptId")
);

-- CreateTable
CREATE TABLE "MoveMusicConcept" (
    "moveId" UUID NOT NULL,
    "musicConceptId" UUID NOT NULL,

    CONSTRAINT "MoveMusicConcept_pkey" PRIMARY KEY ("moveId","musicConceptId")
);

-- CreateTable
CREATE TABLE "MediaLink" (
    "id" UUID NOT NULL,
    "mediaId" UUID NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CitationLink" (
    "id" UUID NOT NULL,
    "citationId" UUID NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CitationLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Style_slug_key" ON "Style"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Substyle_slug_key" ON "Substyle"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Move_slug_key" ON "Move"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_slug_key" ON "Lesson"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Media_url_key" ON "Media"("url");

-- CreateIndex
CREATE INDEX "UserProgress_userId_idx" ON "UserProgress"("userId");

-- CreateIndex
CREATE INDEX "UserProgress_lessonId_idx" ON "UserProgress"("lessonId");

-- CreateIndex
CREATE INDEX "UserProgress_courseId_idx" ON "UserProgress"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_certificateCode_key" ON "Certificate"("certificateCode");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_userId_courseId_key" ON "Certificate"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "TechniqueConcept_slug_key" ON "TechniqueConcept"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MusicConcept_slug_key" ON "MusicConcept"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Node_styleId_key" ON "Node"("styleId");

-- CreateIndex
CREATE UNIQUE INDEX "Node_substyleId_key" ON "Node"("substyleId");

-- CreateIndex
CREATE UNIQUE INDEX "Node_moveId_key" ON "Node"("moveId");

-- CreateIndex
CREATE INDEX "Connection_fromNodeId_idx" ON "Connection"("fromNodeId");

-- CreateIndex
CREATE INDEX "Connection_toNodeId_idx" ON "Connection"("toNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "Connection_fromNodeId_toNodeId_connectionType_key" ON "Connection"("fromNodeId", "toNodeId", "connectionType");

-- CreateIndex
CREATE UNIQUE INDEX "LessonMove_lessonId_orderIndex_key" ON "LessonMove"("lessonId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "CourseLesson_courseId_orderIndex_key" ON "CourseLesson"("courseId", "orderIndex");

-- CreateIndex
CREATE INDEX "MediaLink_entityType_entityId_idx" ON "MediaLink"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaLink_mediaId_entityType_entityId_key" ON "MediaLink"("mediaId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "CitationLink_entityType_entityId_idx" ON "CitationLink"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "CitationLink_citationId_entityType_entityId_key" ON "CitationLink"("citationId", "entityType", "entityId");

-- AddForeignKey
ALTER TABLE "Substyle" ADD CONSTRAINT "Substyle_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "Style"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "Style"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgress" ADD CONSTRAINT "UserProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgress" ADD CONSTRAINT "UserProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgress" ADD CONSTRAINT "UserProgress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "Style"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_substyleId_fkey" FOREIGN KEY ("substyleId") REFERENCES "Substyle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_moveId_fkey" FOREIGN KEY ("moveId") REFERENCES "Move"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoveStyle" ADD CONSTRAINT "MoveStyle_moveId_fkey" FOREIGN KEY ("moveId") REFERENCES "Move"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoveStyle" ADD CONSTRAINT "MoveStyle_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "Style"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoveSubstyle" ADD CONSTRAINT "MoveSubstyle_moveId_fkey" FOREIGN KEY ("moveId") REFERENCES "Move"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoveSubstyle" ADD CONSTRAINT "MoveSubstyle_substyleId_fkey" FOREIGN KEY ("substyleId") REFERENCES "Substyle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonMove" ADD CONSTRAINT "LessonMove_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonMove" ADD CONSTRAINT "LessonMove_moveId_fkey" FOREIGN KEY ("moveId") REFERENCES "Move"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseLesson" ADD CONSTRAINT "CourseLesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseLesson" ADD CONSTRAINT "CourseLesson_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoveTechniqueConcept" ADD CONSTRAINT "MoveTechniqueConcept_moveId_fkey" FOREIGN KEY ("moveId") REFERENCES "Move"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoveTechniqueConcept" ADD CONSTRAINT "MoveTechniqueConcept_techniqueConceptId_fkey" FOREIGN KEY ("techniqueConceptId") REFERENCES "TechniqueConcept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoveMusicConcept" ADD CONSTRAINT "MoveMusicConcept_moveId_fkey" FOREIGN KEY ("moveId") REFERENCES "Move"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoveMusicConcept" ADD CONSTRAINT "MoveMusicConcept_musicConceptId_fkey" FOREIGN KEY ("musicConceptId") REFERENCES "MusicConcept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaLink" ADD CONSTRAINT "MediaLink_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CitationLink" ADD CONSTRAINT "CitationLink_citationId_fkey" FOREIGN KEY ("citationId") REFERENCES "Citation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

