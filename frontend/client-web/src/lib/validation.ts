/**
 * Lightweight form validation helpers.
 *
 * The app deliberately avoids a form library: every form owns a small
 * `validate()` that returns a map of field name to message. The shared
 * `FormField` component renders those messages inline, so a form never has
 * to hand-roll its own error display.
 */

/** Field-keyed validation messages. */
export type FieldErrors<T extends string> = Partial<Record<T, string>>;

export const MIN_PASSWORD_LENGTH = 8;

/** A simple, forgiving email shape check. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function isBlank(value: string | undefined | null): boolean {
  return !value || value.trim().length === 0;
}

/**
 * Validates the fields shared by every "person" form (agents, customers,
 * branches) and returns the first problem found, or `null` when valid.
 */
export function validatePersonFields(params: {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  requirePassword: boolean;
}): FieldErrors<string> {
  const errors: FieldErrors<string> = {};

  if (isBlank(params.firstName)) {
    errors.firstName = "First name is required.";
  }
  if (isBlank(params.lastName)) {
    errors.lastName = "Last name is required.";
  }
  if (isBlank(params.email)) {
    errors.email = "Email is required.";
  } else if (!isEmail(params.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (params.requirePassword) {
    if (isBlank(params.password)) {
      errors.password = "Password is required.";
    } else if (params.password!.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (params.confirmPassword !== params.password) {
      errors.confirmPassword = "Passwords do not match.";
    }
  }

  return errors;
}

/** True when the map contains at least one message. */
export function hasErrors(errors: FieldErrors<string>): boolean {
  return Object.values(errors).some(Boolean);
}
