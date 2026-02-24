import { z } from "zod";
import { ValidationResult, zodToValidationFailure } from "@/server/validation/utils";

const MAX_CODE_LENGTH = 128;
const MAX_REASON_LENGTH = 500;

const verifyCertificateCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "code es obligatorio.")
    .max(MAX_CODE_LENGTH, `code no puede superar ${MAX_CODE_LENGTH} caracteres.`)
    .regex(/^[A-Za-z0-9-]+$/, "code invalido."),
});

export type VerifyCertificateCodeInput = z.infer<typeof verifyCertificateCodeSchema>;

const adminCertificateActionSchema = z.object({
  code: verifyCertificateCodeSchema.shape.code,
  reason: z
    .string()
    .trim()
    .max(MAX_REASON_LENGTH, `reason no puede superar ${MAX_REASON_LENGTH} caracteres.`)
    .optional(),
});

export type AdminCertificateActionInput = z.infer<typeof adminCertificateActionSchema>;

export function validateCertificateCodeInput(
  value: unknown,
): ValidationResult<VerifyCertificateCodeInput> {
  const parsed = verifyCertificateCodeSchema.safeParse(value);
  if (!parsed.success) {
    return zodToValidationFailure(parsed.error, "Codigo de certificado invalido.");
  }

  return {
    ok: true,
    data: parsed.data,
  };
}

export function validateAdminCertificateActionInput(
  value: unknown,
): ValidationResult<AdminCertificateActionInput> {
  const parsed = adminCertificateActionSchema.safeParse(value);
  if (!parsed.success) {
    return zodToValidationFailure(parsed.error, "No se pudo validar la accion de certificado.");
  }

  return {
    ok: true,
    data: parsed.data,
  };
}
