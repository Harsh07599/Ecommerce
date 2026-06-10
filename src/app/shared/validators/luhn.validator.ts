import { AbstractControl, ValidationErrors } from '@angular/forms';

/*
 * Luhn Algorithm Validator
 * ─────────────────────────
 * Used for card number validation in checkout step 3.
 * The Luhn algorithm is the standard checksum formula used by credit cards.
 *
 * How it works:
 * 1. From the rightmost digit, double every second digit.
 * 2. If doubling results in a number > 9, subtract 9.
 * 3. Sum all the digits.
 * 4. If the total modulo 10 is 0, the number is valid.
 */
export function luhnValidator(control: AbstractControl): ValidationErrors | null {
  const raw = String(control.value ?? '').replace(/\s+/g, '');

  if (!raw) return null; // let 'required' handle empty

  if (!/^\d+$/.test(raw)) {
    return { luhn: 'Card number must contain only digits' };
  }

  if (raw.length < 13 || raw.length > 19) {
    return { luhn: 'Card number must be 13–19 digits' };
  }

  // Apply the Luhn checksum
  let sum = 0;
  let isEven = false;

  for (let i = raw.length - 1; i >= 0; i--) {
    let digit = parseInt(raw[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0 ? null : { luhn: 'Invalid card number' };
}
