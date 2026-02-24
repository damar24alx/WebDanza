type LogLevel = "info" | "warn" | "error";

const REDACTED_KEYS = [
  "password",
  "passwordhash",
  "token",
  "authorization",
  "cookie",
  "secret",
];

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  info: 1,
  warn: 2,
  error: 3,
};

const alertCooldownByKey = new Map<string, number>();

function shouldRedactKey(key: string) {
  const normalized = key.toLowerCase();
  return REDACTED_KEYS.some((entry) => normalized.includes(entry));
}

function maskEmail(value: string) {
  const [local, domain] = value.split("@");
  if (!local || !domain) {
    return "invalid";
  }

  if (local.length <= 2) {
    return `**@${domain}`;
  }

  return `${local.slice(0, 2)}***@${domain}`;
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    if (value.includes("@")) {
      return maskEmail(value);
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeValue(entry));
  }

  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const target: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(source)) {
      if (shouldRedactKey(key)) {
        target[key] = "[REDACTED]";
      } else {
        target[key] = sanitizeValue(nestedValue);
      }
    }
    return target;
  }

  return value;
}

function parseBooleanEnv(value: string | undefined, fallback: boolean) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }
  if (normalized === "1" || normalized === "true" || normalized === "yes") {
    return true;
  }
  if (normalized === "0" || normalized === "false" || normalized === "no") {
    return false;
  }
  return fallback;
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value?.trim() ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function getAlertMinLevel(): LogLevel {
  const configured = (process.env.OBSERVABILITY_ALERT_MIN_LEVEL ?? "error")
    .trim()
    .toLowerCase();

  if (configured === "warn") {
    return "warn";
  }
  if (configured === "info") {
    return "info";
  }

  return "error";
}

function shouldEmitAlert(level: LogLevel, event: string) {
  if (!process.env.OBSERVABILITY_ALERT_WEBHOOK_URL?.trim()) {
    return false;
  }

  const alertingEnabled = parseBooleanEnv(process.env.OBSERVABILITY_ALERTING_ENABLED, true);
  if (!alertingEnabled) {
    return false;
  }

  const minLevel = getAlertMinLevel();
  if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[minLevel]) {
    return false;
  }

  const allowedEventsRaw = process.env.OBSERVABILITY_ALERT_EVENTS?.trim();
  if (!allowedEventsRaw) {
    return true;
  }

  const allowedEvents = allowedEventsRaw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (allowedEvents.length === 0) {
    return true;
  }

  return allowedEvents.some((candidate) => event.startsWith(candidate));
}

function shouldRateLimitAlert(alertKey: string) {
  const cooldownMs = parsePositiveInt(process.env.OBSERVABILITY_ALERT_COOLDOWN_MS, 120_000);
  const now = Date.now();
  const lastSentAt = alertCooldownByKey.get(alertKey) ?? 0;
  if (now - lastSentAt < cooldownMs) {
    return true;
  }

  alertCooldownByKey.set(alertKey, now);
  return false;
}

async function postJson(
  url: string,
  body: unknown,
  options?: {
    authToken?: string;
    timeoutMs?: number;
  },
) {
  const controller = new AbortController();
  const timeoutMs = options?.timeoutMs ?? 1500;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      "content-type": "application/json",
    };
    if (options?.authToken) {
      headers.authorization = `Bearer ${options.authToken}`;
    }

    await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function forwardLogToCentral(payload: {
  timestamp: string;
  level: LogLevel;
  event: string;
  context: unknown;
}) {
  const endpoint = process.env.OBSERVABILITY_HTTP_ENDPOINT?.trim();
  if (!endpoint) {
    return;
  }

  const service = process.env.OBSERVABILITY_SERVICE_NAME?.trim() || "dance-web";
  const environment = process.env.NODE_ENV || "development";
  const token = process.env.OBSERVABILITY_HTTP_TOKEN?.trim();

  try {
    await postJson(
      endpoint,
      {
        service,
        environment,
        ...payload,
      },
      {
        authToken: token,
        timeoutMs: parsePositiveInt(process.env.OBSERVABILITY_HTTP_TIMEOUT_MS, 1500),
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.warn(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "warn",
        event: "observability.forward.failed",
        context: {
          target: "central",
          reason: message,
        },
      }),
    );
  }
}

async function sendAlert(payload: {
  timestamp: string;
  level: LogLevel;
  event: string;
  context: unknown;
}) {
  const webhookUrl = process.env.OBSERVABILITY_ALERT_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    return;
  }
  if (!shouldEmitAlert(payload.level, payload.event)) {
    return;
  }

  const alertKey = `${payload.level}:${payload.event}`;
  if (shouldRateLimitAlert(alertKey)) {
    return;
  }

  const service = process.env.OBSERVABILITY_SERVICE_NAME?.trim() || "dance-web";
  const environment = process.env.NODE_ENV || "development";
  const token = process.env.OBSERVABILITY_ALERT_WEBHOOK_TOKEN?.trim();

  try {
    await postJson(
      webhookUrl,
      {
        service,
        environment,
        alertKey,
        ...payload,
      },
      {
        authToken: token,
        timeoutMs: parsePositiveInt(process.env.OBSERVABILITY_ALERT_TIMEOUT_MS, 1500),
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.warn(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "warn",
        event: "observability.alert.failed",
        context: {
          target: "alert-webhook",
          reason: message,
          alertKey,
        },
      }),
    );
  }
}

export function logEvent(level: LogLevel, event: string, context: Record<string, unknown> = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    context: sanitizeValue(context),
  };

  const message = JSON.stringify(payload);
  if (level === "error") {
    console.error(message);
  } else if (level === "warn") {
    console.warn(message);
  } else {
    console.log(message);
  }

  void forwardLogToCentral(payload);
  void sendAlert(payload);
}
