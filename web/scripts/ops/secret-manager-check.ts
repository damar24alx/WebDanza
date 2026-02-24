import { writeFile } from "node:fs/promises";
import path from "node:path";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { loadEnvFile } from "./_load-env";

type SecretSource = "env" | "aws-secrets-manager";

type SecretCheckResult = {
  source: SecretSource;
  checkedAt: string;
  requiredKeys: string[];
  missingKeys: string[];
  availableKeys: string[];
  ok: boolean;
};

const DEFAULT_REQUIRED_KEYS_DEV = ["DATABASE_URL"];
const DEFAULT_REQUIRED_KEYS_PROD = ["AUTH_SECRET", "DATABASE_URL"];

function parseSecretSource(): SecretSource {
  const raw = (process.env.SECRET_MANAGER_PROVIDER ?? "env").trim().toLowerCase();
  return raw === "aws-secrets-manager" ? "aws-secrets-manager" : "env";
}

function parseRequiredKeys() {
  const raw = process.env.SECRET_MANAGER_REQUIRED_KEYS?.trim();
  if (!raw) {
    const isProduction = process.env.NODE_ENV === "production";
    return isProduction ? DEFAULT_REQUIRED_KEYS_PROD : DEFAULT_REQUIRED_KEYS_DEV;
  }

  const parsed = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (parsed.length > 0) {
    return parsed;
  }

  const isProduction = process.env.NODE_ENV === "production";
  return isProduction ? DEFAULT_REQUIRED_KEYS_PROD : DEFAULT_REQUIRED_KEYS_DEV;
}

function parseJsonSecretPayload(value: string) {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function readAwsSecrets(requiredKeys: string[]) {
  const region = process.env.AWS_REGION?.trim();
  const secretId = process.env.SECRET_MANAGER_AWS_SECRET_ID?.trim();
  if (!region || !secretId) {
    throw new Error(
      "AWS secret manager requiere AWS_REGION y SECRET_MANAGER_AWS_SECRET_ID configurados.",
    );
  }

  const client = new SecretsManagerClient({ region });
  const response = await client.send(
    new GetSecretValueCommand({
      SecretId: secretId,
    }),
  );

  const secretString = response.SecretString?.trim();
  if (!secretString) {
    throw new Error("SecretString vacio en AWS Secrets Manager.");
  }

  const payload = parseJsonSecretPayload(secretString);
  if (!payload) {
    throw new Error("El secreto AWS debe ser JSON (key/value).");
  }

  const availableKeys = Object.keys(payload).sort();
  const missingKeys = requiredKeys.filter((key) => !(key in payload));
  return {
    availableKeys,
    missingKeys,
  };
}

function readEnvSecrets(requiredKeys: string[]) {
  const availableKeys = requiredKeys.filter((key) => Boolean(process.env[key]?.trim()));
  const missingKeys = requiredKeys.filter((key) => !process.env[key]?.trim());
  return {
    availableKeys,
    missingKeys,
  };
}

async function writeSecretCheckReport(result: SecretCheckResult) {
  const date = result.checkedAt.slice(0, 10);
  const reportPath = path.resolve(
    process.cwd(),
    "..",
    "docs",
    `PRODUCTION_SECRET_MANAGER_CHECK_${date}.md`,
  );

  const markdown = [
    `# Secret Manager Check - ${date}`,
    "",
    `Fecha/Hora: ${result.checkedAt}`,
    `Fuente: ${result.source}`,
    `Estado: ${result.ok ? "OK" : "FAILED"}`,
    "",
    "## Claves requeridas",
    "",
    ...result.requiredKeys.map((key) => `- ${key}`),
    "",
    "## Claves disponibles",
    "",
    ...(result.availableKeys.length
      ? result.availableKeys.map((key) => `- ${key}`)
      : ["- Ninguna"]),
    "",
    "## Claves faltantes",
    "",
    ...(result.missingKeys.length
      ? result.missingKeys.map((key) => `- ${key}`)
      : ["- Ninguna"]),
    "",
  ].join("\n");

  await writeFile(reportPath, markdown, "utf8");
  return reportPath;
}

async function main() {
  loadEnvFile();

  const source = parseSecretSource();
  const requiredKeys = parseRequiredKeys();

  const now = new Date().toISOString();
  const resolved =
    source === "aws-secrets-manager"
      ? await readAwsSecrets(requiredKeys)
      : readEnvSecrets(requiredKeys);

  const result: SecretCheckResult = {
    source,
    checkedAt: now,
    requiredKeys,
    missingKeys: resolved.missingKeys,
    availableKeys: resolved.availableKeys,
    ok: resolved.missingKeys.length === 0,
  };

  const reportPath = await writeSecretCheckReport(result);
  console.log(
    JSON.stringify(
      {
        ...result,
        reportPath,
      },
      null,
      2,
    ),
  );

  if (!result.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
