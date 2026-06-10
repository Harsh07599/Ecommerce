import { luhnValidator } from './luhn.validator';
import { FormControl } from '@angular/forms';

describe('luhnValidator', () => {
  // Helper to run the validator on a string value
  const validate = (value: string) => luhnValidator(new FormControl(value));

  it('should return null for a valid card number (Visa test: 4242424242424242)', () => {
    expect(validate('4242424242424242')).toBeNull();
  });

  it('should return null for another valid card number (Mastercard test: 5555555555554444)', () => {
    expect(validate('5555555555554444')).toBeNull();
  });

  it('should return an error for an invalid card number', () => {
    const result = validate('1234567890123456');
    expect(result).not.toBeNull();
    expect(result?.['luhn']).toBeTruthy();
  });

  it('should return an error for a number that is too short', () => {
    const result = validate('123456789012');
    expect(result?.['luhn']).toContain('13–19');
  });

  it('should return an error for non-digit characters', () => {
    const result = validate('4242-4242-4242-4242');
    expect(result?.['luhn']).toContain('only digits');
  });

  it('should return null for an empty value (required handles empty)', () => {
    expect(validate('')).toBeNull();
  });

  it('should handle card number with spaces stripped', () => {
    // Spaces are stripped before validation
    expect(validate('4242424242424242')).toBeNull();
  });
});
