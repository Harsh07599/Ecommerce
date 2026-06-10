import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../../core/auth/auth.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-shop-layout',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink,
    MatToolbarModule, MatButtonModule, MatIconModule, MatBadgeModule,
  ],
  template: `
    <!-- Top Navigation Bar -->
    <mat-toolbar color="primary" class="shop-nav">
      <span class="brand" routerLink="/shop/catalogue" style="cursor:pointer">🛍️ ShopApp</span>

      <span class="spacer"></span>

      <!-- Cart icon with live item count badge -->
      <button mat-icon-button routerLink="/shop/checkout/step/1"
              id="cart-nav-btn"
              [matBadge]="cartService.itemCount() > 0 ? cartService.itemCount() : null"
              matBadgeColor="accent">
        <mat-icon>shopping_cart</mat-icon>
      </button>

      <!-- User name + logout -->
      <span class="user-name">{{ auth.currentUser()?.name }}</span>
      <button mat-button (click)="logout()" id="shop-logout-btn">
        <mat-icon>logout</mat-icon> Logout
      </button>
    </mat-toolbar>

    <!-- Page content -->
    <div class="shop-content">
      <router-outlet />
    </div>
  `,
  styles: [`
    .shop-nav { position: sticky; top: 0; z-index: 100; }
    .spacer   { flex: 1; }
    .brand    { font-size: 20px; font-weight: 700; }
    .user-name { margin-right: 8px; font-size: 14px; }
    .shop-content { max-width: 1200px; margin: 0 auto; padding: 24px 16px; }
  `],
})
export class ShopLayoutComponent {
  auth = inject(AuthService);
  cartService = inject(CartService);
  private router = inject(Router);

  logout(): void {
    this.auth.logout();
  }
}
