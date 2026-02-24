import { Difficulty } from "@prisma/client";
import { db } from "@/lib/db";

function assertDatabaseConfigured() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required. Configure web/.env before using DB repositories.");
  }
}

function normalizeLevel(level: Difficulty) {
  if (level === "advanced") {
    return "Advanced";
  }
  if (level === "intermediate") {
    return "Intermediate";
  }

  return "Beginner";
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

export type UserStyleProgressSummary = {
  styleSlug: string;
  styleName: string;
  level: Difficulty;
  coursesTotal: number;
  coursesStarted: number;
  coursesCompleted: number;
  progressPercent: number;
};

export async function getUserDashboardSummary(userId: string) {
  assertDatabaseConfigured();

  const progresses = await db.userProgress.findMany({
    where: {
      userId,
      courseId: {
        not: null,
      },
    },
    include: {
      course: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const certificatesCount = await db.certificate.count({
    where: {
      userId,
      status: "active",
    },
  });

  const activeProgress =
    progresses.find((entry) => entry.status === "in_progress") ??
    progresses.find((entry) => clampPercent(entry.percent) < 100) ??
    null;

  const completedCourses = progresses.filter((entry) => entry.status === "completed");

  const estimatedHoursLearned = Math.round(
    progresses.reduce((sum, entry) => {
      if (!entry.course) {
        return sum;
      }

      return sum + (entry.course.durationHours * clampPercent(entry.percent)) / 100;
    }, 0),
  );

  const currentLevel = completedCourses.length
    ? normalizeLevel(
        completedCourses
          .map((entry) => entry.course?.targetLevel ?? "beginner")
          .sort((a, b) => {
            const order = { beginner: 1, intermediate: 2, advanced: 3 } as const;
            return order[b] - order[a];
          })[0] ?? "beginner",
      )
    : "Beginner";

  return {
    activeCourseSlug: activeProgress?.course?.slug ?? null,
    certificatesCount,
    completedCoursesCount: completedCourses.length,
    estimatedHoursLearned,
    currentLevel,
  };
}

export async function getUserCertificates(userId: string) {
  assertDatabaseConfigured();

  return db.certificate.findMany({
    where: {
      userId,
    },
    include: {
      course: true,
    },
    orderBy: {
      issuedAt: "desc",
    },
  });
}

export async function getCertificateByCode(
  rawCode: string,
  options?: {
    includeRevoked?: boolean;
  },
) {
  assertDatabaseConfigured();

  const code = rawCode.trim();
  if (!code) {
    return null;
  }

  return db.certificate.findFirst({
    where: {
      ...(options?.includeRevoked ? {} : { status: "active" }),
      certificateCode: {
        equals: code,
        mode: "insensitive",
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      course: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
}

export async function getUserStyleProgressSummary(
  userId: string,
): Promise<UserStyleProgressSummary[]> {
  assertDatabaseConfigured();

  const [publishedCourses, userCourseProgress] = await Promise.all([
    db.course.findMany({
      where: {
        publishedStatus: "published",
        styleId: {
          not: null,
        },
      },
      select: {
        id: true,
        style: {
          select: {
            slug: true,
            name: true,
            level: true,
          },
        },
      },
    }),
    db.userProgress.findMany({
      where: {
        userId,
        courseId: {
          not: null,
        },
      },
      select: {
        courseId: true,
        percent: true,
        status: true,
      },
    }),
  ]);

  const progressByCourseId = new Map(
    userCourseProgress
      .filter((row) => Boolean(row.courseId))
      .map((row) => [row.courseId as string, row]),
  );

  const summaryMap = new Map<string, UserStyleProgressSummary>();
  for (const course of publishedCourses) {
    if (!course.style) {
      continue;
    }

    const current =
      summaryMap.get(course.style.slug) ??
      ({
        styleSlug: course.style.slug,
        styleName: course.style.name,
        level: course.style.level,
        coursesTotal: 0,
        coursesStarted: 0,
        coursesCompleted: 0,
        progressPercent: 0,
      } satisfies UserStyleProgressSummary);

    current.coursesTotal += 1;
    const progress = progressByCourseId.get(course.id);
    const percent = clampPercent(progress?.percent ?? 0);
    if (percent > 0) {
      current.coursesStarted += 1;
    }
    if (progress?.status === "completed") {
      current.coursesCompleted += 1;
    }
    current.progressPercent += percent;
    summaryMap.set(course.style.slug, current);
  }

  return Array.from(summaryMap.values())
    .map((row) => ({
      ...row,
      progressPercent:
        row.coursesTotal > 0
          ? clampPercent(Math.round(row.progressPercent / row.coursesTotal))
          : 0,
    }))
    .sort((a, b) => {
      if (b.progressPercent !== a.progressPercent) {
        return b.progressPercent - a.progressPercent;
      }
      return a.styleName.localeCompare(b.styleName, "es");
    });
}
