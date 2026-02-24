import { z } from "zod";
import { ValidationResult, zodToValidationFailure } from "@/server/validation/utils";

const webVitalNameSchema = z.enum(["CLS", "LCP", "FCP", "TTFB", "INP"], {
  message: "name invalido.",
});

const webVitalRatingSchema = z.enum(["good", "needs-improvement", "poor", "unknown"], {
  message: "rating invalido.",
});

const webVitalPayloadSchema = z.object({
  name: webVitalNameSchema,
  value: z.number().finite("value invalido.").min(0, "value invalido.").max(10_000_000, "value invalido."),
  rating: webVitalRatingSchema,
  id: z
    .string()
    .trim()
    .min(1, "id invalido.")
    .max(120, "id invalido."),
  path: z
    .string()
    .trim()
    .min(1, "path invalido.")
    .max(500, "path invalido.")
    .refine((value) => value.startsWith("/"), "path invalido."),
  navigationType: z
    .string()
    .trim()
    .min(1, "navigationType invalido.")
    .max(40, "navigationType invalido."),
});

export type WebVitalPayload = z.infer<typeof webVitalPayloadSchema>;

export function validateWebVitalPayload(value: unknown): ValidationResult<WebVitalPayload> {
  const parsed = webVitalPayloadSchema.safeParse(value);
  if (!parsed.success) {
    return zodToValidationFailure(parsed.error, "Payload de web vitals invalido.");
  }

  return {
    ok: true,
    data: parsed.data,
  };
}
