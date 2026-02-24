import { db } from "@/lib/db";

type SearchEntry = {
  slug: string;
  title: string;
  summary: string;
  href: string;
};

type LessonSearchEntry = {
  slug: string;
  title: string;
  summary: string;
  courseSlug: string;
  courseTitle: string;
  href: string;
};

export type GlobalSearchResult = {
  query: string;
  elapsedMs: number;
  styles: SearchEntry[];
  moves: SearchEntry[];
  courses: SearchEntry[];
  lessons: LessonSearchEntry[];
  totalHits: number;
};

function assertDatabaseConfigured() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required. Configure web/.env before using DB repositories.");
  }
}

function normalizeQuery(rawValue?: string) {
  return (rawValue ?? "").trim().toLowerCase();
}

export async function searchGlobalCatalog(
  rawQuery?: string,
  options?: {
    limitPerEntity?: number;
  },
): Promise<GlobalSearchResult> {
  assertDatabaseConfigured();
  const query = normalizeQuery(rawQuery);
  const startedAt = Date.now();
  const limitPerEntity = Math.max(1, Math.min(20, options?.limitPerEntity ?? 6));

  if (!query) {
    return {
      query: "",
      elapsedMs: Date.now() - startedAt,
      styles: [],
      moves: [],
      courses: [],
      lessons: [],
      totalHits: 0,
    };
  }

  const [styles, moves, courses, lessons] = await Promise.all([
    db.style.findMany({
      where: {
        isArchived: false,
        publishedStatus: "published",
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { slug: { contains: query, mode: "insensitive" } },
          { summary: { contains: query, mode: "insensitive" } },
          { categoryPrimary: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        slug: true,
        name: true,
        summary: true,
      },
      orderBy: {
        name: "asc",
      },
      take: limitPerEntity,
    }),
    db.move.findMany({
      where: {
        isArchived: false,
        publishedStatus: "published",
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { slug: { contains: query, mode: "insensitive" } },
          { summary: { contains: query, mode: "insensitive" } },
          { family: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        slug: true,
        name: true,
        summary: true,
      },
      orderBy: {
        name: "asc",
      },
      take: limitPerEntity,
    }),
    db.course.findMany({
      where: {
        publishedStatus: "published",
        courseLessons: {
          some: {
            lesson: {
              publishedStatus: "published",
            },
          },
        },
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { slug: { contains: query, mode: "insensitive" } },
          { summary: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        slug: true,
        title: true,
        summary: true,
      },
      orderBy: {
        title: "asc",
      },
      take: limitPerEntity,
    }),
    db.lesson.findMany({
      where: {
        publishedStatus: "published",
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { slug: { contains: query, mode: "insensitive" } },
          { objective: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        slug: true,
        title: true,
        objective: true,
        courseLessons: {
          where: {
            course: {
              publishedStatus: "published",
              courseLessons: {
                some: {
                  lesson: {
                    publishedStatus: "published",
                  },
                },
              },
            },
          },
          select: {
            course: {
              select: {
                slug: true,
                title: true,
              },
            },
          },
          orderBy: {
            orderIndex: "asc",
          },
          take: 1,
        },
      },
      orderBy: {
        title: "asc",
      },
      take: limitPerEntity * 2,
    }),
  ]);

  const mappedStyles: SearchEntry[] = styles.map((row) => ({
    slug: row.slug,
    title: row.name,
    summary: row.summary,
    href: `/styles/${row.slug}`,
  }));
  const mappedMoves: SearchEntry[] = moves.map((row) => ({
    slug: row.slug,
    title: row.name,
    summary: row.summary,
    href: `/moves/${row.slug}`,
  }));
  const mappedCourses: SearchEntry[] = courses.map((row) => ({
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    href: `/learn/${row.slug}`,
  }));

  const mappedLessons: LessonSearchEntry[] = lessons
    .filter((row) => row.courseLessons.length > 0)
    .slice(0, limitPerEntity)
    .map((row) => {
      const relation = row.courseLessons[0];
      const courseSlug = relation?.course.slug ?? "";
      const courseTitle = relation?.course.title ?? "";
      return {
        slug: row.slug,
        title: row.title,
        summary: row.objective,
        courseSlug,
        courseTitle,
        href: `/learn/${courseSlug}?lesson=${encodeURIComponent(row.slug)}`,
      };
    });

  return {
    query,
    elapsedMs: Date.now() - startedAt,
    styles: mappedStyles,
    moves: mappedMoves,
    courses: mappedCourses,
    lessons: mappedLessons,
    totalHits:
      mappedStyles.length +
      mappedMoves.length +
      mappedCourses.length +
      mappedLessons.length,
  };
}
