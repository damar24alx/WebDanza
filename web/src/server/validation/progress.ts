import { z } from "zod";
import { ValidationResult, zodToValidationFailure } from "@/server/validation/utils";

const MAX_SLUG_LENGTH = 120;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const completeLessonSchema = z.object({
  courseSlug: z
    .string()
    .trim()
    .min(1, "courseSlug es obligatorio.")
    .max(MAX_SLUG_LENGTH, `courseSlug no puede superar ${MAX_SLUG_LENGTH} caracteres.`)
    .regex(slugPattern, "courseSlug invalido."),
  lessonSlug: z
    .string()
    .trim()
    .min(1, "lessonSlug es obligatorio.")
    .max(MAX_SLUG_LENGTH, `lessonSlug no puede superar ${MAX_SLUG_LENGTH} caracteres.`)
    .regex(slugPattern, "lessonSlug invalido."),
  redirectTo: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || (value.startsWith("/learn/") && !value.startsWith("//")),
      "redirectTo invalido.",
    ),
});

export type CompleteLessonInput = z.infer<typeof completeLessonSchema>;

export function validateCompleteLessonInput(value: unknown): ValidationResult<CompleteLessonInput> {
  const parsed = completeLessonSchema.safeParse(value);
  if (!parsed.success) {
    return zodToValidationFailure(parsed.error, "No se pudo actualizar el progreso.");
  }

  return {
    ok: true,
    data: parsed.data,
  };
}

const stepProgressSchema = z.object({
  courseSlug: z
    .string()
    .trim()
    .min(1, "courseSlug es obligatorio.")
    .max(MAX_SLUG_LENGTH, `courseSlug no puede superar ${MAX_SLUG_LENGTH} caracteres.`)
    .regex(slugPattern, "courseSlug invalido."),
  lessonSlug: z
    .string()
    .trim()
    .min(1, "lessonSlug es obligatorio.")
    .max(MAX_SLUG_LENGTH, `lessonSlug no puede superar ${MAX_SLUG_LENGTH} caracteres.`)
    .regex(slugPattern, "lessonSlug invalido."),
  stepIndex: z.coerce
    .number()
    .int("stepIndex debe ser entero.")
    .min(0, "stepIndex debe ser mayor o igual a 0.")
    .max(500, "stepIndex fuera de rango."),
  completed: z.boolean(),
  redirectTo: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || (value.startsWith("/learn/") && !value.startsWith("//")),
      "redirectTo invalido.",
    ),
});

export type StepProgressInput = z.infer<typeof stepProgressSchema>;

export function validateStepProgressInput(value: unknown): ValidationResult<StepProgressInput> {
  const parsed = stepProgressSchema.safeParse(value);
  if (!parsed.success) {
    return zodToValidationFailure(parsed.error, "No se pudo actualizar el checklist.");
  }

  return {
    ok: true,
    data: parsed.data,
  };
}
