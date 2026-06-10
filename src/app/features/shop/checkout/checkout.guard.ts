import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';

// The checkout has 3 steps. This guard prevents users from jumping to
// step 2 or 3 without going through the previous step.
//
// Simple rule:
//   Step 1 — always accessible (cart review)
//   Step 2 — cart must not be empty (step 1 reviewed)
//   Step 3 — delivery form must have been submitted (tracked in sessionStorage)
export const checkoutGuard: CanActivateFn = (route) => {
  const cartService = inject(CartService);
  const router = inject(Router);

  const step = Number(route.paramMap.get('step'));

  // Step 1 is always accessible
  if (step === 1) return true;

  // Step 2 requires items in the cart
  if (step === 2) {
    if (cartService.itemCount() === 0) {
      return router.createUrlTree(['/shop']); // empty cart → go to shop
    }
    return true;
  }

  // Step 3 requires delivery info to have been saved (set in step 2)
  if (step === 3) {
    const deliveryComplete = sessionStorage.getItem('checkout_step2_done');
    if (!deliveryComplete) {
      return router.createUrlTree(['/shop/checkout/step/2']);
    }
    return true;
  }

  // Unknown step → send back to step 1
  return router.createUrlTree(['/shop/checkout/step/1']);
};
