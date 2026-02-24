import { PrismaClient } from "@prisma/client";
import { buildIntegrityReport } from "./integrity-core";

async function main() {
  const prisma = new PrismaClient();
  try {
    const report = await buildIntegrityReport(prisma);
    console.log(JSON.stringify(report, null, 2));

    const hasCriticalIssues =
      report.summary.orphanMediaLinks > 0 ||
      report.summary.orphanCitationLinks > 0 ||
      report.summary.invalidUserProgressRows > 0 ||
      report.summary.invalidStepProgressRows > 0;

    if (hasCriticalIssues) {
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
