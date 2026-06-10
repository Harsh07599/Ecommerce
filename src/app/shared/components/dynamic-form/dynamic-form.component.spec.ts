import { DynamicFormComponent } from './dynamic-form.component';
import { FormControl, FormGroup } from '@angular/forms';
import { FormFieldConfig } from './form-field.model';

describe('DynamicFormComponent — visibleWhen predicate', () => {
  let component: DynamicFormComponent;
  let form: FormGroup;

  beforeEach(() => {
    component = new DynamicFormComponent();
    form = new FormGroup({
      billingDifferent: new FormControl('true'),
      billingAddress:   new FormControl(''),
    });
    component.formGroup = form;
    component.config = [];
  });

  it('should show a field when visibleWhen condition is true', () => {
    const field: FormFieldConfig = {
      name: 'billingAddress',
      type: 'text',
      label: 'Billing Address',
      visibleWhen: 'billingDifferent==true',
    };
    expect(component.isVisible(field)).toBeTrue();
  });

  it('should hide a field when visibleWhen condition is false', () => {
    form.patchValue({ billingDifferent: 'false' });
    const field: FormFieldConfig = {
      name: 'billingAddress',
      type: 'text',
      label: 'Billing Address',
      visibleWhen: 'billingDifferent==true',
    };
    expect(component.isVisible(field)).toBeFalse();
  });

  it('should always show a field with no visibleWhen', () => {
    const field: FormFieldConfig = {
      name: 'email',
      type: 'email',
      label: 'Email',
    };
    expect(component.isVisible(field)).toBeTrue();
  });
});
