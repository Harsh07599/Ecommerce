// Config shape for a single dynamic form field
// This matches the structure in /assets/checkout-form.json and admin product form configs
export interface FormFieldConfig {
  name: string;           // FormControl name — must match FormGroup key
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'number';
  label: string;
  placeholder?: string;
  validators?: string[];  // e.g. ['required', 'email', 'minLength:3', 'pattern:^[0-9]+$']
  options?: string[];     // Only for type='select'

  // Optional predicate string — e.g. "billingDifferent==true"
  // When set, the field is only shown when this condition is met
  visibleWhen?: string;
}
