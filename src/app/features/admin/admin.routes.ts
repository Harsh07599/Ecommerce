import { Routes } from '@angular/router';

// All admin sections are lazy-loaded here under /admin
export const adminRoutes: Routes = [
  // Default: redirect /admin to /admin/products
  { path: '', redirectTo: 'products', pathMatch: 'full' },

  // Each section is wrapped inside the admin layout component
  {
    path: '',
    loadComponent: () =>
      import('./layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: 'products',
        loadComponent: () =>
          import('./products/products.component').then(m => m.ProductsComponent),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./orders/orders.component').then(m => m.OrdersComponent),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./analytics/analytics.component').then(m => m.AnalyticsComponent),
      },
    ],
  },
];
