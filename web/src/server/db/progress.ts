import { randomBytes } from "node:crypto";
import {
  CourseCompletionRule,
  Prisma,
  ProgressStatus,
} from "@prisma/client";
import { db } from "@/lib/db";

type LessonProgressResult = {
  ok: boolean;
  message: string;
  courseSlug?: string;
  lessonSlug?: string;
  nextLessonSlug?: string | null;
  resumeLessonSlug?: string | null;
  resumeStepIndex?: number | null;
  percent?: number;
  status?: ProgressStatus;
  certificateIssued?: boolean;
  certificateCode?: string | null;
};

type CourseWithLessons = Prisma.CourseGetPayload<{
  include: {
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

type ComputedLessonState = {
  lessonId: string;
  lessonSlug: string;
  totalSteps: number;
  percent: number;
  status: "done" | "active" | "locked";
  nextStepIndex: number | null;
};

type ComputedCourseState = {
  lessons: ComputedLessonState[];
  nextLessonSlug: string | null;
  resumeLessonSlug: string | null;
  resumeStepIndex: number | null;
  percent: number;
  status: ProgressStatus;
};

function assertDatabaseConfigured() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required. Configure web/.env before using DB repositories.");
  }
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

function statusFromPercent(percent: number, completionRule: CourseCompletionRule): ProgressStatus {
  const completionThreshold = completionRule === "percent_90" ? 90 : 100;
  if (percent >= completionThreshold) {
    return "completed";
  }
  if (percent > 0) {
    return "in_progress";
  }

  return "not_started";
}

function statusFromLessonPercent(percent: number): ProgressStatus {
  if (percent >= 100) {
    return "completed";
  }
  if (percent > 0) {
    return "in_progress";
  }

  return "not_started";
}

function generateCertificateCode() {
  const dateSegment = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const randomSegment = randomBytes(4).toString("hex").toUpperCase();
  return `DA-${dateSegment}-${randomSegment}`;
}

function parseLessonChecklistSteps(value: Prisma.JsonValue | null): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function getLessonProgressMaps(input: {
  stepRows: Array<{ lessonId: string; stepIndex: number }>;
  lessonProgressRows: Array<{ lessonId: string | null; percent: number }>;
}) {
  const lessonStepMap = new Map<string, Set<number>>();
  for (const row of input.stepRows) {
    const set = lessonStepMap.get(row.lessonId) ?? new Set<number>();
    set.add(row.stepIndex);
    lessonStepMap.set(row.lessonId, set);
  }

  const lessonPercentFallback = new Map<string, number>();
  for (const row of input.lessonProgressRows) {
    if (!row.lessonId) {
      continue;
    }

    lessonPercentFallback.set(row.lessonId, clampPercent(row.percent));
  }

  return {
    lessonStepMap,
    lessonPercentFallback,
  };
}

function computeCourseState(input: {
  course: CourseWithLessons;
  stepRows: Array<{ lessonId: string; stepIndex: number }>;
  lessonProgressRows: Array<{ lessonId: string | null; percent: number }>;
}): ComputedCourseState {
  const { lessonStepMap, lessonPercentFallback } = getLessonProgressMaps({
    stepRows: input.stepRows,
    lessonProgressRows: input.lessonProgressRows,
  });

  const lessons: ComputedLessonState[] = input.course.courseLessons.map((courseLesson) => {
    const checklist = parseLessonChecklistSteps(courseLesson.lesson.steps);
    const completedIndexes = lessonStepMap.get(courseLesson.lesson.id) ?? new Set<number>();
    const completedSteps = checklist.reduce(
      (count, _label, index) => (completedIndexes.has(index) ? count + 1 : count),
      0,
    );
    const fallbackPercent = lessonPercentFallback.get(courseLesson.lesson.id) ?? 0;
    const percent =
      checklist.length > 0
        ? clampPercent(Math.round((completedSteps / checklist.length) * 100))
        : clampPercent(fallbackPercent);
    const nextStepIndex =
      checklist.length === 0
        ? null
        : checklist.findIndex((_label, index) => !completedIndexes.has(index));

    return {
      lessonId: courseLesson.lesson.id,
      lessonSlug: courseLesson.lesson.slug,
      totalSteps: checklist.length,
      percent,
      status: "locked",
      nextStepIndex: nextStepIndex === -1 ? null : nextStepIndex,
    };
  });

  let allPreviousCompleted = true;
  for (const lesson of lessons) {
    const completed = lesson.percent >= 100;
    if (completed) {
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

  const percent =
    lessons.length === 0
      ? 0
      : clampPercent(
          Math.round(
            lessons.reduce((sum, lesson) => sum + clampPercent(lesson.percent), 0) / lessons.length,
          ),
        );
  const status = statusFromPercent(percent, input.course.completionRule);

  const nextLesson = lessons.find((lesson) => lesson.percent < 100) ?? null;
  const activeLesson = lessons.find((lesson) => lesson.status === "active") ?? null;

  return {
    lessons,
    nextLessonSlug: nextLesson?.lessonSlug ?? null,
    resumeLessonSlug: activeLesson?.lessonSlug ?? null,
    resumeStepIndex: activeLesson?.nextStepIndex ?? null,
    percent,
    status,
  };
}

async function loadCourseForProgress(
  tx: Prisma.TransactionClient,
  courseSlug: string,
) {
  return tx.course.findFirst({
    where: {
      slug: courseSlug,
      publishedStatus: "published",
    },
    include: {
      courseLessons: {
        where: {
          lesson: {
            publishedStatus: "published",
          },
        },
        include: {
          lesson: true,
        },
        orderBy: {
          orderIndex: "asc",
        },
      },
    },
  });
}

async function getCurrentCourseState(input: {
  tx: Prisma.TransactionClient;
  userId: string;
  course: CourseWithLessons;
}) {
  const lessonIds = input.course.courseLessons.map((entry) => entry.lesson.id);
  const [stepRows, lessonProgressRows] = lessonIds.length
    ? await Promise.all([
        input.tx.userLessonStepProgress.findMany({
          where: {
            userId: input.userId,
            lessonId: {
              in: lessonIds,
            },
          },
          select: {
            lessonId: true,
            stepIndex: true,
          },
        }),
        input.tx.userProgress.findMany({
          where: {
            userId: input.userId,
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

  return computeCourseState({
    course: input.course,
    stepRows,
    lessonProgressRows,
  });
}

async function persistLessonProgressRows(input: {
  tx: Prisma.TransactionClient;
  userId: string;
  course: CourseWithLessons;
  state: ComputedCourseState;
  now: Date;
}) {
  const lessonIds = input.course.courseLessons.map((entry) => entry.lesson.id);
  if (lessonIds.length === 0) {
    return;
  }

  const existingRows = await input.tx.userProgress.findMany({
    where: {
      userId: input.userId,
      lessonId: {
        in: lessonIds,
      },
    },
  });
  const existingByLessonId = new Map(
    existingRows
      .filter((row) => Boolean(row.lessonId))
      .map((row) => [row.lessonId as string, row]),
  );

  for (const lesson of input.state.lessons) {
    const existing = existingByLessonId.get(lesson.lessonId);
    const status = statusFromLessonPercent(lesson.percent);
    const percent = clampPercent(lesson.percent);

    if (!existing && percent <= 0) {
      continue;
    }

    if (existing) {
      await input.tx.userProgress.update({
        where: {
          id: existing.id,
        },
        data: {
          status,
          percent,
          startedAt: percent > 0 ? existing.startedAt ?? input.now : null,
          completedAt: status === "completed" ? input.now : null,
        },
      });
      continue;
    }

    await input.tx.userProgress.create({
      data: {
        userId: input.userId,
        lessonId: lesson.lessonId,
        status,
        percent,
        startedAt: percent > 0 ? input.now : null,
        completedAt: status === "completed" ? input.now : null,
      },
    });
  }
}

async function persistCourseProgressRow(input: {
  tx: Prisma.TransactionClient;
  userId: string;
  course: CourseWithLessons;
  state: ComputedCourseState;
  now: Date;
}) {
  const existing = await input.tx.userProgress.findUnique({
    where: {
      userId_courseId: {
        userId: input.userId,
        courseId: input.course.id,
      },
    },
  });
  const percent = clampPercent(input.state.percent);
  const status = input.state.status;

  if (!existing && percent <= 0) {
    return status;
  }

  if (existing) {
    await input.tx.userProgress.update({
      where: {
        id: existing.id,
      },
      data: {
        status,
        percent,
        startedAt: percent > 0 ? existing.startedAt ?? input.now : null,
        completedAt: status === "completed" ? input.now : null,
      },
    });
    return status;
  }

  await input.tx.userProgress.create({
    data: {
      userId: input.userId,
      courseId: input.course.id,
      status,
      percent,
      startedAt: percent > 0 ? input.now : null,
      completedAt: status === "completed" ? input.now : null,
    },
  });

  return status;
}

async function ensureCourseCertificate(input: {
  tx: Prisma.TransactionClient;
  userId: string;
  courseId: string;
  courseSlug: string;
  certificateEligible: boolean;
}): Promise<{ issued: boolean; code: string | null }> {
  if (!input.certificateEligible) {
    return {
      issued: false,
      code: null,
    };
  }

  const existing = await input.tx.certificate.findUnique({
    where: {
      userId_courseId: {
        userId: input.userId,
        courseId: input.courseId,
      },
    },
  });
  if (existing) {
    return {
      issued: false,
      code: existing.certificateCode,
    };
  }

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const certificateCode = generateCertificateCode();
    try {
      await input.tx.certificate.create({
        data: {
          userId: input.userId,
          courseId: input.courseId,
          status: "active",
          certificateCode,
          metadataJson: {
            issuedBy: "auto_course_completion",
            courseSlug: input.courseSlug,
          },
          events: {
            create: {
              actorUserId: null,
              actorRole: null,
              eventType: "issued",
              nextCode: certificateCode,
              reason: "Emision automatica por regla de completitud.",
            },
          },
        },
      });
      return {
        issued: true,
        code: certificateCode,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Unable to generate unique certificate code.");
}

async function recalculateAndPersistProgress(input: {
  tx: Prisma.TransactionClient;
  userId: string;
  course: CourseWithLessons;
  now: Date;
}) {
  const state = await getCurrentCourseState({
    tx: input.tx,
    userId: input.userId,
    course: input.course,
  });

  await persistLessonProgressRows({
    tx: input.tx,
    userId: input.userId,
    course: input.course,
    state,
    now: input.now,
  });
  const courseStatus = await persistCourseProgressRow({
    tx: input.tx,
    userId: input.userId,
    course: input.course,
    state,
    now: input.now,
  });

  let certificateIssued = false;
  let certificateCode: string | null = null;
  if (courseStatus === "completed") {
    const certificate = await ensureCourseCertificate({
      tx: input.tx,
      userId: input.userId,
      courseId: input.course.id,
      courseSlug: input.course.slug,
      certificateEligible: input.course.certificateEligible,
    });
    certificateIssued = certificate.issued;
    certificateCode = certificate.code;
  }

  return {
    state,
    courseStatus,
    certificateIssued,
    certificateCode,
  };
}

function canEditLessonProgress(status: ComputedLessonState["status"]) {
  return status === "active" || status === "done";
}

export async function completeLessonByCourseAndLessonSlug(input: {
  userId: string;
  courseSlug: string;
  lessonSlug: string;
}): Promise<LessonProgressResult> {
  assertDatabaseConfigured();

  return db.$transaction(async (tx) => {
    const course = await loadCourseForProgress(tx, input.courseSlug);
    if (!course || course.courseLessons.length === 0) {
      return {
        ok: false,
        message: "Curso no encontrado.",
      } satisfies LessonProgressResult;
    }

    const targetLesson = course.courseLessons.find(
      (courseLesson) => courseLesson.lesson.slug === input.lessonSlug,
    );
    if (!targetLesson) {
      return {
        ok: false,
        message: "Leccion no pertenece al curso.",
      } satisfies LessonProgressResult;
    }

    const currentState = await getCurrentCourseState({
      tx,
      userId: input.userId,
      course,
    });
    const targetLessonState = currentState.lessons.find(
      (lesson) => lesson.lessonId === targetLesson.lesson.id,
    );
    if (!targetLessonState) {
      return {
        ok: false,
        message: "Leccion no pertenece al curso.",
      } satisfies LessonProgressResult;
    }

    if (!canEditLessonProgress(targetLessonState.status)) {
      return {
        ok: false,
        message: "Debes completar la leccion activa antes de avanzar.",
      } satisfies LessonProgressResult;
    }

    const checklist = parseLessonChecklistSteps(targetLesson.lesson.steps);
    const now = new Date();

    if (checklist.length > 0) {
      await tx.userLessonStepProgress.createMany({
        data: checklist.map((_label, stepIndex) => ({
          userId: input.userId,
          lessonId: targetLesson.lesson.id,
          stepIndex,
        })),
        skipDuplicates: true,
      });
    } else {
      await tx.userProgress.upsert({
        where: {
          userId_lessonId: {
            userId: input.userId,
            lessonId: targetLesson.lesson.id,
          },
        },
        update: {
          status: "completed",
          percent: 100,
          startedAt: now,
          completedAt: now,
        },
        create: {
          userId: input.userId,
          lessonId: targetLesson.lesson.id,
          status: "completed",
          percent: 100,
          startedAt: now,
          completedAt: now,
        },
      });
    }

    const result = await recalculateAndPersistProgress({
      tx,
      userId: input.userId,
      course,
      now,
    });

    return {
      ok: true,
      message: "Progreso actualizado.",
      courseSlug: course.slug,
      lessonSlug: targetLesson.lesson.slug,
      nextLessonSlug: result.state.nextLessonSlug,
      resumeLessonSlug: result.state.resumeLessonSlug,
      resumeStepIndex: result.state.resumeStepIndex,
      percent: result.state.percent,
      status: result.courseStatus,
      certificateIssued: result.certificateIssued,
      certificateCode: result.certificateCode,
    } satisfies LessonProgressResult;
  });
}

export async function setLessonStepProgress(input: {
  userId: string;
  courseSlug: string;
  lessonSlug: string;
  stepIndex: number;
  completed: boolean;
}): Promise<LessonProgressResult> {
  assertDatabaseConfigured();

  return db.$transaction(async (tx) => {
    const course = await loadCourseForProgress(tx, input.courseSlug);
    if (!course || course.courseLessons.length === 0) {
      return {
        ok: false,
        message: "Curso no encontrado.",
      } satisfies LessonProgressResult;
    }

    const targetLesson = course.courseLessons.find(
      (courseLesson) => courseLesson.lesson.slug === input.lessonSlug,
    );
    if (!targetLesson) {
      return {
        ok: false,
        message: "Leccion no pertenece al curso.",
      } satisfies LessonProgressResult;
    }

    const checklist = parseLessonChecklistSteps(targetLesson.lesson.steps);
    if (checklist.length === 0) {
      return {
        ok: false,
        message: "La leccion no tiene checklist configurable.",
      } satisfies LessonProgressResult;
    }
    if (input.stepIndex < 0 || input.stepIndex >= checklist.length) {
      return {
        ok: false,
        message: "Paso de checklist invalido.",
      } satisfies LessonProgressResult;
    }

    const currentState = await getCurrentCourseState({
      tx,
      userId: input.userId,
      course,
    });
    const targetLessonState = currentState.lessons.find(
      (lesson) => lesson.lessonId === targetLesson.lesson.id,
    );
    if (!targetLessonState) {
      return {
        ok: false,
        message: "Leccion no pertenece al curso.",
      } satisfies LessonProgressResult;
    }
    if (!canEditLessonProgress(targetLessonState.status)) {
      return {
        ok: false,
        message: "Debes completar la leccion activa antes de avanzar.",
      } satisfies LessonProgressResult;
    }

    if (input.completed) {
      await tx.userLessonStepProgress.upsert({
        where: {
          userId_lessonId_stepIndex: {
            userId: input.userId,
            lessonId: targetLesson.lesson.id,
            stepIndex: input.stepIndex,
          },
        },
        update: {
          completedAt: new Date(),
        },
        create: {
          userId: input.userId,
          lessonId: targetLesson.lesson.id,
          stepIndex: input.stepIndex,
        },
      });
    } else {
      await tx.userLessonStepProgress.deleteMany({
        where: {
          userId: input.userId,
          lessonId: targetLesson.lesson.id,
          stepIndex: input.stepIndex,
        },
      });
    }

    const now = new Date();
    const result = await recalculateAndPersistProgress({
      tx,
      userId: input.userId,
      course,
      now,
    });

    return {
      ok: true,
      message: input.completed ? "Paso marcado." : "Paso desmarcado.",
      courseSlug: course.slug,
      lessonSlug: targetLesson.lesson.slug,
      nextLessonSlug: result.state.nextLessonSlug,
      resumeLessonSlug: result.state.resumeLessonSlug,
      resumeStepIndex: result.state.resumeStepIndex,
      percent: result.state.percent,
      status: result.courseStatus,
      certificateIssued: result.certificateIssued,
      certificateCode: result.certificateCode,
    } satisfies LessonProgressResult;
  });
}
