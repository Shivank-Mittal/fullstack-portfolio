import { AbstractControl, ValidationErrors } from '@angular/forms';

export function strongPasswordValidator(
  control: AbstractControl
): ValidationErrors | null {
  const value = control.value;

  if (!value) return null;

  const hasLower = /[a-z]/.test(value);
  const hasUpper = /[A-Z]/.test(value);
  const hasDigit = /\d/.test(value);

  if (hasLower && hasUpper && hasDigit) {
    return null;
  }

  return { strongPassword: true };
}