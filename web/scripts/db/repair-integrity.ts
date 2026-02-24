import { rm } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { buildIntegrityReport } from "./integrity-core";

function isApplyMode() {
  return process.argv.includes("--apply");
}

function toPublicAbsolutePath(mediaPath: string) {
  return path.join(process.cwd(), "public", mediaPath.replace(/^\//, ""));
}

async function main() {
  const prisma = new PrismaClient();
  const apply = isApplyMode();

  try {
    const report = await buildIntegrityReport(prisma);
    const actions = {
      deleteOrphanMediaLinks: report.details.orphanMediaLinks.map((row) => row.id),
      deleteOrphanCitationLinks: report.details.orphanCitationLinks.map((row) => row.id),
      deleteInvalidStepProgressRows: report.details.invalidStepProgressRows.map((row) => row.id),
      deleteOrphanMediaRecords: report.details.orphanMediaRecords.map((row) => ({
        id: row.id,
        url: row.url,
        provider: row.provider,
      })),
      normalizeCertificateState: report.details.certificateIssues,
      normalizeUserProgressPercent: report.details.invalidUserProgressRows
        .filter((row) => row.reason === "percent_out_of_range")
        .map((row) => row.id),
      deleteUserProgressMissingTarget: report.details.invalidUserProgressRows
        .filter((row) => row.reason === "missing_target")
        .map((row) => row.id),
      manualReviewUserProgressDualTarget: report.details.invalidUserProgressRows
        .filter((row) => row.reason === "dual_target")
        .map((row) => row.id),
    };

    if (!apply) {
      console.log(
        JSON.stringify(
          {
            mode: "dry-run",
            message: "No changes were applied. Re-run with --apply to persist safe fixes.",
            actions,
          },
          null,
          2,
        ),
      );
      return;
    }

    if (actions.deleteOrphanMediaLinks.length > 0) {
      await prisma.mediaLink.deleteMany({
        where: {
          id: {
            in: actions.deleteOrphanMediaLinks,
          },
        },
      });
    }

    if (actions.deleteOrphanCitationLinks.length > 0) {
      await prisma.citationLink.deleteMany({
        where: {
          id: {
            in: actions.deleteOrphanCitationLinks,
          },
        },
      });
    }

    if (actions.deleteInvalidStepProgressRows.length > 0) {
      await prisma.userLessonStepProgress.deleteMany({
        where: {
          id: {
            in: actions.deleteInvalidStepProgressRows,
          },
        },
      });
    }

    if (actions.normalizeUserProgressPercent.length > 0) {
      const rows = await prisma.userProgress.findMany({
        where: {
          id: {
            in: actions.normalizeUserProgressPercent,
          },
        },
        select: {
          id: true,
          percent: true,
        },
      });

      for (const row of rows) {
        const normalized = Math.max(0, Math.min(100, row.percent));
        await prisma.userProgress.update({
          where: {
            id: row.id,
          },
          data: {
            percent: normalized,
          },
        });
      }
    }

    if (actions.deleteUserProgressMissingTarget.length > 0) {
      await prisma.userProgress.deleteMany({
        where: {
          id: {
            in: actions.deleteUserProgressMissingTarget,
          },
        },
      });
    }

    for (const issue of actions.normalizeCertificateState) {
      if (issue.reason === "revoked_without_timestamp") {
        await prisma.certificate.update({
          where: {
            id: issue.id,
          },
          data: {
            revokedAt: new Date(),
          },
        });
      } else if (issue.reason === "active_with_revoked_timestamp") {
        await prisma.certificate.update({
          where: {
            id: issue.id,
          },
          data: {
            revokedAt: null,
            revokedReason: null,
          },
        });
      }
    }

    for (const media of actions.deleteOrphanMediaRecords) {
      await prisma.media.deleteMany({
        where: {
          id: media.id,
          mediaLinks: {
            none: {},
          },
        },
      });

      if (media.provider === "other" && media.url.startsWith("/media/")) {
        await rm(toPublicAbsolutePath(media.url), { force: true }).catch(() => undefined);
      }
    }

    const after = await buildIntegrityReport(prisma);
    console.log(
      JSON.stringify(
        {
          mode: "apply",
          applied: true,
          actions,
          remainingSummary: after.summary,
          manualReviewUserProgressDualTarget: actions.manualReviewUserProgressDualTarget,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
