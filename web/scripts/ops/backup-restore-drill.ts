import { execFile } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { PrismaClient } from "@prisma/client";
import { loadEnvFile } from "./_load-env";

const execFileAsync = promisify(execFile);

type ParsedDbUrl = {
  original: URL;
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
};

type DrillTableCount = {
  table: string;
  sourceCount: number;
  restoredCount: number;
  matches: boolean;
};

type ToolingMode = "local" | "docker" | "sql-clone";

const DEFAULT_DOCKER_CONTAINER = "proyecto-danza-postgres";

const TABLES_TO_COMPARE = [
  "User",
  "Style",
  "Substyle",
  "Move",
  "Lesson",
  "Course",
  "Media",
  "Citation",
  "UserProgress",
  "UserLessonStepProgress",
  "Certificate",
  "CertificateEvent",
] as const;

function parseDatabaseUrl(rawValue: string): ParsedDbUrl {
  const parsed = new URL(rawValue);
  const database = parsed.pathname.replace(/^\//, "").trim();
  if (!database) {
    throw new Error("DATABASE_URL debe incluir nombre de base de datos.");
  }

  return {
    original: parsed,
    host: parsed.hostname,
    port: parsed.port || "5432",
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database,
  };
}

function buildDatabaseUrl(config: ParsedDbUrl, database: string) {
  const url = new URL(config.original.toString());
  url.pathname = `/${database}`;
  return url.toString();
}

function sanitizeDbName(value: string) {
  return value.replace(/[^a-zA-Z0-9_]/g, "_");
}

function buildPgEnv(config: ParsedDbUrl) {
  return {
    ...process.env,
    PGHOST: config.host,
    PGPORT: config.port,
    PGUSER: config.user,
    PGPASSWORD: config.password,
  };
}

function escapeShellArg(value: string) {
  if (!value) {
    return "''";
  }
  return `'${value.replace(/'/g, `'\"'\"'`)}'`;
}

async function runCommand(command: string, args: string[], env: NodeJS.ProcessEnv) {
  try {
    const result = await execFileAsync(command, args, {
      env,
      windowsHide: true,
      maxBuffer: 30 * 1024 * 1024,
    });
    return result;
  } catch (error) {
    const err = error as Error & {
      code?: string | number;
      stderr?: string;
      stdout?: string;
    };
    if (err.code === "ENOENT") {
      throw new Error(`No se encontro el comando '${command}'.`);
    }

    const stderr = err.stderr?.trim();
    const stdout = err.stdout?.trim();
    throw new Error(
      [
        `Fallo ejecutando: ${command} ${args.join(" ")}`,
        stderr ? `stderr: ${stderr}` : "",
        stdout ? `stdout: ${stdout}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }
}

async function canRunCommand(command: string, args: string[] = ["--version"]) {
  try {
    await runCommand(command, args, process.env);
    return true;
  } catch {
    return false;
  }
}

async function detectToolingMode() {
  const hasPgTools = await canRunCommand("pg_dump");
  if (hasPgTools) {
    return "local" as const;
  }

  const hasDocker = await canRunCommand("docker");
  if (hasDocker) {
    return "docker" as const;
  }

  return "sql-clone" as const;
}

function buildDockerExecArgs(
  container: string,
  pgPassword: string,
  command: string,
  args: string[],
) {
  const commandLine = [command, ...args.map((arg) => escapeShellArg(arg))].join(" ");
  return [
    "exec",
    "-e",
    `PGPASSWORD=${pgPassword}`,
    container,
    "sh",
    "-lc",
    commandLine,
  ];
}

async function runPgTool(
  mode: ToolingMode,
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv,
  dockerContainer: string,
  parsedDbUrl: ParsedDbUrl,
) {
  if (mode === "sql-clone") {
    throw new Error("runPgTool no aplica para modo sql-clone.");
  }

  if (mode === "local") {
    return runCommand(command, args, env);
  }

  const dockerArgs = buildDockerExecArgs(
    dockerContainer,
    parsedDbUrl.password,
    command,
    args,
  );
  return runCommand("docker", dockerArgs, process.env);
}

function quoteIdent(value: string) {
  return `"${value.replace(/"/g, "\"\"")}"`;
}

async function cloneDatabaseWithSqlTemplate(input: {
  sourceDbName: string;
  restoreDbName: string;
  parsedDb: ParsedDbUrl;
}) {
  const adminDbName = process.env.BACKUP_DRILL_ADMIN_DB?.trim() || "postgres";
  const adminUrl = buildDatabaseUrl(input.parsedDb, adminDbName);
  const adminPrisma = new PrismaClient({
    datasources: {
      db: {
        url: adminUrl,
      },
    },
  });

  try {
    await adminPrisma.$executeRawUnsafe(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
      input.restoreDbName,
    );
    await adminPrisma.$executeRawUnsafe(
      `DROP DATABASE IF EXISTS ${quoteIdent(input.restoreDbName)}`,
    );
    await adminPrisma.$executeRawUnsafe(
      `CREATE DATABASE ${quoteIdent(input.restoreDbName)} WITH TEMPLATE ${quoteIdent(input.sourceDbName)} OWNER ${quoteIdent(input.parsedDb.user)}`,
    );
  } finally {
    await adminPrisma.$disconnect();
  }
}

async function dropDatabaseViaSql(input: { restoreDbName: string; parsedDb: ParsedDbUrl }) {
  const adminDbName = process.env.BACKUP_DRILL_ADMIN_DB?.trim() || "postgres";
  const adminUrl = buildDatabaseUrl(input.parsedDb, adminDbName);
  const adminPrisma = new PrismaClient({
    datasources: {
      db: {
        url: adminUrl,
      },
    },
  });

  try {
    await adminPrisma.$executeRawUnsafe(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
      input.restoreDbName,
    );
    await adminPrisma.$executeRawUnsafe(
      `DROP DATABASE IF EXISTS ${quoteIdent(input.restoreDbName)}`,
    );
  } finally {
    await adminPrisma.$disconnect();
  }
}

async function getTableCounts(databaseUrl: string) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  try {
    const counts = new Map<string, number>();
    for (const table of TABLES_TO_COMPARE) {
      const rows = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
        `SELECT COUNT(*)::int AS count FROM "${table}"`,
      );
      counts.set(table, rows[0]?.count ?? 0);
    }
    return counts;
  } finally {
    await prisma.$disconnect();
  }
}

async function writeDrillReport(input: {
  startedAt: string;
  finishedAt: string;
  sourceDatabase: string;
  restoreDatabase: string;
  backupFile: string;
  mode: ToolingMode;
  tableCounts: DrillTableCount[];
  ok: boolean;
}) {
  const date = input.finishedAt.slice(0, 10);
  const reportPath = path.resolve(
    process.cwd(),
    "..",
    "docs",
    `PRODUCTION_BACKUP_RESTORE_DRILL_${date}.md`,
  );

  const lines = [
    `# Backup Restore Drill - ${date}`,
    "",
    `Inicio: ${input.startedAt}`,
    `Fin: ${input.finishedAt}`,
    `Modo tooling: ${input.mode}`,
    `Source DB: ${input.sourceDatabase}`,
    `Restore DB: ${input.restoreDatabase}`,
    `Backup file: ${input.backupFile}`,
    `Estado: ${input.ok ? "PASS" : "FAIL"}`,
    "",
    "## Conteos comparados",
    "",
    "| Tabla | Source | Restore | Match |",
    "|---|---:|---:|---|",
    ...input.tableCounts.map(
      (row) =>
        `| ${row.table} | ${row.sourceCount} | ${row.restoredCount} | ${row.matches ? "YES" : "NO"} |`,
    ),
    "",
  ];

  await writeFile(reportPath, lines.join("\n"), "utf8");
  return reportPath;
}

async function main() {
  loadEnvFile();
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL es requerido.");
  }

  const parsed = parseDatabaseUrl(databaseUrl);
  const pgEnv = buildPgEnv(parsed);
  const toolingMode = await detectToolingMode();
  const dockerContainer =
    process.env.BACKUP_DRILL_DOCKER_CONTAINER?.trim() || DEFAULT_DOCKER_CONTAINER;

  const startedAt = new Date().toISOString();
  const dateStamp = startedAt.replace(/[:.]/g, "-");
  const backupDir = path.resolve(process.cwd(), ".tmp", "backup-drills");
  await mkdir(backupDir, { recursive: true });

  const sourceDbName = parsed.database;
  const restoreDbName = sanitizeDbName(`${sourceDbName}_restore_drill_${Date.now()}`);
  const hostBackupFilePath = path.join(
    backupDir,
    `${sanitizeDbName(sourceDbName)}-${dateStamp}.dump`,
  );
  const containerBackupFilePath = `/tmp/${sanitizeDbName(sourceDbName)}-${dateStamp}.dump`;
  const backupFilePath =
    toolingMode === "local"
      ? hostBackupFilePath
      : toolingMode === "docker"
        ? containerBackupFilePath
        : "N/A (sql-clone fallback)";
  const restoreUrl = buildDatabaseUrl(parsed, restoreDbName);

  const sourceCounts = await getTableCounts(databaseUrl);

  if (toolingMode === "sql-clone") {
    await cloneDatabaseWithSqlTemplate({
      sourceDbName,
      restoreDbName,
      parsedDb: parsed,
    });
  } else {
    await runPgTool(
      toolingMode,
      "pg_dump",
      [
        "--format=custom",
        "--no-owner",
        "--no-privileges",
        `--dbname=${databaseUrl}`,
        `--file=${backupFilePath}`,
      ],
      pgEnv,
      dockerContainer,
      parsed,
    );

    await runPgTool(
      toolingMode,
      "dropdb",
      ["--if-exists", restoreDbName],
      pgEnv,
      dockerContainer,
      parsed,
    ).catch(() => undefined);
    await runPgTool(
      toolingMode,
      "createdb",
      [restoreDbName],
      pgEnv,
      dockerContainer,
      parsed,
    );
    await runPgTool(
      toolingMode,
      "pg_restore",
      [
        "--clean",
        "--if-exists",
        "--no-owner",
        "--no-privileges",
        `--dbname=${restoreUrl}`,
        backupFilePath,
      ],
      pgEnv,
      dockerContainer,
      parsed,
    );
  }

  const restoredCounts = await getTableCounts(restoreUrl);

  const tableCounts: DrillTableCount[] = TABLES_TO_COMPARE.map((table) => {
    const sourceCount = sourceCounts.get(table) ?? 0;
    const restoredCount = restoredCounts.get(table) ?? 0;
    return {
      table,
      sourceCount,
      restoredCount,
      matches: sourceCount === restoredCount,
    };
  });

  const ok = tableCounts.every((row) => row.matches);
  const finishedAt = new Date().toISOString();
  const reportPath = await writeDrillReport({
    startedAt,
    finishedAt,
    sourceDatabase: sourceDbName,
    restoreDatabase: restoreDbName,
    backupFile: backupFilePath,
    mode: toolingMode,
    tableCounts,
    ok,
  });

  if (toolingMode === "sql-clone") {
    await dropDatabaseViaSql({
      restoreDbName,
      parsedDb: parsed,
    }).catch(() => undefined);
  } else {
    await runPgTool(
      toolingMode,
      "dropdb",
      ["--if-exists", restoreDbName],
      pgEnv,
      dockerContainer,
      parsed,
    ).catch(() => undefined);
  }

  if (toolingMode === "local") {
    await rm(backupFilePath, { force: true }).catch(() => undefined);
  } else if (toolingMode === "docker") {
    await runPgTool(
      toolingMode,
      "rm",
      ["-f", backupFilePath],
      pgEnv,
      dockerContainer,
      parsed,
    ).catch(() => undefined);
  }

  console.log(
    JSON.stringify(
      {
        ok,
        mode: toolingMode,
        sourceDatabase: sourceDbName,
        restoreDatabase: restoreDbName,
        reportPath,
        mismatches: tableCounts.filter((row) => !row.matches),
      },
      null,
      2,
    ),
  );

  if (!ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
