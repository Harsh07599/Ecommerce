import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// Guard: requires the admin role specifically.
// If authenticated but not admin, redirect to /shop.
// If not authenticated at all, redirect to /login.
export const adminGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  if (auth.role() === 'admin') {
    return true;
  }

  // Authenticated user but not an admin — send them to the shop
  return router.createUrlTree(['/shop']);
};
