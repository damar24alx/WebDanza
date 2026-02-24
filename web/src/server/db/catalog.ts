import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getMoveImageUrl, getStyleImageUrl } from "@/lib/content-images";
import { logEvent } from "@/server/observability/logger";
import { normalizeInternalMediaPath } from "@/server/validation/url";
import {
  CitationAssetMock,
  CourseLessonMock,
  CourseMock,
  MediaAssetMock,
  MoveMock,
  StyleMock,
  SubstyleMock,
} from "@/mocks/types";

type MoveWithStyles = Prisma.MoveGetPayload<{
  include: {
    moveStyles: {
      include: {
        style: true;
      };
    };
  };
}>;

type CourseWithRelations = Prisma.CourseGetPayload<{
  include: {
    style: true;
    courseLessons: {
      include: {
        lesson: true;
      };
      orderBy: {
        orderIndex: "asc";
      };
    };
    userProgresses: {
      where: {
        userId: string;
      };
      take: 1;
      orderBy: {
        updatedAt: "desc";
      };
    };
  };
}>;

type CourseWithRelationsPublic = Prisma.CourseGetPayload<{
  include: {
    style: true;
    courseLessons: {
      include: {
        lesson: true;
      };
      orderBy: {
        orderIndex: "asc";
      };
    };
  };
}>;

type CatalogVisibilityOptions = {
  includeUnpublished?: boolean;
};

function getLessonVisibilityFilter(options?: CatalogVisibilityOptions) {
  if (options?.includeUnpublished) {
    return {};
  }

  return {
    lesson: {
      publishedStatus: "published" as const,
    },
  };
}

function assertDatabaseConfigured() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required. Configure web/.env before using DB repositories.");
  }
}

function parseStringArray(value: Prisma.JsonValue | null): string[] {
  if (!value || !Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function parseLessonChecklistSteps(value: Prisma.JsonValue | null): string[] {
  return parseStringArray(value);
}

function parseCommonMistakes(
  value: Prisma.JsonValue | null,
): Array<{ issue: string; correction: string }> {
  if (!value || !Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const issue = "issue" in item && typeof item.issue === "string" ? item.issue : "";
      const correction =
        "correction" in item && typeof item.correction === "string"
          ? item.correction
          : "";

      if (!issue || !correction) {
        return null;
      }

      return { issue, correction };
    })
    .filter((item): item is { issue: string; correction: string } => Boolean(item));
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

function toStyleMock(style: Prisma.StyleGetPayload<object>): StyleMock {
  return {
    slug: style.slug,
    name: style.name,
    summary: style.summary,
    category: style.categoryPrimary,
    level: style.level,
    featuredTag: style.featuredTag ?? undefined,
    classesCount: style.classesCount,
    principles: style.movementPrinciples,
    musicality: style.musicalityBasics ?? "",
    history: style.historicalCulturalContext ?? "PLACEHOLDER: contexto en construccion.",
    image: style.imageGradient ?? "from-slate-600 to-slate-900",
    imageUrl: getStyleImageUrl(style.slug),
  };
}

function toSubstyleMock(
  substyle: Prisma.SubstyleGetPayload<{ include: { style: true } }>,
): SubstyleMock {
  return {
    slug: substyle.slug,
    styleSlug: substyle.style.slug,
    name: substyle.name,
    summary: substyle.summary,
    origin: substyle.origin ?? "PLACEHOLDER",
    focus: substyle.technicalFocus,
    playlistBpm: substyle.playlistBpm ?? "PLACEHOLDER",
    vibe: substyle.vibe ?? "PLACEHOLDER",
  };
}

function toMoveMock(move: MoveWithStyles): MoveMock {
  return {
    slug: move.slug,
    name: move.name,
    summary: move.summary,
    moveType: move.moveType,
    difficulty: move.difficulty,
    bpmRange: move.bpmRange ?? "N/A",
    family: move.family ?? "General",
    styleSlugs: move.moveStyles.map((moveStyle) => moveStyle.style.slug),
    stepByStep: parseStringArray(move.stepByStep),
    commonMistakes: parseCommonMistakes(move.commonMistakes),
    media: [],
    coverImageUrl: getMoveImageUrl({
      slug: move.slug,
      family: move.family,
    }),
  };
}

function toCourseLessonMock(
  lesson: CourseWithRelations["courseLessons"][number] | CourseWithRelationsPublic["courseLessons"][number],
): CourseLessonMock {
  const checklistSteps = parseLessonChecklistSteps(lesson.lesson.steps);
  const completedByGate = lesson.gateStatus === "done";
  const completedSteps = completedByGate ? checklistSteps.length : 0;
  const percent =
    checklistSteps.length > 0
      ? Math.round((completedSteps / checklistSteps.length) * 100)
      : completedByGate
        ? 100
        : 0;

  return {
    id: lesson.lesson.id,
    slug: lesson.lesson.slug,
    title: lesson.lesson.title,
    durationMin: lesson.lesson.durationMin,
    status: lesson.gateStatus,
    objective: lesson.lesson.objective,
    takeaways: checklistSteps,
    steps: checklistSteps.map((label, index) => ({
      index,
      label,
      completed: completedByGate,
    })),
    completedSteps,
    totalSteps: checklistSteps.length,
    percent: clampPercent(percent),
    nextStepIndex: completedByGate ? null : checklistSteps.length > 0 ? 0 : null,
  };
}

function toCourseMock(
  course: CourseWithRelations | CourseWithRelationsPublic,
  progressPercent: number,
  options?: {
    lessons?: CourseLessonMock[];
    resumeLessonSlug?: string | null;
    resumeStepIndex?: number | null;
  },
): CourseMock {
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    summary: course.summary,
    styleSlug: course.style?.slug ?? "hip-hop",
    level: course.targetLevel,
    durationHours: course.durationHours,
    lessons: options?.lessons ?? course.courseLessons.map((courseLesson) => toCourseLessonMock(courseLesson)),
    certificateEligible: course.certificateEligible,
    progressPercent: clampPercent(progressPercent),
    resumeLessonSlug: options?.resumeLessonSlug,
    resumeStepIndex: options?.resumeStepIndex ?? null,
    media: [],
    citations: [],
  };
}

function buildLessonStepProgressMap(
  rows: Array<{ lessonId: string; stepIndex: number }>,
): Map<string, Set<number>> {
  const map = new Map<string, Set<number>>();
  for (const row of rows) {
    const bucket = map.get(row.lessonId) ?? new Set<number>();
    bucket.add(row.stepIndex);
    map.set(row.lessonId, bucket);
  }

  return map;
}

function buildLessonPercentMap(
  rows: Array<{ lessonId: string | null; percent: number }>,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (!row.lessonId) {
      continue;
    }
    map.set(row.lessonId, clampPercent(row.percent));
  }
  return map;
}

function buildUserLessonStates(
  lessons: Array<CourseWithRelations["courseLessons"][number] | CourseWithRelationsPublic["courseLessons"][number]>,
  lessonStepProgressMap: Map<string, Set<number>>,
  lessonPercentMap: Map<string, number>,
): CourseLessonMock[] {
  const states = lessons.map((lesson) => {
    const checklistSteps = parseLessonChecklistSteps(lesson.lesson.steps);
    const completedSet = lessonStepProgressMap.get(lesson.lesson.id) ?? new Set<number>();
    const completedSteps = checklistSteps.length
      ? checklistSteps.reduce((count, _step, index) => (completedSet.has(index) ? count + 1 : count), 0)
      : 0;
    const fallbackPercent = lessonPercentMap.get(lesson.lesson.id) ?? 0;
    const percent =
      checklistSteps.length > 0
        ? clampPercent(Math.round((completedSteps / checklistSteps.length) * 100))
        : clampPercent(fallbackPercent);
    const nextStepIndex =
      checklistSteps.length === 0
        ? null
        : checklistSteps.findIndex((_step, index) => !completedSet.has(index));

    const lessonState: CourseLessonMock = {
      id: lesson.lesson.id,
      slug: lesson.lesson.slug,
      title: lesson.lesson.title,
      durationMin: lesson.lesson.durationMin,
      status: "locked",
      objective: lesson.lesson.objective,
      takeaways: checklistSteps,
      steps: checklistSteps.map((label, index) => ({
        index,
        label,
        completed: completedSet.has(index),
      })),
      completedSteps,
      totalSteps: checklistSteps.length,
      percent,
      nextStepIndex: nextStepIndex === -1 ? null : nextStepIndex,
    };

    return lessonState;
  });

  let allPreviousCompleted = true;
  for (const lesson of states) {
    const isCompleted = lesson.percent >= 100;
    if (isCompleted) {
      lesson.status = "done";
      continue;
    }

    if (allPreviousCompleted) {
      lesson.status = "active";
      allPreviousCompleted = false;
      continue;
    }

    lesson.status = "locked";
  }

  return states;
}

function deriveResumeTarget(
  lessons: CourseLessonMock[],
): { resumeLessonSlug: string | null; resumeStepIndex: number | null } {
  for (const lesson of lessons) {
    if (lesson.status !== "active") {
      continue;
    }

    if (lesson.totalSteps > 0) {
      return {
        resumeLessonSlug: lesson.slug,
        resumeStepIndex: lesson.nextStepIndex ?? 0,
      };
    }

    return {
      resumeLessonSlug: lesson.slug,
      resumeStepIndex: null,
    };
  }

  return {
    resumeLessonSlug: null,
    resumeStepIndex: null,
  };
}

function deriveCoursePercentFromLessons(lessons: CourseLessonMock[]) {
  if (lessons.length === 0) {
    return 0;
  }

  const sum = lessons.reduce((total, lesson) => total + clampPercent(lesson.percent), 0);
  return clampPercent(Math.round(sum / lessons.length));
}

function hasUserProgresses(
  course: CourseWithRelations | CourseWithRelationsPublic,
): course is CourseWithRelations {
  return "userProgresses" in course;
}

async function listMediaByEntity(
  entityType: "move" | "course",
  entityId: string,
): Promise<MediaAssetMock[]> {
  const links = await db.mediaLink.findMany({
    where: {
      entityType,
      entityId,
    },
    include: {
      media: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return links
    .filter(
      (link) =>
        link.media.provider === "other" &&
        normalizeInternalMediaPath(link.media.url) !== undefined,
    )
    .map((link) => ({
      id: link.media.id,
      provider: link.media.provider,
      rightsStatus: link.media.rightsStatus,
      url: link.media.url,
      title: link.media.title,
      durationSec: link.media.durationSec,
      role: link.role,
    }));
}

function toCitationAsset(
  citation: Prisma.CitationGetPayload<object>,
): CitationAssetMock {
  return {
    id: citation.id,
    sourceType: citation.sourceType,
    title: citation.title,
    author: citation.author,
    year: citation.year,
    url: citation.url,
  };
}

export async function getStylesCatalog(): Promise<StyleMock[]> {
  return getStylesCatalogWithOptions();
}

export async function getStylesCatalogWithOptions(
  options?: CatalogVisibilityOptions,
): Promise<StyleMock[]> {
  assertDatabaseConfigured();

  const styles = await db.style.findMany({
    where: {
      isArchived: false,
      ...(options?.includeUnpublished ? {} : { publishedStatus: "published" }),
    },
    orderBy: { name: "asc" },
  });

  return styles.map((style) => toStyleMock(style));
}

export async function getStyleDetailBySlug(slug: string): Promise<StyleMock | undefined> {
  return getStyleDetailBySlugWithOptions(slug);
}

export async function getStyleDetailBySlugWithOptions(
  slug: string,
  options?: CatalogVisibilityOptions,
): Promise<StyleMock | undefined> {
  assertDatabaseConfigured();

  const style = await db.style.findFirst({
    where: {
      slug,
      isArchived: false,
      ...(options?.includeUnpublished ? {} : { publishedStatus: "published" }),
    },
  });

  return style ? toStyleMock(style) : undefined;
}

export async function getSubstylesByStyleSlug(styleSlug: string): Promise<SubstyleMock[]> {
  return getSubstylesByStyleSlugWithOptions(styleSlug);
}

export async function getSubstylesByStyleSlugWithOptions(
  styleSlug: string,
  options?: CatalogVisibilityOptions,
): Promise<SubstyleMock[]> {
  assertDatabaseConfigured();

  const substyles = await db.substyle.findMany({
    where: {
      isArchived: false,
      ...(options?.includeUnpublished ? {} : { publishedStatus: "published" }),
      style: {
        slug: styleSlug,
        isArchived: false,
        ...(options?.includeUnpublished ? {} : { publishedStatus: "published" }),
      },
    },
    include: {
      style: true,
    },
    orderBy: { name: "asc" },
  });

  return substyles.map((substyle) => toSubstyleMock(substyle));
}

export async function getSubstyleDetailBySlug(
  slug: string,
): Promise<SubstyleMock | undefined> {
  return getSubstyleDetailBySlugWithOptions(slug);
}

export async function getSubstyleDetailBySlugWithOptions(
  slug: string,
  options?: CatalogVisibilityOptions,
): Promise<SubstyleMock | undefined> {
  assertDatabaseConfigured();

  const substyle = await db.substyle.findFirst({
    where: {
      slug,
      isArchived: false,
      ...(options?.includeUnpublished ? {} : { publishedStatus: "published" }),
      style: {
        isArchived: false,
        ...(options?.includeUnpublished ? {} : { publishedStatus: "published" }),
      },
    },
    include: {
      style: true,
    },
  });

  return substyle ? toSubstyleMock(substyle) : undefined;
}

export async function getMovesCatalog(): Promise<MoveMock[]> {
  return getMovesCatalogWithOptions();
}

export async function getMovesCatalogWithOptions(
  options?: CatalogVisibilityOptions,
): Promise<MoveMock[]> {
  assertDatabaseConfigured();

  const moves = await db.move.findMany({
    where: {
      isArchived: false,
      ...(options?.includeUnpublished ? {} : { publishedStatus: "published" }),
    },
    include: {
      moveStyles: {
        include: {
          style: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return moves.map((move) => toMoveMock(move));
}

export async function getMoveDetailBySlug(slug: string): Promise<MoveMock | undefined> {
  return getMoveDetailBySlugWithOptions(slug);
}

export async function getMoveDetailBySlugWithOptions(
  slug: string,
  options?: CatalogVisibilityOptions,
): Promise<MoveMock | undefined> {
  assertDatabaseConfigured();

  const move = await db.move.findFirst({
    where: {
      slug,
      isArchived: false,
      ...(options?.includeUnpublished ? {} : { publishedStatus: "published" }),
    },
    include: {
      moveStyles: {
        include: {
          style: true,
        },
      },
    },
  });

  if (!move) {
    return undefined;
  }

  const media = await listMediaByEntity("move", move.id);

  return {
    ...toMoveMock(move),
    media,
  };
}

export async function getCoursesCatalog(
  userId?: string,
  options?: CatalogVisibilityOptions,
): Promise<CourseMock[]> {
  assertDatabaseConfigured();

  if (!userId) {
    const courses = await db.course.findMany({
      where: {
        ...(options?.includeUnpublished ? {} : { publishedStatus: "published" }),
      },
      include: {
        style: true,
        courseLessons: {
          where: getLessonVisibilityFilter(options),
          include: {
            lesson: true,
          },
          orderBy: {
            orderIndex: "asc",
          },
        },
      },
      orderBy: { title: "asc" },
    });

    const mappedCourses = courses.map((course) => toCourseMock(course, 0));
    if (options?.includeUnpublished) {
      return mappedCourses;
    }

    return mappedCourses.filter((course) => course.lessons.length > 0);
  }

  const courses = await db.course.findMany({
    where: {
      ...(options?.includeUnpublished ? {} : { publishedStatus: "published" }),
    },
    include: {
      style: true,
      courseLessons: {
        where: getLessonVisibilityFilter(options),
        include: {
          lesson: true,
        },
        orderBy: {
          orderIndex: "asc",
        },
      },
      userProgresses: {
        where: { userId },
        take: 1,
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
    orderBy: { title: "asc" },
  });

  const lessonIds = courses.flatMap((course) =>
    course.courseLessons.map((courseLesson) => courseLesson.lesson.id),
  );
  const [stepRows, lessonProgressRows] = lessonIds.length
    ? await Promise.all([
        db.userLessonStepProgress.findMany({
          where: {
            userId,
            lessonId: {
              in: lessonIds,
            },
          },
          select: {
            lessonId: true,
            stepIndex: true,
          },
        }),
        db.userProgress.findMany({
          where: {
            userId,
            lessonId: {
              in: lessonIds,
            },
          },
          select: {
            lessonId: true,
            percent: true,
          },
        }),
      ])
    : [[], []];

  const lessonStepProgressMap = buildLessonStepProgressMap(stepRows);
  const lessonPercentMap = buildLessonPercentMap(lessonProgressRows);

  const mappedCourses = courses.map((course) => {
    const lessons = buildUserLessonStates(
      course.courseLessons,
      lessonStepProgressMap,
      lessonPercentMap,
    );
    const computedCoursePercent = deriveCoursePercentFromLessons(lessons);
    const fallbackCoursePercent = clampPercent(course.userProgresses[0]?.percent ?? 0);
    const coursePercent =
      computedCoursePercent > 0 ? computedCoursePercent : fallbackCoursePercent;
    const resume = deriveResumeTarget(lessons);
    return toCourseMock(course, coursePercent, {
      lessons,
      resumeLessonSlug: resume.resumeLessonSlug,
      resumeStepIndex: resume.resumeStepIndex,
    });
  });
  if (options?.includeUnpublished) {
    return mappedCourses;
  }

  return mappedCourses.filter((course) => course.lessons.length > 0);
}

export async function getCourseDetailBySlug(
  slug: string,
  userId?: string,
  options?: CatalogVisibilityOptions,
): Promise<CourseMock | undefined> {
  assertDatabaseConfigured();

  const course = userId
    ? await db.course.findUnique({
        where: {
          slug,
          ...(options?.includeUnpublished ? {} : { publishedStatus: "published" }),
        },
        include: {
          style: true,
          courseLessons: {
            where: getLessonVisibilityFilter(options),
            include: {
              lesson: true,
            },
            orderBy: {
              orderIndex: "asc",
            },
          },
          userProgresses: {
            where: { userId },
            take: 1,
            orderBy: {
              updatedAt: "desc",
            },
          },
        },
      })
    : await db.course.findUnique({
        where: {
          slug,
          ...(options?.includeUnpublished ? {} : { publishedStatus: "published" }),
        },
        include: {
          style: true,
          courseLessons: {
            where: getLessonVisibilityFilter(options),
            include: {
              lesson: true,
            },
            orderBy: {
              orderIndex: "asc",
            },
          },
        },
      });

  if (!course) {
    return undefined;
  }

  if (!options?.includeUnpublished && course.courseLessons.length === 0) {
    return undefined;
  }

  const lessonIdBySlug = new Map(
    course.courseLessons.map((courseLesson) => [courseLesson.lesson.slug, courseLesson.lesson.id]),
  );
  const lessonIds = Array.from(lessonIdBySlug.values());

  const [media, citationLinkRows] = await Promise.all([
    listMediaByEntity("course", course.id),
    db.citationLink.findMany({
      where: {
        OR: [
          {
            entityType: "course",
            entityId: course.id,
          },
          {
            entityType: "lesson",
            entityId: {
              in: lessonIds,
            },
          },
        ],
      },
      select: {
        citationId: true,
        entityType: true,
        entityId: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const citationIds = Array.from(new Set(citationLinkRows.map((link) => link.citationId)));
  const citations = citationIds.length
    ? await db.citation.findMany({
        where: {
          id: {
            in: citationIds,
          },
        },
      })
    : [];
  const citationById = new Map(citations.map((citation) => [citation.id, citation]));

  const danglingCount = citationLinkRows.filter(
    (link) => !citationById.has(link.citationId),
  ).length;
  if (danglingCount > 0) {
    logEvent("warn", "catalog.citation_link_dangling", {
      courseSlug: course.slug,
      danglingCount,
    });
  }

  const courseCitations = citationLinkRows
    .filter((link) => link.entityType === "course")
    .map((link) => citationById.get(link.citationId))
    .filter((citation): citation is Prisma.CitationGetPayload<object> => Boolean(citation))
    .map((citation) => toCitationAsset(citation));

  const lessonCitationsByLessonId = new Map<string, CitationAssetMock[]>();
  for (const link of citationLinkRows) {
    if (link.entityType !== "lesson") {
      continue;
    }

    const citation = citationById.get(link.citationId);
    if (!citation) {
      continue;
    }

    const current = lessonCitationsByLessonId.get(link.entityId) ?? [];
    current.push(toCitationAsset(citation));
    lessonCitationsByLessonId.set(link.entityId, current);
  }

  let baseCourse: CourseMock;
  if (userId) {
    const [stepRows, lessonProgressRows] = lessonIds.length
      ? await Promise.all([
          db.userLessonStepProgress.findMany({
            where: {
              userId,
              lessonId: {
                in: lessonIds,
              },
            },
            select: {
              lessonId: true,
              stepIndex: true,
            },
          }),
          db.userProgress.findMany({
            where: {
              userId,
              lessonId: {
                in: lessonIds,
              },
            },
            select: {
              lessonId: true,
              percent: true,
            },
          }),
        ])
      : [[], []];
    const lessonStepProgressMap = buildLessonStepProgressMap(stepRows);
    const lessonPercentMap = buildLessonPercentMap(lessonProgressRows);
    const lessons = buildUserLessonStates(
      course.courseLessons,
      lessonStepProgressMap,
      lessonPercentMap,
    );
    const computedCoursePercent = deriveCoursePercentFromLessons(lessons);
    const fallbackCoursePercent =
      hasUserProgresses(course) ? clampPercent(course.userProgresses[0]?.percent ?? 0) : 0;
    const coursePercent =
      computedCoursePercent > 0 ? computedCoursePercent : fallbackCoursePercent;
    const resume = deriveResumeTarget(lessons);
    baseCourse = toCourseMock(course, coursePercent, {
      lessons,
      resumeLessonSlug: resume.resumeLessonSlug,
      resumeStepIndex: resume.resumeStepIndex,
    });
  } else {
    baseCourse = toCourseMock(course, 0);
  }
  const lessonsWithCitations = baseCourse.lessons.map((lesson) => ({
    ...lesson,
    citations: lessonCitationsByLessonId.get(lessonIdBySlug.get(lesson.slug) ?? "") ?? [],
  }));

  return {
    ...baseCourse,
    lessons: lessonsWithCitations,
    media,
    citations: courseCitations,
  };
}

export async function getStyleLookup(): Promise<Map<string, StyleMock>> {
  const styles = await getStylesCatalogWithOptions();
  return new Map(styles.map((style) => [style.slug, style]));
}

export async function getAllSubstylesCatalog(): Promise<SubstyleMock[]> {
  return getAllSubstylesCatalogWithOptions();
}

export async function getAllSubstylesCatalogWithOptions(
  options?: CatalogVisibilityOptions,
): Promise<SubstyleMock[]> {
  assertDatabaseConfigured();

  const substyles = await db.substyle.findMany({
    where: {
      isArchived: false,
      ...(options?.includeUnpublished ? {} : { publishedStatus: "published" }),
      style: {
        isArchived: false,
        ...(options?.includeUnpublished ? {} : { publishedStatus: "published" }),
      },
    },
    include: {
      style: true,
    },
    orderBy: { name: "asc" },
  });

  return substyles.map((substyle) => toSubstyleMock(substyle));
}
