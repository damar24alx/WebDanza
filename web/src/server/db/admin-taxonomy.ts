import { Difficulty, EditorialStatus, Prisma, SourceType } from "@prisma/client";
import {
  hasAdminActionPermission,
  parseAdminActorRole,
  rolePermissionMessage,
} from "@/server/admin/permissions";
import { db } from "@/lib/db";
import { normalizeOptionalHttpUrl } from "@/server/validation/url";

export type AdminTaxonomyStatusFilter = "all" | "draft" | "review" | "ready" | "published";
export type AdminTaxonomySort = "name" | "status" | "updated";

export type AdminTaxonomyMutationResult = {
  ok: boolean;
  message: string;
  slug?: string;
};

export type AdminStyleRow = {
  slug: string;
  name: string;
  level: Difficulty;
  status: EditorialStatus;
  citationCount: number;
  hasPlaceholder: boolean;
  updatedAt: Date;
};

export type AdminSubstyleRow = {
  slug: string;
  name: string;
  styleSlug: string;
  status: EditorialStatus;
  citationCount: number;
  hasPlaceholder: boolean;
  updatedAt: Date;
};

export type AdminStyleDetail = {
  style: {
    slug: string;
    name: string;
    summary: string;
    categoryPrimary: string;
    level: Difficulty;
    historicalCulturalContext: string;
    musicalityBasics: string;
    movementPrinciples: string[];
    status: EditorialStatus;
  };
  citations: Array<{
    id: string;
    title: string;
    sourceType: SourceType;
    author: string | null;
    year: number | null;
    url: string | null;
  }>;
  checklist: {
    hasCitationForHistorical: boolean;
    hasNoPlaceholder: boolean;
  };
  canPublish: boolean;
  issues: string[];
};

export type AdminSubstyleDetail = {
  substyle: {
    slug: string;
    styleSlug: string;
    name: string;
    summary: string;
    historicalCulturalContext: string;
    technicalFocus: string[];
    musicalFocus: string;
    status: EditorialStatus;
  };
  citations: Array<{
    id: string;
    title: string;
    sourceType: SourceType;
    author: string | null;
    year: number | null;
    url: string | null;
  }>;
  checklist: {
    hasCitationForHistorical: boolean;
    hasNoPlaceholder: boolean;
  };
  canPublish: boolean;
  issues: string[];
};

function assertDatabaseConfigured() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for admin DB operations.");
  }
}

function requirePermission(
  roleInput: unknown,
  action: "create_content" | "edit_content" | "archive_content" | "link_citation" | "set_status",
  targetStatus?: EditorialStatus,
): { ok: true } | { ok: false; result: AdminTaxonomyMutationResult } {
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

  return { ok: true };
}

function normalizeSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseLineArray(value?: string): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function hasPlaceholder(text: string) {
  return /placeholder/i.test(text);
}

function parseDifficulty(value?: string): Difficulty | undefined {
  if (value === "beginner" || value === "intermediate" || value === "advanced") {
    return value;
  }

  return undefined;
}

function taxOrderBy(sort: AdminTaxonomySort): Prisma.StyleOrderByWithRelationInput {
  if (sort === "status") {
    return { publishedStatus: "asc" };
  }
  if (sort === "updated") {
    return { updatedAt: "desc" };
  }

  return { name: "asc" };
}

function substyleOrderBy(sort: AdminTaxonomySort): Prisma.SubstyleOrderByWithRelationInput {
  if (sort === "status") {
    return { publishedStatus: "asc" };
  }
  if (sort === "updated") {
    return { updatedAt: "desc" };
  }

  return { name: "asc" };
}

function styleHasPlaceholder(style: {
  summary: string;
  categoryPrimary: string;
  historicalCulturalContext: string | null;
  musicalityBasics: string | null;
  movementPrinciples: string[];
}) {
  return hasPlaceholder(
    [
      style.summary,
      style.categoryPrimary,
      style.historicalCulturalContext ?? "",
      style.musicalityBasics ?? "",
      style.movementPrinciples.join(" "),
    ].join(" "),
  );
}

function substyleHasPlaceholder(substyle: {
  summary: string;
  historicalCulturalContext: string | null;
  technicalFocus: string[];
  musicalFocus: string | null;
}) {
  return hasPlaceholder(
    [
      substyle.summary,
      substyle.historicalCulturalContext ?? "",
      substyle.technicalFocus.join(" "),
      substyle.musicalFocus ?? "",
    ].join(" "),
  );
}

async function citationCountByEntity(
  entityType: "style" | "substyle",
  entityIds: string[],
): Promise<Map<string, number>> {
  if (entityIds.length === 0) {
    return new Map();
  }

  const grouped = await db.citationLink.groupBy({
    by: ["entityId"],
    where: {
      entityType,
      entityId: {
        in: entityIds,
      },
    },
    _count: {
      _all: true,
    },
  });

  return new Map(grouped.map((entry) => [entry.entityId, entry._count._all]));
}

export async function listAdminStyles(input: {
  query?: string;
  status: AdminTaxonomyStatusFilter;
  sort: AdminTaxonomySort;
}): Promise<AdminStyleRow[]> {
  assertDatabaseConfigured();

  const search = (input.query ?? "").trim();

  const rows = await db.style.findMany({
    where: {
      isArchived: false,
      ...(input.status !== "all" ? { publishedStatus: input.status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { slug: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: taxOrderBy(input.sort),
  });

  const citationCountMap = await citationCountByEntity(
    "style",
    rows.map((row) => row.id),
  );

  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    level: row.level,
    status: row.publishedStatus,
    citationCount: citationCountMap.get(row.id) ?? 0,
    hasPlaceholder: styleHasPlaceholder(row),
    updatedAt: row.updatedAt,
  }));
}

export async function listAdminSubstyles(input: {
  query?: string;
  status: AdminTaxonomyStatusFilter;
  sort: AdminTaxonomySort;
  styleSlug?: string;
}): Promise<AdminSubstyleRow[]> {
  assertDatabaseConfigured();

  const search = (input.query ?? "").trim();

  const rows = await db.substyle.findMany({
    where: {
      isArchived: false,
      style: {
        isArchived: false,
        ...(input.styleSlug ? { slug: input.styleSlug } : {}),
      },
      ...(input.status !== "all" ? { publishedStatus: input.status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { slug: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      style: true,
    },
    orderBy: substyleOrderBy(input.sort),
  });

  const citationCountMap = await citationCountByEntity(
    "substyle",
    rows.map((row) => row.id),
  );

  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    styleSlug: row.style.slug,
    status: row.publishedStatus,
    citationCount: citationCountMap.get(row.id) ?? 0,
    hasPlaceholder: substyleHasPlaceholder(row),
    updatedAt: row.updatedAt,
  }));
}

async function buildStyleDetail(slug: string): Promise<AdminStyleDetail | undefined> {
  const style = await db.style.findFirst({
    where: {
      slug,
      isArchived: false,
    },
  });

  if (!style) {
    return undefined;
  }

  const citations = await db.citationLink.findMany({
    where: {
      entityType: "style",
      entityId: style.id,
    },
    include: {
      citation: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const hasHistoricalClaims = (style.historicalCulturalContext ?? "").trim().length > 0;
  const hasCitationForHistorical = !hasHistoricalClaims || citations.length > 0;
  const hasNoPlaceholder = !styleHasPlaceholder(style);

  const issues: string[] = [];
  if (!hasNoPlaceholder) {
    issues.push("Hay contenido PLACEHOLDER. Solo permitido en draft/review.");
  }
  if (!hasCitationForHistorical) {
    issues.push("Falta citation para contexto historico-cultural.");
  }

  return {
    style: {
      slug: style.slug,
      name: style.name,
      summary: style.summary,
      categoryPrimary: style.categoryPrimary,
      level: style.level,
      historicalCulturalContext: style.historicalCulturalContext ?? "",
      musicalityBasics: style.musicalityBasics ?? "",
      movementPrinciples: style.movementPrinciples,
      status: style.publishedStatus,
    },
    citations: citations.map((item) => ({
      id: item.citation.id,
      title: item.citation.title,
      sourceType: item.citation.sourceType,
      author: item.citation.author,
      year: item.citation.year,
      url: item.citation.url,
    })),
    checklist: {
      hasCitationForHistorical,
      hasNoPlaceholder,
    },
    canPublish:
      style.publishedStatus === "ready" && hasCitationForHistorical && hasNoPlaceholder,
    issues,
  };
}

async function buildSubstyleDetail(slug: string): Promise<AdminSubstyleDetail | undefined> {
  const substyle = await db.substyle.findFirst({
    where: {
      slug,
      isArchived: false,
      style: {
        isArchived: false,
      },
    },
    include: {
      style: true,
    },
  });

  if (!substyle) {
    return undefined;
  }

  const citations = await db.citationLink.findMany({
    where: {
      entityType: "substyle",
      entityId: substyle.id,
    },
    include: {
      citation: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const hasHistoricalClaims = (substyle.historicalCulturalContext ?? "").trim().length > 0;
  const hasCitationForHistorical = !hasHistoricalClaims || citations.length > 0;
  const hasNoPlaceholder = !substyleHasPlaceholder(substyle);

  const issues: string[] = [];
  if (!hasNoPlaceholder) {
    issues.push("Hay contenido PLACEHOLDER. Solo permitido en draft/review.");
  }
  if (!hasCitationForHistorical) {
    issues.push("Falta citation para contexto historico-cultural.");
  }

  return {
    substyle: {
      slug: substyle.slug,
      styleSlug: substyle.style.slug,
      name: substyle.name,
      summary: substyle.summary,
      historicalCulturalContext: substyle.historicalCulturalContext ?? "",
      technicalFocus: substyle.technicalFocus,
      musicalFocus: substyle.musicalFocus ?? "",
      status: substyle.publishedStatus,
    },
    citations: citations.map((item) => ({
      id: item.citation.id,
      title: item.citation.title,
      sourceType: item.citation.sourceType,
      author: item.citation.author,
      year: item.citation.year,
      url: item.citation.url,
    })),
    checklist: {
      hasCitationForHistorical,
      hasNoPlaceholder,
    },
    canPublish:
      substyle.publishedStatus === "ready" && hasCitationForHistorical && hasNoPlaceholder,
    issues,
  };
}

export async function getAdminStyleDetailBySlug(slug: string) {
  assertDatabaseConfigured();
  return buildStyleDetail(slug);
}

export async function getAdminSubstyleDetailBySlug(slug: string) {
  assertDatabaseConfigured();
  return buildSubstyleDetail(slug);
}

export async function createAdminStyle(input: {
  slug?: string;
  name?: string;
  summary?: string;
  categoryPrimary?: string;
  level?: string;
  historicalCulturalContext?: string;
  movementPrinciples?: string;
  musicalityBasics?: string;
  actorRole?: string;
}): Promise<AdminTaxonomyMutationResult> {
  assertDatabaseConfigured();

  const permission = requirePermission(input.actorRole, "create_content");
  if (!permission.ok) {
    return permission.result;
  }

  const name = (input.name ?? "").trim();
  const summary = (input.summary ?? "").trim();
  const categoryPrimary = (input.categoryPrimary ?? "").trim();
  const level = parseDifficulty(input.level);
  const slug = normalizeSlug((input.slug ?? "").trim() || name);
  const movementPrinciples = parseLineArray(input.movementPrinciples) ?? [];

  if (!name || !summary || !categoryPrimary || !slug || !level) {
    return {
      ok: false,
      message: "Campos obligatorios: name, slug, summary, categoryPrimary, level.",
    };
  }

  try {
    const style = await db.style.create({
      data: {
        slug,
        name,
        summary,
        categoryPrimary,
        level,
        historicalCulturalContext: (input.historicalCulturalContext ?? "").trim() || null,
        movementPrinciples,
        musicalityBasics: (input.musicalityBasics ?? "").trim() || null,
        publishedStatus: "draft",
      },
    });

    return {
      ok: true,
      message: `Style ${style.slug} creado en draft.`,
      slug: style.slug,
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
      message: "No se pudo crear el style.",
    };
  }
}

export async function updateAdminStyleBySlug(input: {
  slug: string;
  name?: string;
  summary?: string;
  categoryPrimary?: string;
  level?: string;
  historicalCulturalContext?: string;
  movementPrinciples?: string;
  musicalityBasics?: string;
  actorRole?: string;
}): Promise<AdminTaxonomyMutationResult> {
  assertDatabaseConfigured();

  const permission = requirePermission(input.actorRole, "edit_content");
  if (!permission.ok) {
    return permission.result;
  }

  const current = await db.style.findFirst({
    where: {
      slug: input.slug,
      isArchived: false,
    },
  });
  if (!current) {
    return {
      ok: false,
      message: "Style no encontrado.",
    };
  }

  const nextLevel = parseDifficulty(input.level) ?? current.level;
  const nextName = (input.name ?? current.name).trim();
  const nextSummary = (input.summary ?? current.summary).trim();
  const nextCategory = (input.categoryPrimary ?? current.categoryPrimary).trim();
  const nextMovementPrinciples = parseLineArray(input.movementPrinciples) ?? current.movementPrinciples;

  if (!nextName || !nextSummary || !nextCategory) {
    return {
      ok: false,
      message: "Campos obligatorios: name, summary, categoryPrimary.",
    };
  }

  await db.style.update({
    where: {
      id: current.id,
    },
    data: {
      name: nextName,
      summary: nextSummary,
      categoryPrimary: nextCategory,
      level: nextLevel,
      historicalCulturalContext:
        input.historicalCulturalContext !== undefined
          ? input.historicalCulturalContext.trim() || null
          : current.historicalCulturalContext,
      movementPrinciples: nextMovementPrinciples,
      musicalityBasics:
        input.musicalityBasics !== undefined
          ? input.musicalityBasics.trim() || null
          : current.musicalityBasics,
      version: {
        increment: 1,
      },
    },
  });

  return {
    ok: true,
    message: "Style actualizado.",
    slug: current.slug,
  };
}

export async function setAdminStyleStatusBySlug(input: {
  slug: string;
  targetStatus: EditorialStatus;
  actorRole?: string;
}): Promise<AdminTaxonomyMutationResult> {
  assertDatabaseConfigured();

  const permission = requirePermission(input.actorRole, "set_status", input.targetStatus);
  if (!permission.ok) {
    return permission.result;
  }

  const detail = await buildStyleDetail(input.slug);
  if (!detail) {
    return {
      ok: false,
      message: "Style no encontrado.",
    };
  }

  if (
    (input.targetStatus === "ready" || input.targetStatus === "published") &&
    !detail.checklist.hasNoPlaceholder
  ) {
    return {
      ok: false,
      message: "No se puede mover a ready/published porque contiene PLACEHOLDER.",
    };
  }

  if (input.targetStatus === "published" && !detail.checklist.hasCitationForHistorical) {
    return {
      ok: false,
      message: "No se puede publicar contexto historico-cultural sin citation.",
    };
  }

  if (input.targetStatus === "published" && detail.style.status !== "ready") {
    return {
      ok: false,
      message: "Para publicar, el estado actual debe ser ready.",
    };
  }

  if (detail.style.status === input.targetStatus) {
    return {
      ok: true,
      message: `El style ya estaba en estado ${input.targetStatus}.`,
      slug: detail.style.slug,
    };
  }

  await db.style.update({
    where: {
      slug: detail.style.slug,
    },
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
    slug: detail.style.slug,
  };
}

export async function archiveAdminStyleBySlug(input: {
  slug: string;
  actorRole?: string;
}): Promise<AdminTaxonomyMutationResult> {
  assertDatabaseConfigured();

  const permission = requirePermission(input.actorRole, "archive_content");
  if (!permission.ok) {
    return permission.result;
  }

  const style = await db.style.findFirst({
    where: {
      slug: input.slug,
      isArchived: false,
    },
  });
  if (!style) {
    return {
      ok: false,
      message: "Style no encontrado.",
    };
  }

  await db.$transaction([
    db.style.update({
      where: {
        id: style.id,
      },
      data: {
        isArchived: true,
        publishedStatus: "draft",
        version: {
          increment: 1,
        },
      },
    }),
    db.substyle.updateMany({
      where: {
        styleId: style.id,
        isArchived: false,
      },
      data: {
        isArchived: true,
        publishedStatus: "draft",
      },
    }),
  ]);

  return {
    ok: true,
    message: `Style ${style.slug} archivado logicamente.`,
    slug: style.slug,
  };
}

export async function linkCitationToStyleBySlug(input: {
  slug: string;
  title?: string;
  url?: string;
  author?: string;
  year?: string;
  actorRole?: string;
}): Promise<AdminTaxonomyMutationResult> {
  assertDatabaseConfigured();

  const permission = requirePermission(input.actorRole, "link_citation");
  if (!permission.ok) {
    return permission.result;
  }

  const style = await db.style.findFirst({
    where: {
      slug: input.slug,
      isArchived: false,
    },
  });
  if (!style) {
    return {
      ok: false,
      message: "Style no encontrado.",
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
        claimScope: "style editorial validation",
      },
    }));

  await db.citationLink.upsert({
    where: {
      citationId_entityType_entityId: {
        citationId: citation.id,
        entityType: "style",
        entityId: style.id,
      },
    },
    update: {},
    create: {
      citationId: citation.id,
      entityType: "style",
      entityId: style.id,
    },
  });

  return {
    ok: true,
    message: "Citation vinculada correctamente.",
    slug: style.slug,
  };
}

export async function createAdminSubstyle(input: {
  styleSlug?: string;
  slug?: string;
  name?: string;
  summary?: string;
  historicalCulturalContext?: string;
  technicalFocus?: string;
  musicalFocus?: string;
  actorRole?: string;
}): Promise<AdminTaxonomyMutationResult> {
  assertDatabaseConfigured();

  const permission = requirePermission(input.actorRole, "create_content");
  if (!permission.ok) {
    return permission.result;
  }

  const styleSlug = (input.styleSlug ?? "").trim();
  const name = (input.name ?? "").trim();
  const summary = (input.summary ?? "").trim();
  const slug = normalizeSlug((input.slug ?? "").trim() || name);
  const technicalFocus = parseLineArray(input.technicalFocus) ?? [];

  if (!styleSlug || !name || !summary || !slug) {
    return {
      ok: false,
      message: "Campos obligatorios: styleSlug, name, slug, summary.",
    };
  }

  const style = await db.style.findFirst({
    where: {
      slug: styleSlug,
      isArchived: false,
    },
  });
  if (!style) {
    return {
      ok: false,
      message: "Style base no encontrado para substyle.",
    };
  }

  try {
    const substyle = await db.substyle.create({
      data: {
        styleId: style.id,
        slug,
        name,
        summary,
        historicalCulturalContext: (input.historicalCulturalContext ?? "").trim() || null,
        technicalFocus,
        musicalFocus: (input.musicalFocus ?? "").trim() || null,
        publishedStatus: "draft",
      },
    });

    return {
      ok: true,
      message: `Substyle ${substyle.slug} creado en draft.`,
      slug: substyle.slug,
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
      message: "No se pudo crear el substyle.",
    };
  }
}

export async function updateAdminSubstyleBySlug(input: {
  slug: string;
  styleSlug?: string;
  name?: string;
  summary?: string;
  historicalCulturalContext?: string;
  technicalFocus?: string;
  musicalFocus?: string;
  actorRole?: string;
}): Promise<AdminTaxonomyMutationResult> {
  assertDatabaseConfigured();

  const permission = requirePermission(input.actorRole, "edit_content");
  if (!permission.ok) {
    return permission.result;
  }

  const current = await db.substyle.findFirst({
    where: {
      slug: input.slug,
      isArchived: false,
      style: {
        isArchived: false,
      },
    },
    include: {
      style: true,
    },
  });
  if (!current) {
    return {
      ok: false,
      message: "Substyle no encontrado.",
    };
  }

  let styleId = current.styleId;
  if (input.styleSlug !== undefined && input.styleSlug.trim() !== current.style.slug) {
    const targetStyle = await db.style.findFirst({
      where: {
        slug: input.styleSlug.trim(),
        isArchived: false,
      },
    });
    if (!targetStyle) {
      return {
        ok: false,
        message: "Style base no encontrado para mover substyle.",
      };
    }

    styleId = targetStyle.id;
  }

  const nextName = (input.name ?? current.name).trim();
  const nextSummary = (input.summary ?? current.summary).trim();
  const nextTechnicalFocus = parseLineArray(input.technicalFocus) ?? current.technicalFocus;

  if (!nextName || !nextSummary) {
    return {
      ok: false,
      message: "Campos obligatorios: name y summary.",
    };
  }

  await db.substyle.update({
    where: {
      id: current.id,
    },
    data: {
      styleId,
      name: nextName,
      summary: nextSummary,
      historicalCulturalContext:
        input.historicalCulturalContext !== undefined
          ? input.historicalCulturalContext.trim() || null
          : current.historicalCulturalContext,
      technicalFocus: nextTechnicalFocus,
      musicalFocus:
        input.musicalFocus !== undefined
          ? input.musicalFocus.trim() || null
          : current.musicalFocus,
      version: {
        increment: 1,
      },
    },
  });

  return {
    ok: true,
    message: "Substyle actualizado.",
    slug: current.slug,
  };
}

export async function setAdminSubstyleStatusBySlug(input: {
  slug: string;
  targetStatus: EditorialStatus;
  actorRole?: string;
}): Promise<AdminTaxonomyMutationResult> {
  assertDatabaseConfigured();

  const permission = requirePermission(input.actorRole, "set_status", input.targetStatus);
  if (!permission.ok) {
    return permission.result;
  }

  const detail = await buildSubstyleDetail(input.slug);
  if (!detail) {
    return {
      ok: false,
      message: "Substyle no encontrado.",
    };
  }

  if (
    (input.targetStatus === "ready" || input.targetStatus === "published") &&
    !detail.checklist.hasNoPlaceholder
  ) {
    return {
      ok: false,
      message: "No se puede mover a ready/published porque contiene PLACEHOLDER.",
    };
  }

  if (input.targetStatus === "published" && !detail.checklist.hasCitationForHistorical) {
    return {
      ok: false,
      message: "No se puede publicar contexto historico-cultural sin citation.",
    };
  }

  if (input.targetStatus === "published" && detail.substyle.status !== "ready") {
    return {
      ok: false,
      message: "Para publicar, el estado actual debe ser ready.",
    };
  }

  if (detail.substyle.status === input.targetStatus) {
    return {
      ok: true,
      message: `El substyle ya estaba en estado ${input.targetStatus}.`,
      slug: detail.substyle.slug,
    };
  }

  await db.substyle.update({
    where: {
      slug: detail.substyle.slug,
    },
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
    slug: detail.substyle.slug,
  };
}

export async function archiveAdminSubstyleBySlug(input: {
  slug: string;
  actorRole?: string;
}): Promise<AdminTaxonomyMutationResult> {
  assertDatabaseConfigured();

  const permission = requirePermission(input.actorRole, "archive_content");
  if (!permission.ok) {
    return permission.result;
  }

  const substyle = await db.substyle.findFirst({
    where: {
      slug: input.slug,
      isArchived: false,
    },
  });
  if (!substyle) {
    return {
      ok: false,
      message: "Substyle no encontrado.",
    };
  }

  await db.substyle.update({
    where: {
      id: substyle.id,
    },
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
    message: `Substyle ${substyle.slug} archivado logicamente.`,
    slug: substyle.slug,
  };
}

export async function linkCitationToSubstyleBySlug(input: {
  slug: string;
  title?: string;
  url?: string;
  author?: string;
  year?: string;
  actorRole?: string;
}): Promise<AdminTaxonomyMutationResult> {
  assertDatabaseConfigured();

  const permission = requirePermission(input.actorRole, "link_citation");
  if (!permission.ok) {
    return permission.result;
  }

  const substyle = await db.substyle.findFirst({
    where: {
      slug: input.slug,
      isArchived: false,
      style: {
        isArchived: false,
      },
    },
  });
  if (!substyle) {
    return {
      ok: false,
      message: "Substyle no encontrado.",
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
        claimScope: "substyle editorial validation",
      },
    }));

  await db.citationLink.upsert({
    where: {
      citationId_entityType_entityId: {
        citationId: citation.id,
        entityType: "substyle",
        entityId: substyle.id,
      },
    },
    update: {},
    create: {
      citationId: citation.id,
      entityType: "substyle",
      entityId: substyle.id,
    },
  });

  return {
    ok: true,
    message: "Citation vinculada correctamente.",
    slug: substyle.slug,
  };
}
