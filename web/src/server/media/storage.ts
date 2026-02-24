import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { normalizeInternalMediaPath } from "@/server/validation/url";
import { logEvent } from "@/server/observability/logger";

const DEFAULT_MAX_UPLOAD_MB = 100;
const MAX_UPLOAD_MB = 1024;
const LOCAL_BASE_URL = "http://localhost";
const ALLOWED_VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".ogg", ".mov", ".m4v"]);
const ALLOWED_VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-m4v",
]);

type MediaStorageMode = "local" | "cloud";

type CloudStorageConfig = {
  endpoint: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
  uploadPrefix: string;
  allowLocalFallback: boolean;
};

export type SaveUploadedMediaResult = {
  ok: true;
  mediaPath: string;
  fileSizeBytes: number;
} | {
  ok: false;
  message: string;
};

export type DeleteMediaResult = {
  ok: true;
} | {
  ok: false;
  message: string;
};

function parseMaxUploadBytes() {
  const rawValue = process.env.MEDIA_UPLOAD_MAX_MB?.trim();
  if (!rawValue) {
    return DEFAULT_MAX_UPLOAD_MB * 1024 * 1024;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > MAX_UPLOAD_MB) {
    return DEFAULT_MAX_UPLOAD_MB * 1024 * 1024;
  }

  return parsed * 1024 * 1024;
}

function sanitizeFilename(rawName: string) {
  const normalized = rawName.trim().toLowerCase();
  const sanitized = normalized.replace(/[^a-z0-9._-]/g, "-");
  return sanitized.replace(/-+/g, "-");
}

function resolveStorageMode(): MediaStorageMode {
  const raw = (process.env.MEDIA_STORAGE_DRIVER ?? "local").trim().toLowerCase();
  if (raw === "s3" || raw === "r2" || raw === "cloud") {
    return "cloud";
  }
  return "local";
}

function cloudStorageConfigured() {
  const endpoint = process.env.MEDIA_CLOUD_ENDPOINT?.trim();
  const bucket = process.env.MEDIA_CLOUD_BUCKET?.trim();
  const region = process.env.MEDIA_CLOUD_REGION?.trim();
  const accessKeyId = process.env.MEDIA_CLOUD_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.MEDIA_CLOUD_SECRET_ACCESS_KEY?.trim();

  return Boolean(endpoint && bucket && region && accessKeyId && secretAccessKey);
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

function getCloudStorageConfig(): CloudStorageConfig | null {
  const endpoint = process.env.MEDIA_CLOUD_ENDPOINT?.trim();
  const bucket = process.env.MEDIA_CLOUD_BUCKET?.trim();
  const region = process.env.MEDIA_CLOUD_REGION?.trim();
  const accessKeyId = process.env.MEDIA_CLOUD_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.MEDIA_CLOUD_SECRET_ACCESS_KEY?.trim();
  const uploadPrefixRaw = process.env.MEDIA_CLOUD_UPLOAD_PREFIX?.trim() || "uploads";
  const uploadPrefix = uploadPrefixRaw.replace(/^\/+|\/+$/g, "");

  if (!endpoint || !bucket || !region || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return {
    endpoint,
    bucket,
    region,
    accessKeyId,
    secretAccessKey,
    forcePathStyle: parseBooleanEnv(process.env.MEDIA_CLOUD_FORCE_PATH_STYLE, true),
    uploadPrefix: uploadPrefix || "uploads",
    allowLocalFallback: parseBooleanEnv(process.env.MEDIA_CLOUD_ALLOW_LOCAL_FALLBACK, true),
  };
}

function createS3Client(config: CloudStorageConfig) {
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

function validateFile(file: File): string | null {
  if (file.size <= 0) {
    return "Debes seleccionar un archivo de video.";
  }

  const maxUploadBytes = parseMaxUploadBytes();
  if (file.size > maxUploadBytes) {
    return `Tamano maximo permitido: ${Math.floor(maxUploadBytes / (1024 * 1024))}MB.`;
  }

  const originalName = sanitizeFilename(file.name || "upload.mp4");
  const extension = path.extname(originalName);

  if (!ALLOWED_VIDEO_EXTENSIONS.has(extension)) {
    return "Formato de archivo no permitido. Usa mp4, webm, ogg, mov o m4v.";
  }

  if (file.type && !ALLOWED_VIDEO_MIME_TYPES.has(file.type)) {
    return "Tipo MIME no permitido para video.";
  }

  return null;
}

function buildStorageTarget(rawName: string) {
  const originalName = sanitizeFilename(rawName || "upload.mp4");
  const extension = path.extname(originalName) || ".mp4";
  const baseName = path.basename(originalName, extension).slice(0, 80) || "video";
  const now = new Date();
  const yyyy = now.getUTCFullYear().toString();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const fileName = `${baseName}-${randomUUID()}${extension}`;
  const relativePath = `/media/uploads/${yyyy}/${mm}/${fileName}`;
  const mediaPath = normalizeInternalMediaPath(relativePath);
  if (!mediaPath) {
    return null;
  }

  const absolutePath = path.join(process.cwd(), "public", mediaPath.replace(/^\//, ""));
  return {
    mediaPath,
    absolutePath,
    uploadDir: path.dirname(absolutePath),
  };
}

async function saveToLocalStorage(file: File): Promise<SaveUploadedMediaResult> {
  const target = buildStorageTarget(file.name);
  if (!target) {
    return {
      ok: false,
      message: "No se pudo generar ruta de media valida.",
    };
  }

  try {
    await mkdir(target.uploadDir, { recursive: true });
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(target.absolutePath, bytes);
    return {
      ok: true,
      mediaPath: target.mediaPath,
      fileSizeBytes: file.size,
    };
  } catch {
    return {
      ok: false,
      message: "No se pudo guardar el archivo en storage local.",
    };
  }
}

function toCloudObjectKey(mediaPath: string, uploadPrefix: string) {
  const normalized = normalizeInternalMediaPath(mediaPath);
  if (!normalized) {
    return null;
  }

  const uploadsSegment = "/media/uploads/";
  if (normalized.startsWith(uploadsSegment)) {
    return `${uploadPrefix}/${normalized.slice(uploadsSegment.length)}`;
  }

  const mediaPrefix = "/media/";
  if (normalized.startsWith(mediaPrefix)) {
    return `${uploadPrefix}/${normalized.slice(mediaPrefix.length)}`;
  }

  return null;
}

async function saveToCloudStorage(
  file: File,
  config: CloudStorageConfig,
): Promise<SaveUploadedMediaResult> {
  const target = buildStorageTarget(file.name);
  if (!target) {
    return {
      ok: false,
      message: "No se pudo generar ruta de media valida.",
    };
  }

  const objectKey = toCloudObjectKey(target.mediaPath, config.uploadPrefix);
  if (!objectKey) {
    return {
      ok: false,
      message: "No se pudo generar clave de objeto cloud.",
    };
  }

  try {
    const client = createS3Client(config);
    const body = Buffer.from(await file.arrayBuffer());
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: objectKey,
        Body: body,
        ContentType: file.type || "application/octet-stream",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );

    return {
      ok: true,
      mediaPath: target.mediaPath,
      fileSizeBytes: file.size,
    };
  } catch {
    return {
      ok: false,
      message: "No se pudo guardar el archivo en storage cloud.",
    };
  }
}

async function saveToCloudStorageWithFallback(file: File): Promise<SaveUploadedMediaResult> {
  const config = getCloudStorageConfig();
  if (!config || !cloudStorageConfigured()) {
    logEvent("warn", "media.storage.cloud_fallback_local", {
      reason: "missing_cloud_configuration",
    });
    return saveToLocalStorage(file);
  }

  const saved = await saveToCloudStorage(file, config);
  if (saved.ok) {
    return saved;
  }

  if (!config.allowLocalFallback) {
    return saved;
  }

  logEvent("warn", "media.storage.cloud_error_fallback_local", {
    reason: saved.message,
  });
  return saveToLocalStorage(file);
}

export async function saveUploadedMedia(file: File): Promise<SaveUploadedMediaResult> {
  const validationError = validateFile(file);
  if (validationError) {
    return {
      ok: false,
      message: validationError,
    };
  }

  if (resolveStorageMode() === "cloud") {
    return saveToCloudStorageWithFallback(file);
  }

  return saveToLocalStorage(file);
}

function toLocalAbsolutePath(mediaPath: string) {
  return path.join(process.cwd(), "public", mediaPath.replace(/^\//, ""));
}

export async function deleteStoredMedia(mediaPath: string): Promise<DeleteMediaResult> {
  const normalized = normalizeInternalMediaPath(mediaPath);
  if (!normalized) {
    return {
      ok: false,
      message: "Ruta de media invalida.",
    };
  }

  const cloudModeEnabled = resolveStorageMode() === "cloud";
  const cloudConfig = cloudModeEnabled ? getCloudStorageConfig() : null;
  let cloudDeleteFailed = false;

  if (cloudModeEnabled && cloudConfig) {
    const objectKey = toCloudObjectKey(normalized, cloudConfig.uploadPrefix);
    if (!objectKey) {
      return {
        ok: false,
        message: "No se pudo generar clave de objeto cloud para eliminar.",
      };
    }

    try {
      const client = createS3Client(cloudConfig);
      await client.send(
        new DeleteObjectCommand({
          Bucket: cloudConfig.bucket,
          Key: objectKey,
        }),
      );
    } catch {
      cloudDeleteFailed = true;
      logEvent("warn", "media.storage.cloud_delete_failed", {
        mediaPath: normalized,
      });
      if (!cloudConfig.allowLocalFallback) {
        return {
          ok: false,
          message: "No se pudo eliminar archivo de media en storage cloud.",
        };
      }
    }
  }

  try {
    await rm(toLocalAbsolutePath(normalized), { force: true });
    return { ok: true };
  } catch {
    if (cloudModeEnabled && cloudConfig && !cloudDeleteFailed) {
      return { ok: true };
    }

    return {
      ok: false,
      message: "No se pudo eliminar archivo de media.",
    };
  }
}

export function toAbsoluteMediaUrl(mediaPath: string, appBaseUrl?: string) {
  const normalized = normalizeInternalMediaPath(mediaPath);
  if (!normalized) {
    return null;
  }

  const base = appBaseUrl?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || LOCAL_BASE_URL;
  try {
    return new URL(normalized, base).toString();
  } catch {
    return null;
  }
}
