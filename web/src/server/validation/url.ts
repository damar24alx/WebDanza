const HTTP_PROTOCOLS = new Set(["http:", "https:"]);
const LOCAL_BASE_URL = "http://localhost";
const INTERNAL_MEDIA_PREFIX = "/media/";

export function normalizeOptionalHttpUrl(
  rawValue: string | undefined,
): string | null | undefined {
  const value = (rawValue ?? "").trim();
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);
    if (!HTTP_PROTOCOLS.has(parsed.protocol)) {
      return undefined;
    }
    return parsed.toString();
  } catch {
    return undefined;
  }
}

export function normalizeInternalMediaPath(
  rawValue: string | undefined,
): string | undefined {
  const value = (rawValue ?? "").trim();
  if (!value) {
    return undefined;
  }

  if (!value.startsWith("/")) {
    return undefined;
  }

  if (value.includes("\\") || value.includes("..")) {
    return undefined;
  }

  try {
    const parsed = new URL(value, LOCAL_BASE_URL);
    if (parsed.origin !== LOCAL_BASE_URL) {
      return undefined;
    }

    if (!parsed.pathname.startsWith(INTERNAL_MEDIA_PREFIX)) {
      return undefined;
    }

    if (parsed.hash) {
      return undefined;
    }

    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return undefined;
  }
}
