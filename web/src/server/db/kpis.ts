import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

const KPI_WINDOW_DAYS = 30;
const KPI_CACHE_SECONDS = 24 * 60 * 60;

export type KpiMetric = {
  label: string;
  description: string;
  numerator: number;
  denominator: number;
  valuePercent: number;
  targetPercent: number;
};

export type MvpKpiSnapshot = {
  asOf: string;
  windowDays: number;
  activation24h: KpiMetric;
  retentionWeek1: KpiMetric;
  courseCompletion: KpiMetric;
};

function assertDatabaseConfigured() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required. Configure web/.env before using DB repositories.");
  }
}

function percent(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return 0;
  }

  return Math.round((numerator / denominator) * 1000) / 10;
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function buildMetric(input: {
  label: string;
  description: string;
  numerator: number;
  denominator: number;
  targetPercent: number;
}): KpiMetric {
  return {
    label: input.label,
    description: input.description,
    numerator: input.numerator,
    denominator: input.denominator,
    valuePercent: percent(input.numerator, input.denominator),
    targetPercent: input.targetPercent,
  };
}

async function computeMvpKpisSnapshot(): Promise<MvpKpiSnapshot> {
  const now = new Date();
  const windowStart = addDays(now, -KPI_WINDOW_DAYS);

  const newUsers = await db.user.findMany({
    where: {
      role: "STUDENT",
      createdAt: {
        gte: windowStart,
      },
    },
    select: {
      id: true,
      createdAt: true,
    },
  });

  const userIds = newUsers.map((user) => user.id);

  const [lessonCompletions, progressActivity, stepActivity, courseProgressRows] =
    userIds.length > 0
      ? await Promise.all([
          db.userProgress.findMany({
            where: {
              userId: {
                in: userIds,
              },
              lessonId: {
                not: null,
              },
              status: "completed",
              completedAt: {
                not: null,
              },
            },
            select: {
              userId: true,
              completedAt: true,
            },
            orderBy: {
              completedAt: "asc",
            },
          }),
          db.userProgress.findMany({
            where: {
              userId: {
                in: userIds,
              },
            },
            select: {
              userId: true,
              updatedAt: true,
            },
          }),
          db.userLessonStepProgress.findMany({
            where: {
              userId: {
                in: userIds,
              },
            },
            select: {
              userId: true,
              updatedAt: true,
            },
          }),
          db.userProgress.findMany({
            where: {
              courseId: {
                not: null,
              },
              updatedAt: {
                gte: windowStart,
              },
              percent: {
                gt: 0,
              },
            },
            select: {
              status: true,
              completedAt: true,
            },
          }),
        ])
      : [[], [], [], []];

  const firstLessonCompletionByUser = new Map<string, Date>();
  for (const row of lessonCompletions) {
    if (!row.completedAt) {
      continue;
    }
    if (!firstLessonCompletionByUser.has(row.userId)) {
      firstLessonCompletionByUser.set(row.userId, row.completedAt);
    }
  }

  let activationNumerator = 0;
  for (const user of newUsers) {
    const firstCompletion = firstLessonCompletionByUser.get(user.id);
    if (!firstCompletion) {
      continue;
    }
    if (firstCompletion.getTime() <= addDays(user.createdAt, 1).getTime()) {
      activationNumerator += 1;
    }
  }

  const activityByUser = new Map<string, Date[]>();
  const registerActivity = (userId: string, updatedAt: Date) => {
    const list = activityByUser.get(userId) ?? [];
    list.push(updatedAt);
    activityByUser.set(userId, list);
  };

  for (const event of progressActivity) {
    registerActivity(event.userId, event.updatedAt);
  }
  for (const event of stepActivity) {
    registerActivity(event.userId, event.updatedAt);
  }

  let retentionNumerator = 0;
  for (const user of newUsers) {
    const events = activityByUser.get(user.id) ?? [];
    const retentionStart = addDays(user.createdAt, 1).getTime();
    const retentionEnd = addDays(user.createdAt, 7).getTime();
    const retained = events.some(
      (eventDate) =>
        eventDate.getTime() >= retentionStart && eventDate.getTime() <= retentionEnd,
    );
    if (retained) {
      retentionNumerator += 1;
    }
  }

  const courseStartedDenominator = courseProgressRows.length;
  const courseCompletedNumerator = courseProgressRows.filter(
    (entry) =>
      entry.status === "completed" &&
      Boolean(entry.completedAt) &&
      (entry.completedAt?.getTime() ?? 0) >= windowStart.getTime(),
  ).length;

  return {
    asOf: now.toISOString(),
    windowDays: KPI_WINDOW_DAYS,
    activation24h: buildMetric({
      label: "Activacion 24h",
      description: "Usuarios nuevos que completan su primera leccion en 24 horas.",
      numerator: activationNumerator,
      denominator: newUsers.length,
      targetPercent: 40,
    }),
    retentionWeek1: buildMetric({
      label: "Retencion semana 1",
      description: "Usuarios nuevos con actividad entre dia 2 y dia 7.",
      numerator: retentionNumerator,
      denominator: newUsers.length,
      targetPercent: 25,
    }),
    courseCompletion: buildMetric({
      label: "Completion cursos",
      description: "Cursos iniciados en ventana que alcanzan estado completado.",
      numerator: courseCompletedNumerator,
      denominator: courseStartedDenominator,
      targetPercent: 35,
    }),
  };
}

const getCachedMvpKpisSnapshot = unstable_cache(
  computeMvpKpisSnapshot,
  ["mvp-kpis-v1"],
  {
    revalidate: KPI_CACHE_SECONDS,
  },
);

export async function getMvpKpisSnapshot() {
  assertDatabaseConfigured();
  try {
    return await getCachedMvpKpisSnapshot();
  } catch {
    // Integration tests and non-request contexts may not provide incremental cache.
    return computeMvpKpisSnapshot();
  }
}
