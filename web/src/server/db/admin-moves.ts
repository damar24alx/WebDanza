import { Difficulty, EditorialStatus, Prisma, RightsStatus, SourceType } from "@prisma/client";
import {
  AdminActorRole,
  hasAdminActionPermission,
  parseAdminActorRole,
  rolePermissionMessage,
} from "@/server/admin/permissions";
import { db } from "@/lib/db";
import { normalizeOptionalHttpUrl } from "@/server/validation/url";

export type AdminMoveSort = "name" | "difficulty" | "status" | "updated";
export type AdminMoveStatusFilter = "all" | "draft" | "review" | "ready" | "published";

export type AdminMoveRow = {
  slug: string;
  name: string;
  difficulty: Difficulty;
  status: EditorialStatus;
  citationCount: number;
  hasPlaceholder: boolean;
  updatedAt: Date;
};

export type AdminMoveReview = {
  move: {
    slug: string;
    name: string;
    summary: string;
    moveType: string;
    difficulty: Difficulty;
    family: string;
    bpmRange: string;
    status: EditorialStatus;
    stepByStep: string[];
    commonMistakes: Array<{ issue: string; correction: string }>;
    styleNames: string[];
  };
  citations: Array<{
    id: string;
    title: string;
    sourceType: SourceType;
    author: string | null;
    year: number | null;
    url: string | null;
  }>;
  media: Array<{
    id: string;
    title: string;
    rightsStatus: RightsStatus;
    url: string;
  }>;
  checklist: {
    hasStepByStep: boolean;
    hasCommonMistakes: boolean;
    hasCitation: boolean;
    hasNoPlaceholder: boolean;
    hasRightsStatusDefined: boolean;
  };
  canPublish: boolean;
  issues: string[];
};

export type AdminMutationResult = {
  ok: boolean;
  message: string;
  slug?: string;
};

function assertDatabaseConfigured() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for admin DB operations.");
  }
}

function parseStringArray(value: Prisma.JsonValue | null): string[] {
  if (!value || !Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function parseCommonMistakes(
  value: Prisma.JsonValue | null,
): Array<{ issue: string; correction: string }> {
  if (!value || !Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const issue = "issue" in item && typeof item.issue === "string" ? item.issue : "";
      const correction =
        "correction" in item && typeof item.correction === "string" ? item.correction : "";

      if (!issue || !correction) {
        return null;
      }

      return { issue, correction };
    })
    .filter((item): item is { issue: string; correction: string } => Boolean(item));
}

function normalizeSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function containsPlaceholder(payload: string) {
  return /placeholder/i.test(payload);
}

function hasPlaceholderInMove(move: {
  summary: string;
  moveType: string;
  family: string | null;
  bpmRange: string | null;
  bodyMechanics: string | null;
  safetyNotes: string | null;
  stepByStep: Prisma.JsonValue | null;
  commonMistakes: Prisma.JsonValue | null;
}) {
  return containsPlaceholder(
    [
      move.summary,
      move.moveType,
      move.family ?? "",
      move.bpmRange ?? "",
      move.bodyMechanics ?? "",
      move.safetyNotes ?? "",
      JSON.stringify(move.stepByStep ?? []),
      JSON.stringify(move.commonMistakes ?? []),
    ].join(" "),
  );
}

function difficultyFromInput(value?: string): Difficulty | undefined {
  if (value === "beginner" || value === "intermediate" || value === "advanced") {
    return value;
  }

  return undefined;
}

function parseStepByStepFromInput(value?: string): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseCommonMistakesFromInput(value?: string) {
  if (value === undefined) {
    return undefined;
  }

  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [issue, correction] = line.split("|").map((part) => part.trim());
      if (!issue || !correction) {
        return null;
      }

      return { issue, correction };
    })
    .filter((item): item is { issue: string; correction: string } => Boolean(item));
}

function requirePermission(
  roleInput: unknown,
  action: "create_content" | "edit_content" | "archive_content" | "link_citation" | "set_status",
  targetStatus?: EditorialStatus,
): { ok: true; role: AdminActorRole } | { ok: false; result: AdminMutationResult } {
  const role = parseAdminActorRole(roleInput);
  if (!hasAdminActionPermission(role, action, targetStatus)) {
    return {
      ok: false,
      result: {
        ok: false,
        message: rolePermissionMessage(role, action, targetStatus),
      },
    };
  }

  return { ok: true, role };
}

export async function listAdminMoves({
  query,
  status,
  sort,
}: {
  query?: string;
  status: AdminMoveStatusFilter;
  sort: AdminMoveSort;
}): Promise<AdminMoveRow[]> {
  assertDatabaseConfigured();

  const search = (query ?? "").trim();
  const where: Prisma.MoveWhereInput = {
    isArchived: false,
  };

  if (status !== "all") {
    where.publishedStatus = status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.MoveOrderByWithRelationInput =
    sort === "difficulty"
      ? { difficulty: "asc" }
      : sort === "status"
        ? { publishedStatus: "asc" }
        : sort === "updated"
          ? { updatedAt: "desc" }
          : { name: "asc" };

  const rows = await db.move.findMany({
    where,
    orderBy,
  });

  if (rows.length === 0) {
    return [];
  }

  const citationCountsByEntityId = await db.citationLink.groupBy({
    by: ["entityId"],
    where: {
      entityType: "move",
      entityId: {
        in: rows.map((row) => row.id),
      },
    },
    _count: {
      _all: true,
    },
  });

  const citationCountByMoveId = new Map(
    citationCountsByEntityId.map((entry) => [entry.entityId, entry._count._all]),
  );

  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    difficulty: row.difficulty,
    status: row.publishedStatus,
    citationCount: citationCountByMoveId.get(row.id) ?? 0,
    hasPlaceholder: hasPlaceholderInMove(row),
    updatedAt: row.updatedAt,
  }));
}

export async function createAdminMove(input: {
  slug?: string;
  name?: string;
  summary?: string;
  moveType?: string;
  difficulty?: string;
  family?: string;
  bpmRange?: string;
  actorRole?: string;
}): Promise<AdminMutationResult> {
  assertDatabaseConfigured();

  const permission = requirePermission(input.actorRole, "create_content");
  if (!permission.ok) {
    return permission.result;
  }

  const name = (input.name ?? "").trim();
  const summary = (input.summary ?? "").trim();
  const moveType = (input.moveType ?? "").trim();
  const rawSlug = (input.slug ?? "").trim() || name;
  const slug = normalizeSlug(rawSlug);

  if (!name || !summary || !moveType || !slug) {
    return {
      ok: false,
      message: "Campos obligatorios: name, slug, summary y moveType.",
    };
  }

  const difficulty = difficultyFromInput(input.difficulty);
  if (!difficulty) {
    return {
      ok: false,
      message: "Difficulty invalido. Usa beginner/intermediate/advanced.",
    };
  }

  try {
    const created = await db.move.create({
      data: {
        slug,
        name,
        summary,
        moveType,
        difficulty,
        family: (input.family ?? "").trim() || null,
        bpmRange: (input.bpmRange ?? "").trim() || null,
        stepByStep: [],
        commonMistakes: [],
        publishedStatus: "draft",
        isArchived: false,
      },
    });

    return {
      ok: true,
      message: `Move ${created.slug} creado en draft.`,
      slug: created.slug,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        message: `Slug duplicado: ${slug}.`,
      };
    }

    return {
      ok: false,
      message: "No se pudo crear el move.",
    };
  }
}

export async function updateAdminMoveBySlug(input: {
  slug: string;
  name?: string;
  summary?: string;
  moveType?: string;
  difficulty?: string;
  family?: string;
  bpmRange?: string;
  stepByStep?: string;
  commonMistakes?: string;
  actorRole?: string;
}): Promise<AdminMutationResult> {
  assertDatabaseConfigured();

  const permission = requirePermission(input.actorRole, "edit_content");
  if (!permission.ok) {
    return permission.result;
  }

  const current = await db.move.findFirst({
    where: {
      slug: input.slug,
      isArchived: false,
    },
  });

  if (!current) {
    return {
      ok: false,
      message: "Move no encontrado.",
    };
  }

  const nextName = (input.name ?? current.name).trim();
  const nextSummary = (input.summary ?? current.summary).trim();
  const nextMoveType = (input.moveType ?? current.moveType).trim();
  const nextDifficulty = difficultyFromInput(input.difficulty) ?? current.difficulty;

  if (!nextName || !nextSummary || !nextMoveType) {
    return {
      ok: false,
      message: "Campos obligatorios: name, summary y moveType.",
    };
  }

  const parsedStepByStep = parseStepByStepFromInput(input.stepByStep);
  const parsedCommonMistakes = parseCommonMistakesFromInput(input.commonMistakes);

  await db.move.update({
    where: { id: current.id },
    data: {
      name: nextName,
      summary: nextSummary,
      moveType: nextMoveType,
      difficulty: nextDifficulty,
      family: input.family !== undefined ? (input.family.trim() || null) : current.family,
      bpmRange: input.bpmRange !== undefined ? (input.bpmRange.trim() || null) : current.bpmRange,
      ...(parsedStepByStep ? { stepByStep: parsedStepByStep } : {}),
      ...(parsedCommonMistakes ? { commonMistakes: parsedCommonMistakes } : {}),
      version: {
        increment: 1,
      },
    },
  });

  return {
    ok: true,
    message: "Move actualizado.",
    slug: current.slug,
  };
}

export async function archiveAdminMoveBySlug(input: {
  slug: string;
  actorRole?: string;
}): Promise<AdminMutationResult> {
  assertDatabaseConfigured();

  const permission = requirePermission(input.actorRole, "archive_content");
  if (!permission.ok) {
    return permission.result;
  }

  const move = await db.move.findFirst({
    where: {
      slug: input.slug,
      isArchived: false,
    },
  });

  if (!move) {
    return {
      ok: false,
      message: "Move no encontrado.",
    };
  }

  await db.move.update({
    where: { id: move.id },
    data: {
      isArchived: true,
      publishedStatus: "draft",
      version: {
        increment: 1,
      },
    },
  });

  return {
    ok: true,
    message: `Move ${move.slug} archivado logicamente.`,
    slug: move.slug,
  };
}

async function buildMoveReview(
  slug: string,
): Promise<{ data?: AdminMoveReview; message?: string }> {
  const move = await db.move.findFirst({
    where: {
      slug,
      isArchived: false,
    },
    include: {
      moveStyles: {
        include: {
          style: true,
        },
      },
    },
  });

  if (!move) {
    return {
      message: "Move no encontrado.",
    };
  }

  const [citationLinks, mediaLinks] = await Promise.all([
    db.citationLink.findMany({
      where: {
        entityType: "move",
        entityId: move.id,
      },
      include: {
        citation: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    db.mediaLink.findMany({
      where: {
        entityType: "move",
        entityId: move.id,
      },
      include: {
        media: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const stepByStep = parseStringArray(move.stepByStep);
  const commonMistakes = parseCommonMistakes(move.commonMistakes);
  const hasNoPlaceholder = !hasPlaceholderInMove(move);
  const hasCitation = citationLinks.length > 0;
  const hasRightsStatusDefined =
    mediaLinks.length === 0 ||
    mediaLinks.every((item) => item.media.rightsStatus !== "unknown");

  const issues: string[] = [];
  if (stepByStep.length === 0) {
    issues.push("Falta seccion step-by-step.");
  }
  if (commonMistakes.length === 0) {
    issues.push("Falta seccion common mistakes/corrections.");
  }
  if (!hasNoPlaceholder) {
    issues.push("Hay contenido PLACEHOLDER. Solo permitido en draft/review.");
  }
  if (!hasCitation) {
    issues.push("No hay citation vinculada al move.");
  }
  if (!hasRightsStatusDefined) {
    issues.push("Hay media con rightsStatus=unknown.");
  }

  const canPublish =
    hasNoPlaceholder && hasCitation && hasRightsStatusDefined && move.publishedStatus === "ready";

  return {
    data: {
      move: {
        slug: move.slug,
        name: move.name,
        summary: move.summary,
        moveType: move.moveType,
        difficulty: move.difficulty,
        family: move.family ?? "N/A",
        bpmRange: move.bpmRange ?? "N/A",
        status: move.publishedStatus,
        stepByStep,
        commonMistakes,
        styleNames: move.moveStyles.map((item) => item.style.name),
      },
      citations: citationLinks.map((item) => ({
        id: item.citation.id,
        title: item.citation.title,
        sourceType: item.citation.sourceType,
        author: item.citation.author,
        year: item.citation.year,
        url: item.citation.url,
      })),
      media: mediaLinks.map((item) => ({
        id: item.media.id,
        title: item.media.title,
        rightsStatus: item.media.rightsStatus,
        url: item.media.url,
      })),
      checklist: {
        hasStepByStep: stepByStep.length > 0,
        hasCommonMistakes: commonMistakes.length > 0,
        hasCitation,
        hasNoPlaceholder,
        hasRightsStatusDefined,
      },
      canPublish,
      issues,
    },
  };
}

export async function getAdminMoveReview(
  slug: string,
): Promise<AdminMoveReview | undefined> {
  assertDatabaseConfigured();

  const result = await buildMoveReview(slug);
  return result.data;
}

export async function setAdminMoveStatusBySlug(input: {
  slug: string;
  targetStatus: EditorialStatus;
  actorRole?: string;
}): Promise<AdminMutationResult> {
  assertDatabaseConfigured();

  const permission = requirePermission(input.actorRole, "set_status", input.targetStatus);
  if (!permission.ok) {
    return permission.result;
  }

  const result = await buildMoveReview(input.slug);
  if (!result.data) {
    return {
      ok: false,
      message: result.message ?? "Move no encontrado.",
    };
  }

  const currentStatus = result.data.move.status;
  const hasPlaceholder = !result.data.checklist.hasNoPlaceholder;
  const hasCitation = result.data.checklist.hasCitation;

  if (
    (input.targetStatus === "ready" || input.targetStatus === "published") &&
    hasPlaceholder
  ) {
    return {
      ok: false,
      message: "No se puede mover a ready/published porque contiene PLACEHOLDER.",
    };
  }

  if (input.targetStatus === "published" && !hasCitation) {
    return {
      ok: false,
      message: "No se puede publicar sin citation vinculada al move.",
    };
  }

  if (
    input.targetStatus === "published" &&
    !result.data.checklist.hasRightsStatusDefined
  ) {
    return {
      ok: false,
      message: "No se puede publicar con media en rightsStatus=unknown.",
    };
  }

  if (input.targetStatus === "published" && currentStatus !== "ready") {
    return {
      ok: false,
      message: "Para publicar, el estado actual debe ser ready.",
    };
  }

  if (currentStatus === input.targetStatus) {
    return {
      ok: true,
      message: `El move ya estaba en estado ${input.targetStatus}.`,
      slug: input.slug,
    };
  }

  await db.move.update({
    where: { slug: input.slug },
    data: {
      publishedStatus: input.targetStatus,
      version: {
        increment: 1,
      },
    },
  });

  return {
    ok: true,
    message: `Estado actualizado a ${input.targetStatus}.`,
    slug: input.slug,
  };
}

export async function linkCitationToMoveBySlug(input: {
  slug: string;
  title?: string;
  url?: string;
  author?: string;
  year?: string;
  actorRole?: string;
}): Promise<AdminMutationResult> {
  assertDatabaseConfigured();

  const permission = requirePermission(input.actorRole, "link_citation");
  if (!permission.ok) {
    return permission.result;
  }

  const move = await db.move.findFirst({
    where: {
      slug: input.slug,
      isArchived: false,
    },
  });
  if (!move) {
    return {
      ok: false,
      message: "Move no encontrado.",
    };
  }

  const title = (input.title ?? "").trim();
  const normalizedUrl = normalizeOptionalHttpUrl(input.url);
  if (!title) {
    return {
      ok: false,
      message: "El titulo de la citation es obligatorio.",
    };
  }
  if (normalizedUrl === undefined) {
    return {
      ok: false,
      message: "La URL de la citation es invalida. Usa http/https.",
    };
  }

  const yearValue = Number(input.year);
  const parsedYear = Number.isInteger(yearValue) && yearValue > 0 ? yearValue : null;

  const existing = normalizedUrl
    ? await db.citation.findFirst({
        where: { url: normalizedUrl },
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
        year: parsedYear,
        claimScope: "move editorial validation",
      },
    }));

  await db.citationLink.upsert({
    where: {
      citationId_entityType_entityId: {
        citationId: citation.id,
        entityType: "move",
        entityId: move.id,
      },
    },
    update: {},
    create: {
      citationId: citation.id,
      entityType: "move",
      entityId: move.id,
    },
  });

  return {
    ok: true,
    message: "Citation vinculada correctamente.",
    slug: move.slug,
  };
}
