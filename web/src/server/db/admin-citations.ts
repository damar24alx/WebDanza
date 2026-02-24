import {
  AdminActorRole,
  hasAdminActionPermission,
  parseAdminActorRole,
  rolePermissionMessage,
} from "@/server/admin/permissions";
import { db } from "@/lib/db";
import { normalizeOptionalHttpUrl } from "@/server/validation/url";

const CITATION_ENTITY_TYPES = ["lesson", "course", "connection"] as const;
type CitationEntityType = (typeof CITATION_ENTITY_TYPES)[number];

type AdminCitationMutationResult = {
  ok: boolean;
  message: string;
};

function assertDatabaseConfigured() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for admin DB operations.");
  }
}

function requireCitationPermission(
  roleInput: unknown,
): { ok: true; role: AdminActorRole } | { ok: false; result: AdminCitationMutationResult } {
  const role = parseAdminActorRole(roleInput);
  if (!hasAdminActionPermission(role, "link_citation")) {
    return {
      ok: false,
      result: {
        ok: false,
        message: rolePermissionMessage(role, "link_citation"),
      },
    };
  }

  return { ok: true, role };
}

function parseEntityType(value?: string): CitationEntityType | undefined {
  if (value === "lesson" || value === "course" || value === "connection") {
    return value;
  }

  return undefined;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function resolveEntityId(entityType: CitationEntityType, entityRef: string) {
  const reference = entityRef.trim();
  if (!reference) {
    return undefined;
  }

  if (entityType === "connection") {
    if (!isUuid(reference)) {
      return undefined;
    }

    const connection = await db.connection.findUnique({
      where: {
        id: reference,
      },
      select: {
        id: true,
      },
    });
    return connection?.id;
  }

  const where = isUuid(reference)
    ? {
        OR: [{ id: reference }, { slug: reference }],
      }
    : {
        slug: reference,
      };

  if (entityType === "lesson") {
    const lesson = await db.lesson.findFirst({
      where,
      select: {
        id: true,
      },
    });
    return lesson?.id;
  }

  const course = await db.course.findFirst({
    where,
    select: {
      id: true,
    },
  });
  return course?.id;
}

export async function linkCitationToEntityByRef(input: {
  entityType?: string;
  entityRef?: string;
  title?: string;
  url?: string;
  author?: string;
  year?: string;
  actorRole?: string;
}): Promise<AdminCitationMutationResult> {
  assertDatabaseConfigured();

  const permission = requireCitationPermission(input.actorRole);
  if (!permission.ok) {
    return permission.result;
  }

  const entityType = parseEntityType(input.entityType);
  if (!entityType) {
    return {
      ok: false,
      message: `entityType invalido. Usa: ${CITATION_ENTITY_TYPES.join(", ")}.`,
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
      message: "Entidad no encontrada para citation.",
    };
  }

  const title = (input.title ?? "").trim();
  if (!title) {
    return {
      ok: false,
      message: "El titulo de la citation es obligatorio.",
    };
  }

  const normalizedUrl = normalizeOptionalHttpUrl(input.url);
  if (normalizedUrl === undefined) {
    return {
      ok: false,
      message: "La URL de la citation es invalida. Usa http/https.",
    };
  }
  const parsedYear = Number.parseInt((input.year ?? "").trim(), 10);
  const year = Number.isInteger(parsedYear) && parsedYear > 0 ? parsedYear : null;

  const existing = normalizedUrl
    ? await db.citation.findFirst({
        where: {
          url: normalizedUrl,
        },
      })
    : null;

  const citation =
    existing ??
    (await db.citation.create({
      data: {
        sourceType: "website",
        title,
        url: normalizedUrl,
        author: (input.author ?? "").trim() || null,
        year,
        claimScope: `${entityType} editorial validation`,
      },
    }));

  await db.citationLink.upsert({
    where: {
      citationId_entityType_entityId: {
        citationId: citation.id,
        entityType,
        entityId,
      },
    },
    update: {},
    create: {
      citationId: citation.id,
      entityType,
      entityId,
    },
  });

  return {
    ok: true,
    message: "Citation vinculada correctamente.",
  };
}

export async function listCitationsByEntityRef(input: {
  entityType?: string;
  entityRef?: string;
}) {
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

  const links = await db.citationLink.findMany({
    where: {
      entityType,
      entityId,
    },
    include: {
      citation: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return links.map((link) => ({
    id: link.citation.id,
    title: link.citation.title,
    sourceType: link.citation.sourceType,
    author: link.citation.author,
    year: link.citation.year,
    url: link.citation.url,
  }));
}
