import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// Guard: requires any authenticated session.
// If the user is not logged in, redirect to /login and preserve the attempted URL.
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  // Save the attempted URL so we can redirect back after login
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};
