import { Routes } from '@angular/router';
import { checkoutGuard } from './checkout/checkout.guard';
import { productResolver } from './product-detail/product.resolver';

export const shopRoutes: Routes = [
  // Default: redirect /shop to /shop/catalogue
  { path: '', redirectTo: 'catalogue', pathMatch: 'full' },

  // All shop pages live inside the shared shop layout (nav + cart icon)
  {
    path: '',
    loadComponent: () =>
      import('./layout/shop-layout.component').then(m => m.ShopLayoutComponent),
    children: [
      {
        path: 'catalogue',
        loadComponent: () =>
          import('./catalogue/catalogue.component').then(m => m.CatalogueComponent),
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import('./product-detail/product-detail.component').then(m => m.ProductDetailComponent),
        resolve: {
          // Route resolver: product is loaded before navigation completes
          product: productResolver,
        },
      },
      {
        path: 'checkout/step/:step',
        canActivate: [checkoutGuard],
        loadComponent: () =>
          import('./checkout/checkout.component').then(m => m.CheckoutComponent),
      },
      {
        path: 'order-confirmation/:id',
        loadComponent: () =>
          import('./order-confirmation/order-confirmation.component')
            .then(m => m.OrderConfirmationComponent),
      },
    ],
  },
];
