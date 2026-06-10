import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/services/order.model';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, RouterLink],
  template: `
    <div class="confirmation-page">
      <div class="confirmation-card">
        <mat-icon class="success-icon">check_circle</mat-icon>
        <h1>Order Placed!</h1>
        <p class="order-id">Order ID: <strong>{{ orderId }}</strong></p>

        @if (order()) {
          <div class="order-details">
            <p>Thank you, {{ order()!.customerName }}! Your order has been confirmed.</p>
            <p><strong>Total Paid:</strong> \${{ order()!.total }}</p>
            <p><strong>Items:</strong> {{ order()!.items.length }}</p>
            <p><strong>Date:</strong> {{ order()!.createdAt | date:'medium' }}</p>
          </div>
        }

        <div class="actions">
          <button mat-raised-button color="primary" routerLink="/shop/catalogue" id="continue-shopping-btn">
            <mat-icon>shopping_bag</mat-icon> Continue Shopping
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirmation-page {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 60vh;
    }
    .confirmation-card {
      text-align: center;
      background: white;
      border-radius: 16px;
      padding: 48px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      max-width: 480px;
    }
    .success-icon {
      font-size: 72px; width: 72px; height: 72px;
      color: #4caf50; margin-bottom: 16px;
    }
    h1 { margin: 0 0 8px; }
    .order-id { color: #666; margin: 0 0 24px; }
    .order-details {
      text-align: left;
      background: #f9f9f9;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
      p { margin: 6px 0; }
    }
  `],
})
export class OrderConfirmationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);

  orderId = '';
  order = signal<Order | null>(null);

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id') ?? '';
    // Look up the order from the shared signal store
    const found = this.orderService.orders().find(o => o.id === this.orderId) ?? null;
    this.order.set(found);
  }
}
