import { ZodError } from "zod";

export type ValidationFailure = {
  ok: false;
  formError: string;
  fieldErrors: Record<string, string[]>;
};

export type ValidationSuccess<T> = {
  ok: true;
  data: T;
};

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export function zodToValidationFailure(
  error: ZodError,
  fallbackMessage: string,
): ValidationFailure {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = issue.path[0]?.toString() ?? "form";
    if (!fieldErrors[key]) {
      fieldErrors[key] = [];
    }
    fieldErrors[key].push(issue.message);
  }

  const formError = fieldErrors.form?.[0] ?? fallbackMessage;
  return {
    ok: false,
    formError,
    fieldErrors,
  };
}

