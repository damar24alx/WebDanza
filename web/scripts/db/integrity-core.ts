import { access } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

type LinkEntityType = "style" | "substyle" | "move" | "lesson" | "course" | "connection";

type LinkIssue = {
  id: string;
  entityType: LinkEntityType;
  entityId: string;
};

type OrphanMediaRecord = {
  id: string;
  provider: string;
  url: string;
};

type MissingMediaFile = {
  mediaId: string;
  mediaPath: string;
};

type InvalidUserProgress = {
  id: string;
  reason: "missing_target" | "dual_target" | "percent_out_of_range";
  percent: number;
};

type InvalidStepProgress = {
  id: string;
  lessonId: string;
  stepIndex: number;
  reason: "negative_step_index" | "step_out_of_bounds";
};

type CertificateIssue = {
  id: string;
  code: string;
  reason: "revoked_without_timestamp" | "active_with_revoked_timestamp";
};

export type IntegrityReport = {
  generatedAt: string;
  summary: {
    orphanMediaLinks: number;
    orphanCitationLinks: number;
    orphanMediaRecords: number;
    missingInternalMediaFiles: number;
    invalidUserProgressRows: number;
    invalidStepProgressRows: number;
    certificateIssues: number;
  };
  details: {
    orphanMediaLinks: LinkIssue[];
    orphanCitationLinks: LinkIssue[];
    orphanMediaRecords: OrphanMediaRecord[];
    missingInternalMediaFiles: MissingMediaFile[];
    invalidUserProgressRows: InvalidUserProgress[];
    invalidStepProgressRows: InvalidStepProgress[];
    certificateIssues: CertificateIssue[];
  };
};

async function collectEntityIds(prisma: PrismaClient) {
  const [styles, substyles, moves, lessons, courses, connections] = await Promise.all([
    prisma.style.findMany({ select: { id: true } }),
    prisma.substyle.findMany({ select: { id: true } }),
    prisma.move.findMany({ select: { id: true } }),
    prisma.lesson.findMany({ select: { id: true } }),
    prisma.course.findMany({ select: { id: true } }),
    prisma.connection.findMany({ select: { id: true } }),
  ]);

  return {
    style: new Set(styles.map((row) => row.id)),
    substyle: new Set(substyles.map((row) => row.id)),
    move: new Set(moves.map((row) => row.id)),
    lesson: new Set(lessons.map((row) => row.id)),
    course: new Set(courses.map((row) => row.id)),
    connection: new Set(connections.map((row) => row.id)),
  } as const;
}

function isLinkEntityType(value: string): value is LinkEntityType {
  return (
    value === "style" ||
    value === "substyle" ||
    value === "move" ||
    value === "lesson" ||
    value === "course" ||
    value === "connection"
  );
}

function normalizeInternalMediaPath(rawValue: string): string | null {
  const value = rawValue.trim();
  if (!value.startsWith("/media/")) {
    return null;
  }
  if (value.includes("..") || value.includes("\\")) {
    return null;
  }
  return value;
}

function toPublicAbsolutePath(mediaPath: string) {
  return path.join(process.cwd(), "public", mediaPath.replace(/^\//, ""));
}

async function fileExists(absolutePath: string) {
  try {
    await access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

export async function buildIntegrityReport(prisma: PrismaClient): Promise<IntegrityReport> {
  const entityIds = await collectEntityIds(prisma);

  const [mediaLinks, citationLinks] = await Promise.all([
    prisma.mediaLink.findMany({
      select: {
        id: true,
        entityType: true,
        entityId: true,
      },
    }),
    prisma.citationLink.findMany({
      select: {
        id: true,
        entityType: true,
        entityId: true,
      },
    }),
  ]);

  const orphanMediaLinks: LinkIssue[] = [];
  for (const row of mediaLinks) {
    if (!isLinkEntityType(row.entityType)) {
      continue;
    }
    if (!entityIds[row.entityType].has(row.entityId)) {
      orphanMediaLinks.push({
        id: row.id,
        entityType: row.entityType,
        entityId: row.entityId,
      });
    }
  }

  const orphanCitationLinks: LinkIssue[] = [];
  for (const row of citationLinks) {
    if (!isLinkEntityType(row.entityType)) {
      continue;
    }
    if (!entityIds[row.entityType].has(row.entityId)) {
      orphanCitationLinks.push({
        id: row.id,
        entityType: row.entityType,
        entityId: row.entityId,
      });
    }
  }

  const orphanMediaRecords = await prisma.media.findMany({
    where: {
      mediaLinks: {
        none: {},
      },
    },
    select: {
      id: true,
      provider: true,
      url: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const internalMedia = await prisma.media.findMany({
    where: {
      provider: "other",
    },
    select: {
      id: true,
      url: true,
    },
  });

  const missingInternalMediaFiles: MissingMediaFile[] = [];
  for (const media of internalMedia) {
    const mediaPath = normalizeInternalMediaPath(media.url);
    if (!mediaPath) {
      continue;
    }

    const exists = await fileExists(toPublicAbsolutePath(mediaPath));
    if (!exists) {
      missingInternalMediaFiles.push({
        mediaId: media.id,
        mediaPath,
      });
    }
  }

  const rawInvalidProgressRows = await prisma.userProgress.findMany({
    where: {
      OR: [
        {
          lessonId: null,
          courseId: null,
        },
        {
          AND: [
            {
              lessonId: {
                not: null,
              },
            },
            {
              courseId: {
                not: null,
              },
            },
          ],
        },
        {
          percent: {
            lt: 0,
          },
        },
        {
          percent: {
            gt: 100,
          },
        },
      ],
    },
    select: {
      id: true,
      lessonId: true,
      courseId: true,
      percent: true,
    },
  });

  const invalidUserProgressRows: InvalidUserProgress[] = rawInvalidProgressRows.map((row) => {
    if (!row.lessonId && !row.courseId) {
      return {
        id: row.id,
        reason: "missing_target",
        percent: row.percent,
      };
    }

    if (row.lessonId && row.courseId) {
      return {
        id: row.id,
        reason: "dual_target",
        percent: row.percent,
      };
    }

    return {
      id: row.id,
      reason: "percent_out_of_range",
      percent: row.percent,
    };
  });

  const lessonStepRows = await prisma.userLessonStepProgress.findMany({
    include: {
      lesson: {
        select: {
          id: true,
          steps: true,
        },
      },
    },
  });

  const invalidStepProgressRows: InvalidStepProgress[] = [];
  for (const row of lessonStepRows) {
    if (row.stepIndex < 0) {
      invalidStepProgressRows.push({
        id: row.id,
        lessonId: row.lessonId,
        stepIndex: row.stepIndex,
        reason: "negative_step_index",
      });
      continue;
    }

    const steps = Array.isArray(row.lesson.steps) ? row.lesson.steps : [];
    if (steps.length > 0 && row.stepIndex >= steps.length) {
      invalidStepProgressRows.push({
        id: row.id,
        lessonId: row.lessonId,
        stepIndex: row.stepIndex,
        reason: "step_out_of_bounds",
      });
    }
  }

  const revokedWithoutTimestamp = await prisma.certificate.findMany({
    where: {
      status: "revoked",
      revokedAt: null,
    },
    select: {
      id: true,
      certificateCode: true,
    },
  });
  const activeWithRevokedTimestamp = await prisma.certificate.findMany({
    where: {
      status: "active",
      revokedAt: {
        not: null,
      },
    },
    select: {
      id: true,
      certificateCode: true,
    },
  });

  const certificateIssues: CertificateIssue[] = [
    ...revokedWithoutTimestamp.map((row) => ({
      id: row.id,
      code: row.certificateCode,
      reason: "revoked_without_timestamp" as const,
    })),
    ...activeWithRevokedTimestamp.map((row) => ({
      id: row.id,
      code: row.certificateCode,
      reason: "active_with_revoked_timestamp" as const,
    })),
  ];

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      orphanMediaLinks: orphanMediaLinks.length,
      orphanCitationLinks: orphanCitationLinks.length,
      orphanMediaRecords: orphanMediaRecords.length,
      missingInternalMediaFiles: missingInternalMediaFiles.length,
      invalidUserProgressRows: invalidUserProgressRows.length,
      invalidStepProgressRows: invalidStepProgressRows.length,
      certificateIssues: certificateIssues.length,
    },
    details: {
      orphanMediaLinks,
      orphanCitationLinks,
      orphanMediaRecords: orphanMediaRecords.map((row) => ({
        id: row.id,
        provider: row.provider,
        url: row.url,
      })),
      missingInternalMediaFiles,
      invalidUserProgressRows,
      invalidStepProgressRows,
      certificateIssues,
    },
  };
}
