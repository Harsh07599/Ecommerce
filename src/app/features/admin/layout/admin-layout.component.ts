import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatSidenavModule, MatListModule,
    MatIconModule, MatButtonModule, MatDividerModule,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {
  auth = inject(AuthService);
  router = inject(Router);

  // Sidebar navigation links
  navLinks = [
    { path: '/admin/products', icon: 'inventory_2', label: 'Products' },
    { path: '/admin/orders',   icon: 'receipt_long', label: 'Orders'   },
    { path: '/admin/analytics',icon: 'bar_chart',    label: 'Analytics'},
  ];

  logout(): void {
    this.auth.logout();
  }
}
