import {
  Component, OnInit, signal, inject, ChangeDetectionStrategy, DestroyRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { CartTotalPipe } from '../../../shared/pipes/cart-total.pipe';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { FormFieldConfig } from '../../../shared/components/dynamic-form/form-field.model';
import { luhnValidator } from '../../../shared/validators/luhn.validator';
import { Order } from '../../../core/services/order.model';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatStepperModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatCheckboxModule, MatSnackBarModule,
    CartTotalPipe, DynamicFormComponent,
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit {
  private route       = inject(ActivatedRoute);
  private router      = inject(Router);
  private fb          = inject(FormBuilder);
  private http        = inject(HttpClient);
  private cartService = inject(CartService);
  private orderService= inject(OrderService);
  private authService = inject(AuthService);
  private snackBar    = inject(MatSnackBar);
  private destroyRef  = inject(DestroyRef);

  // Current checkout step (1-based from route param)
  currentStep = signal(1);

  // Convenience access to cart items
  cartItems = this.cartService.items;

  // ─── Step 2: Delivery form loaded from JSON ────────────────────────────────
  deliveryFormConfig = signal<FormFieldConfig[]>([]);
  deliveryForm!: FormGroup;

  // ─── Step 3: Payment form ──────────────────────────────────────────────────
  paymentForm!: FormGroup;
  billingDifferent = signal(false);
  isSubmitting = signal(false);

  ngOnInit(): void {
    // Read which step we're on from the route param
    this.route.paramMap.subscribe(params => {
      this.currentStep.set(Number(params.get('step')) || 1);
    });

    // Step 1: if cart is empty, redirect to shop
    if (this.cartService.itemCount() === 0) {
      this.router.navigate(['/shop']);
      return;
    }

    // Initialize delivery form with empty controls (validators are added by DynamicFormComponent)
    this.deliveryForm = this.fb.group({
      email: [''], fullName: [''], phone: [''],
      address: [''], city: [''], state: [''], zip: [''],
      country: [''], deliveryNotes: [''],
    });

    // Load checkout form JSON config for step 2
    this.http.get<FormFieldConfig[]>('/assets/checkout-form.json')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(config => this.deliveryFormConfig.set(config));

    // Payment form — uses Luhn validator on card number
    this.paymentForm = this.fb.group({
      cardNumber: ['', [Validators.required, luhnValidator]],
      cardName:   ['', Validators.required],
      expiry:     ['', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}$/)]],
      cvv:        ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
      // Billing address fields (shown only when billingDifferent is true)
      billAddress:[''],
      billCity:   [''],
      billZip:    [''],
    });
  }

  // ─── Step navigation ───────────────────────────────────────────────────────
  goToStep(step: number): void {
    this.router.navigate(['/shop/checkout/step', step]);
  }

  completeStep2(): void {
    if (this.deliveryForm.invalid) {
      this.deliveryForm.markAllAsTouched();
      return;
    }
    // Mark step 2 as done so the guard allows step 3
    sessionStorage.setItem('checkout_step2_done', 'true');
    this.goToStep(3);
  }

  // ─── Order submission ──────────────────────────────────────────────────────
  submitOrder(): void {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const user = this.authService.currentUser()!;

    // Build the order object
    const newOrder: Order = {
      id: 'ORD-' + Date.now(),
      customerId: user.id,
      customerName: user.name,
      items: this.cartItems().map(item => ({
        productId:   item.productId,
        productName: item.productName,
        quantity:    item.quantity,
        unitPrice:   item.unitPrice,
      })),
      total: this.cartItems().reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
      status: 'Confirmed',
      createdAt: new Date().toISOString(),
    };

    // Optimistic success: add order + clear cart immediately
    this.orderService.addOrder(newOrder);
    this.cartService.clearCart();
    sessionStorage.removeItem('checkout_step2_done');

    this.isSubmitting.set(false);
    this.snackBar.open('Order placed successfully! 🎉', 'OK', { duration: 3000 });
    this.router.navigate(['/shop/order-confirmation', newOrder.id]);
  }
}
