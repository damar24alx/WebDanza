import { PrismaClient } from "@prisma/client";

type StyleCoverage = {
  slug: string;
  name: string;
  coursesPublished: number;
  movesPublished: number;
  hasMinimumCourses: boolean;
  hasMinimumMoves: boolean;
};

type MvpContentAuditReport = {
  generatedAt: string;
  strictMode: boolean;
  thresholds: {
    minPublishedStyles: number;
    minCoursesPerStyle: number;
    minMovesPerStyle: number;
  };
  summary: {
    publishedStyles: number;
    stylesMissingCourseThreshold: number;
    stylesMissingMoveThreshold: number;
  };
  details: {
    stylesWithoutCourseThreshold: string[];
    stylesWithoutMoveThreshold: string[];
    coverageByStyle: StyleCoverage[];
  };
};

function readMinThreshold(name: string, fallback: number) {
  const rawValue = process.env[name];
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

async function main() {
  const prisma = new PrismaClient();
  const strictMode = process.argv.includes("--strict");
  const minPublishedStyles = readMinThreshold("MVP_MIN_PUBLISHED_STYLES", 10);
  const minCoursesPerStyle = readMinThreshold("MVP_MIN_COURSES_PER_STYLE", 1);
  const minMovesPerStyle = readMinThreshold("MVP_MIN_MOVES_PER_STYLE", 8);

  try {
    const publishedStyles = await prisma.style.findMany({
      where: {
        isArchived: false,
        publishedStatus: "published",
      },
      select: {
        id: true,
        slug: true,
        name: true,
      },
      orderBy: {
        slug: "asc",
      },
    });

    const [courseCounts, moveCounts] = await Promise.all([
      prisma.course.groupBy({
        by: ["styleId"],
        where: {
          publishedStatus: "published",
          styleId: {
            not: null,
          },
        },
        _count: {
          _all: true,
        },
      }),
      prisma.moveStyle.groupBy({
        by: ["styleId"],
        where: {
          move: {
            isArchived: false,
            publishedStatus: "published",
          },
        },
        _count: {
          moveId: true,
        },
      }),
    ]);

    const courseCountByStyleId = new Map<string, number>();
    for (const row of courseCounts) {
      if (!row.styleId) {
        continue;
      }
      courseCountByStyleId.set(row.styleId, row._count._all);
    }

    const moveCountByStyleId = new Map<string, number>();
    for (const row of moveCounts) {
      moveCountByStyleId.set(row.styleId, row._count.moveId);
    }

    const coverageByStyle = publishedStyles.map((style) => {
      const coursesPublished = courseCountByStyleId.get(style.id) ?? 0;
      const movesPublished = moveCountByStyleId.get(style.id) ?? 0;
      return {
        slug: style.slug,
        name: style.name,
        coursesPublished,
        movesPublished,
        hasMinimumCourses: coursesPublished >= minCoursesPerStyle,
        hasMinimumMoves: movesPublished >= minMovesPerStyle,
      } satisfies StyleCoverage;
    });

    const stylesWithoutCourseThreshold = coverageByStyle
      .filter((item) => !item.hasMinimumCourses)
      .map((item) => item.slug);
    const stylesWithoutMoveThreshold = coverageByStyle
      .filter((item) => !item.hasMinimumMoves)
      .map((item) => item.slug);

    const report: MvpContentAuditReport = {
      generatedAt: new Date().toISOString(),
      strictMode,
      thresholds: {
        minPublishedStyles,
        minCoursesPerStyle,
        minMovesPerStyle,
      },
      summary: {
        publishedStyles: coverageByStyle.length,
        stylesMissingCourseThreshold: stylesWithoutCourseThreshold.length,
        stylesMissingMoveThreshold: stylesWithoutMoveThreshold.length,
      },
      details: {
        stylesWithoutCourseThreshold,
        stylesWithoutMoveThreshold,
        coverageByStyle,
      },
    };

    console.log(JSON.stringify(report, null, 2));

    const failsPublishedStylesGate = coverageByStyle.length < minPublishedStyles;
    const failsCourseCoverageGate = stylesWithoutCourseThreshold.length > 0;
    const failsStrictMoveCoverageGate = strictMode && stylesWithoutMoveThreshold.length > 0;

    if (failsPublishedStylesGate || failsCourseCoverageGate || failsStrictMoveCoverageGate) {
      process.exitCode = 1;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

