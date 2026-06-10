import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { adminGuard } from './core/auth/admin.guard';

export const routes: Routes = [
  // Default redirect: go to login if no path matched
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // ─── Public Route ──────────────────────────────────────────────────────────
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },

  // ─── Admin Routes (Task 2) — lazy loaded, requires admin role ─────────────
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadChildren: () =>
      import('./features/admin/admin.routes').then(m => m.adminRoutes),
  },

  // ─── Shop Routes (Task 3) — lazy loaded, requires authenticated session ────
  {
    path: 'shop',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/shop/shop.routes').then(m => m.shopRoutes),
  },

  // Catch-all: redirect unknown paths to login
  { path: '**', redirectTo: '/login' },
];
