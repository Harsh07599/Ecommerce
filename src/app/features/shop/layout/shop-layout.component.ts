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
  templateUrl: './shop-layout.component.html',
  styleUrl: './shop-layout.component.scss'
})
export class ShopLayoutComponent {
  auth = inject(AuthService);
  cartService = inject(CartService);
  private router = inject(Router);

  logout(): void {
    this.auth.logout();
  }
}
