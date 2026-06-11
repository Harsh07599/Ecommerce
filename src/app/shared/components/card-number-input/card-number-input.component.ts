import {
  Component, forwardRef, signal, ChangeDetectionStrategy, HostBinding,
} from '@angular/core';
import {
  ControlValueAccessor, NG_VALUE_ACCESSOR, NG_VALIDATORS,
  AbstractControl, ValidationErrors, Validator,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

/*
 * CardNumberInputComponent
 * ─────────────────────────
 * A custom ControlValueAccessor + Validator that:
 *   1. Formats the card number as "XXXX XXXX XXXX XXXX" in real time.
 *   2. Strips spaces before writing raw digits back to the parent FormGroup.
 *   3. Runs the Luhn checksum algorithm inline for real-time feedback.
 *   4. Integrates seamlessly into any ReactiveForm — the host just does:
 *         formControlName="cardNumber"
 *      No knowledge of this component's internals is required.
 *
 * WHY a ControlValueAccessor instead of a plain input + Validator?
 * ─────────────────────────────────────────────────────────────────
 * The requirement asks for a custom CVA component so that:
 *   - The formatting logic (4-digit grouping) lives INSIDE the component.
 *   - The parent FormGroup always receives a clean, unformatted digit string.
 *   - The validation (Luhn) is also encapsulated — the parent doesn't need
 *     to know WHICH validator is applied, only that the control can be invalid.
 */
@Component({
  selector: 'app-card-number-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  providers: [
    // Register as a ControlValueAccessor so Angular treats this as a form control
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CardNumberInputComponent),
      multi: true,
    },
    // Register as a Validator so the parent FormGroup picks up Luhn errors
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => CardNumberInputComponent),
      multi: true,
    },
  ],
  template: `
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>Card Number</mat-label>
      <mat-icon matPrefix>credit_card</mat-icon>
      <input
        matInput
        type="text"
        inputmode="numeric"
        maxlength="19"
        [value]="displayValue()"
        [disabled]="isDisabled()"
        (input)="onInput($event)"
        (blur)="onTouched()"
        placeholder="4242 4242 4242 4242"
        id="card-number"
        autocomplete="cc-number"
      />
      @if (errorMessage()) {
        <mat-error>{{ errorMessage() }}</mat-error>
      }
    </mat-form-field>
  `,
  styles: [`.full-width { width: 100%; }`],
})
export class CardNumberInputComponent implements ControlValueAccessor, Validator {

  // ─── Internal state ────────────────────────────────────────────────────────
  // displayValue holds the formatted "XXXX XXXX XXXX XXXX" string shown in the input
  displayValue = signal('');
  // isDisabled tracks the disabled state pushed by the parent form
  isDisabled   = signal(false);
  // errorMessage is shown in the mat-error slot
  errorMessage = signal('');

  // ─── CVA callbacks ────────────────────────────────────────────────────────
  // These are registered by Angular when the control is connected to the form
  private onChange:  (value: string) => void = () => {};
  // onTouched is called publicly from the template on (blur)
  onTouched: () => void = () => {};

  // ─── ControlValueAccessor: parent → component ─────────────────────────────
  // Called when the parent form programmatically sets a value (e.g. patchValue)
  writeValue(raw: string): void {
    const digits = (raw ?? '').replace(/\D/g, '');
    this.displayValue.set(this.formatCard(digits));
  }

  registerOnChange(fn: (v: string) => void): void  { this.onChange   = fn; }
  registerOnTouched(fn: () => void): void          { this.onTouched  = fn; }
  setDisabledState(isDisabled: boolean): void      { this.isDisabled.set(isDisabled); }

  // ─── Validator: Luhn algorithm ─────────────────────────────────────────────
  // Called by Angular's form system every time the value changes
  validate(control: AbstractControl): ValidationErrors | null {
    const raw = String(control.value ?? '').replace(/\s/g, '');

    if (!raw) return null; // let 'required' handle empty

    if (!/^\d+$/.test(raw)) {
      return { luhn: 'Card number must contain only digits' };
    }
    if (raw.length < 13 || raw.length > 19) {
      return { luhn: 'Card number must be 13–19 digits' };
    }

    return this.luhnCheck(raw)
      ? null
      : { luhn: 'Invalid card number (fails Luhn check)' };
  }

  // ─── Input handler: component → parent ────────────────────────────────────
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Strip all non-digit characters from what the user typed
    const rawDigits = input.value.replace(/\D/g, '').substring(0, 16);
    // Re-format with spaces for display
    const formatted = this.formatCard(rawDigits);

    // Update the displayed value (formatted) and the parent value (raw digits)
    this.displayValue.set(formatted);
    // Reposition cursor after formatting
    const cursorPos = formatted.length;
    setTimeout(() => { input.setSelectionRange(cursorPos, cursorPos); }, 0);

    // Emit raw digits to the parent FormGroup
    this.onChange(rawDigits);

    // Update the error message shown under the field
    this.errorMessage.set(this.getErrorMessage(rawDigits));
  }

  // ─── Private helpers ───────────────────────────────────────────────────────
  private formatCard(digits: string): string {
    // Groups of 4 separated by spaces: "4242 4242 4242 4242"
    return digits.match(/.{1,4}/g)?.join(' ') ?? '';
  }

  private getErrorMessage(digits: string): string {
    if (!digits) return '';
    if (digits.length < 13) return 'Card number too short';
    if (!this.luhnCheck(digits)) return 'Invalid card number';
    return '';
  }

  private luhnCheck(digits: string): boolean {
    let sum = 0;
    let isEven = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let d = parseInt(digits[i], 10);
      if (isEven) { d *= 2; if (d > 9) d -= 9; }
      sum += d;
      isEven = !isEven;
    }
    return sum % 10 === 0;
  }
}
