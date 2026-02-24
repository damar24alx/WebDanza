import { z } from "zod";
import { ValidationResult, zodToValidationFailure } from "@/server/validation/utils";

const MAX_EMAIL_LENGTH = 254;
const MAX_NAME_LENGTH = 60;
const MAX_PASSWORD_LENGTH = 72;

const emailSchema = z
  .string()
  .trim()
  .min(1, "El correo es obligatorio.")
  .max(MAX_EMAIL_LENGTH, `El correo no puede superar ${MAX_EMAIL_LENGTH} caracteres.`)
  .email("Ingresa un correo valido.")
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(MAX_PASSWORD_LENGTH, `La contraseña no puede superar ${MAX_PASSWORD_LENGTH} caracteres.`)
  .regex(/[a-zA-Z]/, "La contraseña debe incluir al menos una letra.")
  .regex(/\d/, "La contraseña debe incluir al menos un numero.");

const registerNameSchema = z
  .string()
  .trim()
  .min(1, "Este campo es obligatorio.")
  .max(MAX_NAME_LENGTH, `Este campo no puede superar ${MAX_NAME_LENGTH} caracteres.`);

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "La contraseña es obligatoria."),
});

const registerSchema = z
  .object({
    firstName: registerNameSchema,
    lastName: registerNameSchema,
    email: emailSchema,
    password: passwordSchema,
    passwordConfirm: z.string().min(1, "Confirma tu contraseña."),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.passwordConfirm) {
      ctx.addIssue({
        code: "custom",
        path: ["passwordConfirm"],
        message: "Las contraseñas no coinciden.",
      });
    }
  });

const recoveryRequestSchema = z.object({
  email: emailSchema,
});

const recoveryResetSchema = z
  .object({
    token: z
      .string()
      .trim()
      .min(20, "El token de recuperacion es invalido.")
      .max(256, "El token de recuperacion es invalido."),
    password: passwordSchema,
    passwordConfirm: z.string().min(1, "Confirma tu contrasena."),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.passwordConfirm) {
      ctx.addIssue({
        code: "custom",
        path: ["passwordConfirm"],
        message: "Las contrasenas no coinciden.",
      });
    }
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RecoveryRequestInput = z.infer<typeof recoveryRequestSchema>;
export type RecoveryResetInput = z.infer<typeof recoveryResetSchema>;

export function validateLoginInput(value: unknown): ValidationResult<LoginInput> {
  const parsed = loginSchema.safeParse(value);
  if (!parsed.success) {
    return zodToValidationFailure(parsed.error, "Usuario no encontrado o contraseña incorrecta.");
  }

  return {
    ok: true,
    data: parsed.data,
  };
}

export function validateRegisterInput(value: unknown): ValidationResult<RegisterInput> {
  const parsed = registerSchema.safeParse(value);
  if (!parsed.success) {
    return zodToValidationFailure(parsed.error, "No se pudo crear la cuenta. Revisa los campos.");
  }

  return {
    ok: true,
    data: parsed.data,
  };
}

export function validateRecoveryRequestInput(
  value: unknown,
): ValidationResult<RecoveryRequestInput> {
  const parsed = recoveryRequestSchema.safeParse(value);
  if (!parsed.success) {
    return zodToValidationFailure(
      parsed.error,
      "No se pudo procesar la solicitud de recuperacion.",
    );
  }

  return {
    ok: true,
    data: parsed.data,
  };
}

export function validateRecoveryResetInput(
  value: unknown,
): ValidationResult<RecoveryResetInput> {
  const parsed = recoveryResetSchema.safeParse(value);
  if (!parsed.success) {
    return zodToValidationFailure(
      parsed.error,
      "No se pudo completar la recuperacion de contrasena.",
    );
  }

  return {
    ok: true,
    data: parsed.data,
  };
}
