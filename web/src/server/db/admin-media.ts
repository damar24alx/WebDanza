import { MediaProvider, Prisma, RightsStatus } from "@prisma/client";
import {
  AdminAction,
  AdminActorRole,
  hasAdminActionPermission,
  parseAdminActorRole,
  rolePermissionMessage,
} from "@/server/admin/permissions";
import { normalizeInternalMediaPath } from "@/server/validation/url";
import { db } from "@/lib/db";

const ADMIN_MEDIA_ENTITY_TYPES = ["style", "substyle", "move", "lesson", "course"] as const;

type AdminMediaEntityType = (typeof ADMIN_MEDIA_ENTITY_TYPES)[number];

export type AdminMediaMutationResult = {
  ok: boolean;
  message: string;
  mediaId?: string;
  linkId?: string;
  mediaDeleted?: boolean;
  deletedMediaPath?: string | null;
};

export type AdminEntityMediaRow = {
  linkId: string;
  mediaId: string;
  provider: MediaProvider;
  rightsStatus: RightsStatus;
  url: string;
  title: string;
  durationSec: number | null;
  role: string | null;
  createdAt: Date;
};

function assertDatabaseConfigured() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for admin DB operations.");
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function parseProvider(value?: string): MediaProvider | undefined {
  if (value === "other") {
    return value;
  }

  return undefined;
}

function parseRightsStatus(value?: string): RightsStatus | undefined {
  if (
    value === "unknown" ||
    value === "ok_to_embed" ||
    value === "restricted" ||
    value === "blocked"
  ) {
    return value;
  }

  return undefined;
}

function parseEntityType(value?: string): AdminMediaEntityType | undefined {
  if (
    value === "style" ||
    value === "substyle" ||
    value === "move" ||
    value === "lesson" ||
    value === "course"
  ) {
    return value;
  }

  return undefined;
}

function parseInternalMediaPath(rawValue?: string): string | undefined {
  return normalizeInternalMediaPath(rawValue);
}

function parseDurationSec(rawValue?: string): number | null | undefined {
  if (rawValue === undefined) {
    return null;
  }

  const value = rawValue.trim();
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return undefined;
  }

  return parsed;
}

function requirePermission(
  roleInput: unknown,
  action: Extract<AdminAction, "create_content" | "edit_content">,
): { ok: true; role: AdminActorRole } | { ok: false; result: AdminMediaMutationResult } {
  const role = parseAdminActorRole(roleInput);
  if (!hasAdminActionPermission(role, action)) {
    return {
      ok: false,
      result: {
        ok: false,
        message: rolePermissionMessage(role, action),
      },
    };
  }

  return { ok: true, role };
}

async function resolveEntityId(entityType: AdminMediaEntityType, entityRef: string) {
  const reference = entityRef.trim();
  if (!reference) {
    return undefined;
  }

  const baseWhere = isUuid(reference)
    ? {
        OR: [{ id: reference }, { slug: reference }],
      }
    : {
        slug: reference,
      };

  if (entityType === "style") {
    const record = await db.style.findFirst({
      where: {
        ...baseWhere,
        isArchived: false,
      },
      select: { id: true },
    });
    return record?.id;
  }

  if (entityType === "substyle") {
    const record = await db.substyle.findFirst({
      where: {
        ...baseWhere,
        isArchived: false,
        style: {
          isArchived: false,
        },
      },
      select: { id: true },
    });
    return record?.id;
  }

  if (entityType === "move") {
    const record = await db.move.findFirst({
      where: {
        ...baseWhere,
        isArchived: false,
      },
      select: { id: true },
    });
    return record?.id;
  }

  if (entityType === "lesson") {
    const record = await db.lesson.findFirst({
      where: baseWhere,
      select: { id: true },
    });
    return record?.id;
  }

  const record = await db.course.findFirst({
    where: baseWhere,
    select: { id: true },
  });
  return record?.id;
}

async function resolveMediaByInput(input: { mediaId?: string; mediaUrl?: string }) {
  const mediaId = (input.mediaId ?? "").trim();
  if (mediaId) {
    return db.media.findUnique({
      where: { id: mediaId },
    });
  }

  const mediaPath = parseInternalMediaPath(input.mediaUrl);
  if (!mediaPath) {
    return null;
  }

  return db.media.findUnique({
    where: {
      url: mediaPath,
    },
  });
}

export async function createAdminMedia(input: {
  provider?: string;
  url?: string;
  title?: string;
  rightsStatus?: string;
  durationSec?: string;
  actorRole?: string;
}): Promise<AdminMediaMutationResult> {
  assertDatabaseConfigured();

  const permission = requirePermission(input.actorRole, "create_content");
  if (!permission.ok) {
    return permission.result;
  }

  const provider = parseProvider(input.provider);
  if (!provider) {
    return {
      ok: false,
      message: "Provider invalido. Usa other (media interna).",
    };
  }

  const mediaPath = parseInternalMediaPath(input.url);
  if (!mediaPath) {
    return {
      ok: false,
      message: "URL invalida. Usa ruta interna /media/...",
    };
  }

  const rightsStatus = parseRightsStatus(input.rightsStatus);
  if (!rightsStatus) {
    return {
      ok: false,
      message: "rightsStatus invalido. Usa unknown/ok_to_embed/restricted/blocked.",
    };
  }

  const title = (input.title ?? "").trim();
  if (!title) {
    return {
      ok: false,
      message: "El titulo de media es obligatorio.",
    };
  }

  const durationSec = parseDurationSec(input.durationSec);
  if (durationSec === undefined) {
    return {
      ok: false,
      message: "durationSec invalido. Usa entero >= 0 o vacio.",
    };
  }

  const canonicalUrl = mediaPath;
  const existing = await db.media.findUnique({
    where: {
      url: canonicalUrl,
    },
  });

  if (existing) {
    if (existing.provider !== provider) {
      return {
        ok: false,
        message: `La URL ya existe con provider ${existing.provider}.`,
        mediaId: existing.id,
      };
    }

    return {
      ok: true,
      message: "La media ya existia; se reutiliza el registro.",
      mediaId: existing.id,
    };
  }

  try {
    const media = await db.media.create({
      data: {
        provider,
        url: canonicalUrl,
        title,
        rightsStatus,
        durationSec: durationSec ?? null,
      },
    });

    return {
      ok: true,
      message: "Media creada correctamente.",
      mediaId: media.id,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        message: "URL duplicada de media.",
      };
    }

    return {
      ok: false,
      message: "No se pudo crear la media.",
    };
  }
}

export async function linkAdminMediaToEntity(input: {
  entityType?: string;
  entityRef?: string;
  mediaId?: string;
  mediaUrl?: string;
  role?: string;
  actorRole?: string;
}): Promise<AdminMediaMutationResult> {
  assertDatabaseConfigured();

  const permission = requirePermission(input.actorRole, "edit_content");
  if (!permission.ok) {
    return permission.result;
  }

  const entityType = parseEntityType(input.entityType);
  if (!entityType) {
    return {
      ok: false,
      message: `entityType invalido. Usa: ${ADMIN_MEDIA_ENTITY_TYPES.join(", ")}.`,
    };
  }

  const entityRef = (input.entityRef ?? "").trim();
  if (!entityRef) {
    return {
      ok: false,
      message: "entityRef es obligatorio (slug o id).",
    };
  }

  const entityId = await resolveEntityId(entityType, entityRef);
  if (!entityId) {
    return {
      ok: false,
      message: "Entidad destino no encontrada.",
    };
  }

  const media = await resolveMediaByInput({
    mediaId: input.mediaId,
    mediaUrl: input.mediaUrl,
  });
  if (!media) {
    return {
      ok: false,
      message: "Media no encontrada. Usa mediaId valido o mediaUrl existente.",
    };
  }

  const linkRole = (input.role ?? "").trim() || null;

  const link = await db.mediaLink.upsert({
    where: {
      mediaId_entityType_entityId: {
        mediaId: media.id,
        entityType,
        entityId,
      },
    },
    update: {
      role: linkRole,
    },
    create: {
      mediaId: media.id,
      entityType,
      entityId,
      role: linkRole,
    },
  });

  return {
    ok: true,
    message: "Media vinculada correctamente.",
    mediaId: media.id,
    linkId: link.id,
  };
}

export async function createAndLinkAdminMediaToEntity(input: {
  provider?: string;
  url?: string;
  title?: string;
  rightsStatus?: string;
  durationSec?: string;
  entityType?: string;
  entityRef?: string;
  role?: string;
  actorRole?: string;
}): Promise<AdminMediaMutationResult> {
  assertDatabaseConfigured();

  const created = await createAdminMedia({
    provider: input.provider,
    url: input.url,
    title: input.title,
    rightsStatus: input.rightsStatus,
    durationSec: input.durationSec,
    actorRole: input.actorRole,
  });
  if (!created.ok || !created.mediaId) {
    return created;
  }

  const linked = await linkAdminMediaToEntity({
    entityType: input.entityType,
    entityRef: input.entityRef,
    mediaId: created.mediaId,
    role: input.role,
    actorRole: input.actorRole,
  });

  if (!linked.ok) {
    return linked;
  }

  return {
    ok: true,
    message: "Media creada y vinculada correctamente.",
    mediaId: created.mediaId,
    linkId: linked.linkId,
  };
}

export async function unlinkAdminMediaFromEntity(input: {
  entityType?: string;
  entityRef?: string;
  mediaId?: string;
  mediaUrl?: string;
  actorRole?: string;
}): Promise<AdminMediaMutationResult> {
  assertDatabaseConfigured();

  const permission = requirePermission(input.actorRole, "edit_content");
  if (!permission.ok) {
    return permission.result;
  }

  const entityType = parseEntityType(input.entityType);
  if (!entityType) {
    return {
      ok: false,
      message: `entityType invalido. Usa: ${ADMIN_MEDIA_ENTITY_TYPES.join(", ")}.`,
    };
  }

  const entityRef = (input.entityRef ?? "").trim();
  if (!entityRef) {
    return {
      ok: false,
      message: "entityRef es obligatorio (slug o id).",
    };
  }

  const entityId = await resolveEntityId(entityType, entityRef);
  if (!entityId) {
    return {
      ok: false,
      message: "Entidad destino no encontrada.",
    };
  }

  const media = await resolveMediaByInput({
    mediaId: input.mediaId,
    mediaUrl: input.mediaUrl,
  });
  if (!media) {
    return {
      ok: false,
      message: "Media no encontrada. Usa mediaId valido o mediaUrl existente.",
    };
  }

  const deleted = await db.mediaLink.deleteMany({
    where: {
      mediaId: media.id,
      entityType,
      entityId,
    },
  });

  if (deleted.count === 0) {
    return {
      ok: false,
      message: "No existia vinculacion media-entidad para remover.",
      mediaId: media.id,
    };
  }

  let mediaDeleted = false;
  let deletedMediaPath: string | null = null;

  const linksRemaining = await db.mediaLink.count({
    where: {
      mediaId: media.id,
    },
  });

  if (linksRemaining === 0) {
    await db.media.delete({
      where: {
        id: media.id,
      },
    });
    mediaDeleted = true;
    deletedMediaPath =
      media.provider === "other" ? parseInternalMediaPath(media.url) ?? null : null;
  }

  return {
    ok: true,
    message: mediaDeleted
      ? "Vinculacion removida y media huerfana eliminada."
      : "Vinculacion de media removida.",
    mediaId: media.id,
    mediaDeleted,
    deletedMediaPath,
  };
}

export async function listAdminMediaLinksByEntity(input: {
  entityType?: string;
  entityRef?: string;
}): Promise<AdminEntityMediaRow[]> {
  assertDatabaseConfigured();

  const entityType = parseEntityType(input.entityType);
  const entityRef = (input.entityRef ?? "").trim();
  if (!entityType || !entityRef) {
    return [];
  }

  const entityId = await resolveEntityId(entityType, entityRef);
  if (!entityId) {
    return [];
  }

  const links = await db.mediaLink.findMany({
    where: {
      entityType,
      entityId,
    },
    include: {
      media: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return links
    .filter(
      (link) =>
        link.media.provider === "other" &&
        parseInternalMediaPath(link.media.url) !== undefined,
    )
    .map((link) => ({
      linkId: link.id,
      mediaId: link.media.id,
      provider: link.media.provider,
      rightsStatus: link.media.rightsStatus,
      url: link.media.url,
      title: link.media.title,
      durationSec: link.media.durationSec,
      role: link.role,
      createdAt: link.createdAt,
    }));
}
