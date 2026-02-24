import { z } from "zod";
import { ValidationResult, zodToValidationFailure } from "@/server/validation/utils";
import { normalizeInternalMediaPath } from "@/server/validation/url";

const MAX_SLUG_LENGTH = 120;
const MAX_TEXT_LENGTH = 4000;
const MAX_SHORT_TEXT = 180;
const MAX_URL_LENGTH = 2048;
const MAX_YEAR = 2100;
const MIN_YEAR = 1800;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const httpProtocols = new Set(["http:", "https:"]);

function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return httpProtocols.has(parsed.protocol);
  } catch {
    return false;
  }
}

function isInternalMediaPath(value: string) {
  return normalizeInternalMediaPath(value) !== undefined;
}

function requiredText(fieldName: string, maxLength = MAX_TEXT_LENGTH) {
  return z
    .string()
    .trim()
    .min(1, `${fieldName} es obligatorio.`)
    .max(maxLength, `${fieldName} no puede superar ${maxLength} caracteres.`);
}

function optionalTrimmedText(maxLength = MAX_TEXT_LENGTH) {
  return z
    .string()
    .trim()
    .max(maxLength, `El campo no puede superar ${maxLength} caracteres.`)
    .optional();
}

function optionalNonEmptyText(fieldName: string, maxLength = MAX_TEXT_LENGTH) {
  return z
    .string()
    .trim()
    .min(1, `${fieldName} no puede estar vacio.`)
    .max(maxLength, `${fieldName} no puede superar ${maxLength} caracteres.`)
    .optional();
}

const requiredSlug = z
  .string()
  .trim()
  .min(1, "slug es obligatorio.")
  .max(MAX_SLUG_LENGTH, `slug no puede superar ${MAX_SLUG_LENGTH} caracteres.`)
  .regex(slugPattern, "slug invalido. Usa minusculas, numeros y guiones.");

const optionalSlug = z
  .string()
  .trim()
  .max(MAX_SLUG_LENGTH, `slug no puede superar ${MAX_SLUG_LENGTH} caracteres.`)
  .refine(
    (value) => value.length === 0 || slugPattern.test(value),
    "slug invalido. Usa minusculas, numeros y guiones.",
  )
  .optional();

const difficultySchema = z.enum(["beginner", "intermediate", "advanced"], {
  message: "difficulty invalido.",
});

const targetStatusSchema = z.enum(["draft", "review", "ready", "published"], {
  message: "targetStatus invalido.",
});

const providerSchema = z
  .string()
  .trim()
  .refine((value) => value === "other", "provider invalido. Usa other (media interna).");

const rightsStatusSchema = z.enum(["unknown", "ok_to_embed", "restricted", "blocked"], {
  message: "rightsStatus invalido.",
});

const mediaEntityTypeSchema = z.enum(["style", "substyle", "move", "lesson", "course"], {
  message: "entityType invalido.",
});

const citationEntityTypeSchema = z.enum(["lesson", "course", "connection"], {
  message: "entityType invalido.",
});

const optionalHttpUrlSchema = z
  .string()
  .trim()
  .max(MAX_URL_LENGTH, `url no puede superar ${MAX_URL_LENGTH} caracteres.`)
  .refine((value) => value.length === 0 || isHttpUrl(value), "url invalida. Usa http/https.")
  .optional();

const optionalInternalMediaPathSchema = z
  .string()
  .trim()
  .max(MAX_URL_LENGTH, `url no puede superar ${MAX_URL_LENGTH} caracteres.`)
  .refine(
    (value) => value.length === 0 || isInternalMediaPath(value),
    "url invalida. Usa ruta interna /media/...",
  )
  .optional();

const requiredInternalMediaPathSchema = z
  .string()
  .trim()
  .min(1, "url es obligatoria.")
  .max(MAX_URL_LENGTH, `url no puede superar ${MAX_URL_LENGTH} caracteres.`)
  .refine((value) => isInternalMediaPath(value), "url invalida. Usa ruta interna /media/...");

const optionalYearSchema = z
  .string()
  .trim()
  .refine((value) => {
    if (!value) {
      return true;
    }
    if (!/^\d{4}$/.test(value)) {
      return false;
    }
    const year = Number.parseInt(value, 10);
    return year >= MIN_YEAR && year <= MAX_YEAR;
  }, "year invalido. Usa formato YYYY.")
  .optional();

const optionalDurationSchema = z
  .string()
  .trim()
  .refine((value) => !value || (/^\d+$/.test(value) && Number.parseInt(value, 10) >= 0), {
    message: "durationSec invalido. Usa entero >= 0.",
  })
  .optional();

const optionalUuidSchema = z
  .string()
  .trim()
  .refine((value) => !value || uuidPattern.test(value), "mediaId invalido.")
  .optional();

const styleCreateSchema = z.object({
  slug: optionalSlug,
  name: requiredText("name", MAX_SHORT_TEXT),
  summary: requiredText("summary", MAX_TEXT_LENGTH),
  categoryPrimary: requiredText("categoryPrimary", MAX_SHORT_TEXT),
  level: difficultySchema,
  historicalCulturalContext: optionalTrimmedText(MAX_TEXT_LENGTH),
  movementPrinciples: optionalTrimmedText(MAX_TEXT_LENGTH),
  musicalityBasics: optionalTrimmedText(MAX_TEXT_LENGTH),
});

const styleUpdateSchema = z.object({
  slug: requiredSlug,
  name: optionalNonEmptyText("name", MAX_SHORT_TEXT),
  summary: optionalNonEmptyText("summary", MAX_TEXT_LENGTH),
  categoryPrimary: optionalNonEmptyText("categoryPrimary", MAX_SHORT_TEXT),
  level: difficultySchema.optional(),
  historicalCulturalContext: optionalTrimmedText(MAX_TEXT_LENGTH),
  movementPrinciples: optionalTrimmedText(MAX_TEXT_LENGTH),
  musicalityBasics: optionalTrimmedText(MAX_TEXT_LENGTH),
});

const styleStatusSchema = z.object({
  slug: requiredSlug,
  targetStatus: targetStatusSchema,
});

const styleArchiveSchema = z.object({
  slug: requiredSlug,
});

const styleCitationSchema = z.object({
  slug: requiredSlug,
  title: requiredText("title", MAX_SHORT_TEXT),
  url: optionalHttpUrlSchema,
  author: optionalTrimmedText(MAX_SHORT_TEXT),
  year: optionalYearSchema,
});

const substyleCreateSchema = z.object({
  styleSlug: requiredSlug,
  slug: optionalSlug,
  name: requiredText("name", MAX_SHORT_TEXT),
  summary: requiredText("summary", MAX_TEXT_LENGTH),
  historicalCulturalContext: optionalTrimmedText(MAX_TEXT_LENGTH),
  technicalFocus: optionalTrimmedText(MAX_TEXT_LENGTH),
  musicalFocus: optionalTrimmedText(MAX_TEXT_LENGTH),
});

const substyleUpdateSchema = z.object({
  slug: requiredSlug,
  styleSlug: optionalSlug,
  name: optionalNonEmptyText("name", MAX_SHORT_TEXT),
  summary: optionalNonEmptyText("summary", MAX_TEXT_LENGTH),
  historicalCulturalContext: optionalTrimmedText(MAX_TEXT_LENGTH),
  technicalFocus: optionalTrimmedText(MAX_TEXT_LENGTH),
  musicalFocus: optionalTrimmedText(MAX_TEXT_LENGTH),
});

const substyleStatusSchema = z.object({
  slug: requiredSlug,
  targetStatus: targetStatusSchema,
});

const substyleArchiveSchema = z.object({
  slug: requiredSlug,
});

const substyleCitationSchema = z.object({
  slug: requiredSlug,
  title: requiredText("title", MAX_SHORT_TEXT),
  url: optionalHttpUrlSchema,
  author: optionalTrimmedText(MAX_SHORT_TEXT),
  year: optionalYearSchema,
});

const moveCreateSchema = z.object({
  slug: optionalSlug,
  name: requiredText("name", MAX_SHORT_TEXT),
  summary: requiredText("summary", MAX_TEXT_LENGTH),
  moveType: requiredText("moveType", MAX_SHORT_TEXT),
  difficulty: difficultySchema,
  family: optionalTrimmedText(MAX_SHORT_TEXT),
  bpmRange: optionalTrimmedText(MAX_SHORT_TEXT),
});

const moveUpdateSchema = z.object({
  slug: requiredSlug,
  name: optionalNonEmptyText("name", MAX_SHORT_TEXT),
  summary: optionalNonEmptyText("summary", MAX_TEXT_LENGTH),
  moveType: optionalNonEmptyText("moveType", MAX_SHORT_TEXT),
  difficulty: difficultySchema.optional(),
  family: optionalTrimmedText(MAX_SHORT_TEXT),
  bpmRange: optionalTrimmedText(MAX_SHORT_TEXT),
  stepByStep: optionalTrimmedText(MAX_TEXT_LENGTH),
  commonMistakes: optionalTrimmedText(MAX_TEXT_LENGTH),
});

const moveStatusSchema = z.object({
  slug: requiredSlug,
  targetStatus: targetStatusSchema,
});

const moveArchiveSchema = z.object({
  slug: requiredSlug,
});

const moveCitationSchema = z.object({
  slug: requiredSlug,
  title: requiredText("title", MAX_SHORT_TEXT),
  url: optionalHttpUrlSchema,
  author: optionalTrimmedText(MAX_SHORT_TEXT),
  year: optionalYearSchema,
});

const mediaCreateSchema = z.object({
  provider: providerSchema,
  url: requiredInternalMediaPathSchema,
  title: requiredText("title", MAX_SHORT_TEXT),
  rightsStatus: rightsStatusSchema,
  durationSec: optionalDurationSchema,
});

const mediaLinkSchema = z
  .object({
    entityType: mediaEntityTypeSchema,
    entityRef: requiredText("entityRef", MAX_SHORT_TEXT),
    mediaId: optionalUuidSchema,
    mediaUrl: optionalInternalMediaPathSchema,
    role: optionalTrimmedText(MAX_SHORT_TEXT),
  })
  .superRefine((value, ctx) => {
    if (!value.mediaId && !value.mediaUrl) {
      ctx.addIssue({
        code: "custom",
        path: ["mediaId"],
        message: "Debes enviar mediaId o mediaUrl.",
      });
      ctx.addIssue({
        code: "custom",
        path: ["mediaUrl"],
        message: "Debes enviar mediaId o mediaUrl.",
      });
    }
  });

const mediaUnlinkSchema = z
  .object({
    entityType: mediaEntityTypeSchema,
    entityRef: requiredText("entityRef", MAX_SHORT_TEXT),
    mediaId: optionalUuidSchema,
    mediaUrl: optionalInternalMediaPathSchema,
  })
  .superRefine((value, ctx) => {
    if (!value.mediaId && !value.mediaUrl) {
      ctx.addIssue({
        code: "custom",
        path: ["mediaId"],
        message: "Debes enviar mediaId o mediaUrl.",
      });
      ctx.addIssue({
        code: "custom",
        path: ["mediaUrl"],
        message: "Debes enviar mediaId o mediaUrl.",
      });
    }
  });

const mediaCreateLinkSchema = z.object({
  provider: providerSchema,
  url: requiredInternalMediaPathSchema,
  title: requiredText("title", MAX_SHORT_TEXT),
  rightsStatus: rightsStatusSchema,
  durationSec: optionalDurationSchema,
  entityType: mediaEntityTypeSchema,
  entityRef: requiredText("entityRef", MAX_SHORT_TEXT),
  role: optionalTrimmedText(MAX_SHORT_TEXT),
});

const mediaUploadLinkSchema = z.object({
  title: requiredText("title", MAX_SHORT_TEXT),
  rightsStatus: rightsStatusSchema,
  durationSec: optionalDurationSchema,
  entityType: mediaEntityTypeSchema,
  entityRef: requiredText("entityRef", MAX_SHORT_TEXT),
  role: optionalTrimmedText(MAX_SHORT_TEXT),
});

const citationLinkSchema = z.object({
  entityType: citationEntityTypeSchema,
  entityRef: requiredText("entityRef", MAX_SHORT_TEXT),
  title: requiredText("title", MAX_SHORT_TEXT),
  url: optionalHttpUrlSchema,
  author: optionalTrimmedText(MAX_SHORT_TEXT),
  year: optionalYearSchema,
});

function parseSchema<T>(
  schema: z.ZodType<T>,
  value: unknown,
  fallbackMessage: string,
): ValidationResult<T> {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    return zodToValidationFailure(parsed.error, fallbackMessage);
  }

  return {
    ok: true,
    data: parsed.data,
  };
}

export function validateStyleCreateInput(value: unknown) {
  return parseSchema(styleCreateSchema, value, "No se pudo crear el style.");
}

export function validateStyleUpdateInput(value: unknown) {
  return parseSchema(styleUpdateSchema, value, "No se pudo actualizar el style.");
}

export function validateStyleStatusInput(value: unknown) {
  return parseSchema(styleStatusSchema, value, "No se pudo actualizar el estado del style.");
}

export function validateStyleArchiveInput(value: unknown) {
  return parseSchema(styleArchiveSchema, value, "No se pudo archivar el style.");
}

export function validateStyleCitationInput(value: unknown) {
  return parseSchema(styleCitationSchema, value, "No se pudo vincular la citation del style.");
}

export function validateSubstyleCreateInput(value: unknown) {
  return parseSchema(substyleCreateSchema, value, "No se pudo crear el substyle.");
}

export function validateSubstyleUpdateInput(value: unknown) {
  return parseSchema(substyleUpdateSchema, value, "No se pudo actualizar el substyle.");
}

export function validateSubstyleStatusInput(value: unknown) {
  return parseSchema(
    substyleStatusSchema,
    value,
    "No se pudo actualizar el estado del substyle.",
  );
}

export function validateSubstyleArchiveInput(value: unknown) {
  return parseSchema(substyleArchiveSchema, value, "No se pudo archivar el substyle.");
}

export function validateSubstyleCitationInput(value: unknown) {
  return parseSchema(
    substyleCitationSchema,
    value,
    "No se pudo vincular la citation del substyle.",
  );
}

export function validateMoveCreateInput(value: unknown) {
  return parseSchema(moveCreateSchema, value, "No se pudo crear el move.");
}

export function validateMoveUpdateInput(value: unknown) {
  return parseSchema(moveUpdateSchema, value, "No se pudo actualizar el move.");
}

export function validateMoveStatusInput(value: unknown) {
  return parseSchema(moveStatusSchema, value, "No se pudo actualizar el estado del move.");
}

export function validateMoveArchiveInput(value: unknown) {
  return parseSchema(moveArchiveSchema, value, "No se pudo archivar el move.");
}

export function validateMoveCitationInput(value: unknown) {
  return parseSchema(moveCitationSchema, value, "No se pudo vincular la citation del move.");
}

export function validateMediaCreateInput(value: unknown) {
  return parseSchema(mediaCreateSchema, value, "No se pudo crear la media.");
}

export function validateMediaLinkInput(value: unknown) {
  return parseSchema(mediaLinkSchema, value, "No se pudo vincular la media.");
}

export function validateMediaUnlinkInput(value: unknown) {
  return parseSchema(mediaUnlinkSchema, value, "No se pudo desvincular la media.");
}

export function validateMediaCreateLinkInput(value: unknown) {
  return parseSchema(
    mediaCreateLinkSchema,
    value,
    "No se pudo crear y vincular la media.",
  );
}

export function validateMediaUploadLinkInput(value: unknown) {
  return parseSchema(
    mediaUploadLinkSchema,
    value,
    "No se pudo subir y vincular la media.",
  );
}

export function validateCitationLinkInput(value: unknown) {
  return parseSchema(citationLinkSchema, value, "No se pudo vincular la citation.");
}
