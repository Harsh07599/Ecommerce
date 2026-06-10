import { Component, Input, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { FormFieldConfig } from './form-field.model';

/*
 * DynamicFormComponent
 * --------------------
 * Renders a form based on a JSON config array.
 * It has NO knowledge of which module is using it — it only cares about the
 * config and the FormGroup it receives as inputs.
 *
 * Used in:
 *   - Task 2: Admin product add/edit form
 *   - Task 3: Checkout step 2 (delivery details)
 */
@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './dynamic-form.component.html',
  styleUrl: './dynamic-form.component.scss',
})
export class DynamicFormComponent implements OnInit {
  // The JSON config array describing the fields to render
  @Input({ required: true }) config: FormFieldConfig[] = [];

  // The reactive FormGroup to bind controls to
  @Input({ required: true }) formGroup!: FormGroup;

  ngOnInit(): void {
    // Apply validators to each form control based on the config
    this.config.forEach(field => {
      const control = this.formGroup.get(field.name);
      if (!control) return;

      const validators = this.buildValidators(field.validators ?? []);
      control.setValidators(validators);
      control.updateValueAndValidity();
    });
  }

  // ─── Determine if a field should be visible ────────────────────────────────
  // Evaluates the visibleWhen predicate string (e.g. "billingDifferent==true")
  isVisible(field: FormFieldConfig): boolean {
    if (!field.visibleWhen) return true; // no condition → always visible

    // Parse "fieldName==value" predicate
    const [controlName, expectedValue] = field.visibleWhen.split('==');
    const controlValue = String(this.formGroup.get(controlName.trim())?.value);
    return controlValue === expectedValue.trim();
  }

  // ─── Build Angular ValidatorFn[] from string config ────────────────────────
  buildValidators(validatorStrings: string[]): ValidatorFn[] {
    return validatorStrings.map(v => {
      if (v === 'required')  return Validators.required;
      if (v === 'email')     return Validators.email;

      // minLength:N
      if (v.startsWith('minLength:')) {
        const n = parseInt(v.split(':')[1], 10);
        return Validators.minLength(n);
      }

      // maxLength:N
      if (v.startsWith('maxLength:')) {
        const n = parseInt(v.split(':')[1], 10);
        return Validators.maxLength(n);
      }

      // pattern:regex
      if (v.startsWith('pattern:')) {
        const pattern = v.substring('pattern:'.length);
        return Validators.pattern(pattern);
      }

      // Unknown validator — skip safely
      return Validators.nullValidator;
    });
  }

  // Helper to get a control for template error display
  getControl(name: string): AbstractControl | null {
    return this.formGroup.get(name);
  }
}
