import { db } from "@/lib/db";

type AchievementBadgeId = "first_lesson" | "first_course" | "weekly_streak";

export type UserAchievementBadge = {
  id: AchievementBadgeId;
  title: string;
  description: string;
  unlocked: boolean;
  status: string;
  progressPercent: number;
  progressLabel: string;
  unlockedAt: Date | null;
};

export type UserAchievementsSummary = {
  badges: UserAchievementBadge[];
  unlockedCount: number;
  totalCount: number;
  recentUnlocked: UserAchievementBadge[];
  activityDaysLast14: number;
  currentStreakDays: number;
};

function assertDatabaseConfigured() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required. Configure web/.env before using DB repositories.");
  }
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

function toUtcDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function startOfUtcDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function getCurrentStreakFromDates(dateKeys: Set<string>, now: Date) {
  let streak = 0;
  const cursor = startOfUtcDay(now);

  while (dateKeys.has(toUtcDateKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

export async function getUserAchievementsSummary(userId: string): Promise<UserAchievementsSummary> {
  assertDatabaseConfigured();

  const now = new Date();
  const windowStart = startOfUtcDay(now);
  windowStart.setUTCDate(windowStart.getUTCDate() - 13);

  const [firstCompletedLesson, firstCompletedCourse, progressActivity, stepActivity] =
    await Promise.all([
      db.userProgress.findFirst({
        where: {
          userId,
          lessonId: {
            not: null,
          },
          status: "completed",
        },
        orderBy: {
          completedAt: "asc",
        },
        select: {
          completedAt: true,
        },
      }),
      db.userProgress.findFirst({
        where: {
          userId,
          courseId: {
            not: null,
          },
          status: "completed",
        },
        orderBy: {
          completedAt: "asc",
        },
        select: {
          completedAt: true,
        },
      }),
      db.userProgress.findMany({
        where: {
          userId,
          updatedAt: {
            gte: windowStart,
          },
        },
        select: {
          updatedAt: true,
        },
      }),
      db.userLessonStepProgress.findMany({
        where: {
          userId,
          updatedAt: {
            gte: windowStart,
          },
        },
        select: {
          updatedAt: true,
        },
      }),
    ]);

  const activeDateKeys = new Set<string>();
  for (const row of progressActivity) {
    activeDateKeys.add(toUtcDateKey(row.updatedAt));
  }
  for (const row of stepActivity) {
    activeDateKeys.add(toUtcDateKey(row.updatedAt));
  }

  const activityDaysLast14 = activeDateKeys.size;
  const currentStreakDays = getCurrentStreakFromDates(activeDateKeys, now);

  const firstLessonUnlocked = Boolean(firstCompletedLesson?.completedAt);
  const firstCourseUnlocked = Boolean(firstCompletedCourse?.completedAt);
  const weeklyStreakProgress = clampPercent(Math.round((activityDaysLast14 / 7) * 100));
  const weeklyStreakUnlocked = activityDaysLast14 >= 7;

  const badges: UserAchievementBadge[] = [
    {
      id: "first_lesson",
      title: "Primer paso",
      description: "Completa tu primera leccion.",
      unlocked: firstLessonUnlocked,
      status: firstLessonUnlocked ? "Desbloqueado" : "Bloqueado",
      progressPercent: firstLessonUnlocked ? 100 : 0,
      progressLabel: firstLessonUnlocked ? "1/1 leccion" : "0/1 leccion",
      unlockedAt: firstCompletedLesson?.completedAt ?? null,
    },
    {
      id: "first_course",
      title: "Primer curso completado",
      description: "Completa tu primer curso de principio a fin.",
      unlocked: firstCourseUnlocked,
      status: firstCourseUnlocked ? "Desbloqueado" : "Bloqueado",
      progressPercent: firstCourseUnlocked ? 100 : 0,
      progressLabel: firstCourseUnlocked ? "1/1 curso" : "0/1 curso",
      unlockedAt: firstCompletedCourse?.completedAt ?? null,
    },
    {
      id: "weekly_streak",
      title: "Constancia semanal",
      description: "Registra actividad en 7 dias distintos dentro de 14 dias.",
      unlocked: weeklyStreakUnlocked,
      status: weeklyStreakUnlocked ? "Desbloqueado" : "En progreso",
      progressPercent: weeklyStreakProgress,
      progressLabel: `${Math.min(activityDaysLast14, 7)}/7 dias`,
      unlockedAt: null,
    },
  ];

  const recentUnlocked = badges
    .filter((badge) => badge.unlocked)
    .sort((a, b) => {
      const aTime = a.unlockedAt?.getTime() ?? 0;
      const bTime = b.unlockedAt?.getTime() ?? 0;
      return bTime - aTime;
    })
    .slice(0, 3);

  return {
    badges,
    unlockedCount: badges.filter((badge) => badge.unlocked).length,
    totalCount: badges.length,
    recentUnlocked,
    activityDaysLast14,
    currentStreakDays,
  };
}

