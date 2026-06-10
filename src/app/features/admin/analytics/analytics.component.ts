import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss',
})
export class AnalyticsComponent {
  orderService = inject(OrderService); // public so template can access orders()

  // ─── Derived analytics from the shared order signal store ─────────────────
  totalOrders = computed(() => this.orderService.orders().length);

  totalRevenue = computed(() =>
    this.orderService.orders()
      .filter(o => o.status === 'Confirmed')
      .reduce((sum, o) => sum + o.total, 0)
  );

  pendingCount = computed(() =>
    this.orderService.orders().filter(o => o.status === 'Pending').length
  );

  cancelledCount = computed(() =>
    this.orderService.orders().filter(o => o.status === 'Cancelled').length
  );

  confirmedCount = computed(() =>
    this.orderService.orders().filter(o => o.status === 'Confirmed').length
  );

  // Summary cards displayed in the dashboard
  summaryCards = computed(() => [
    { label: 'Total Orders',    value: this.totalOrders(),    icon: 'receipt_long', color: '#3f51b5' },
    { label: 'Revenue',         value: `$${this.totalRevenue()}`, icon: 'attach_money', color: '#4caf50' },
    { label: 'Pending',         value: this.pendingCount(),   icon: 'schedule',     color: '#ff9800' },
    { label: 'Confirmed',       value: this.confirmedCount(), icon: 'check_circle', color: '#2196f3' },
    { label: 'Cancelled',       value: this.cancelledCount(), icon: 'cancel',       color: '#f44336' },
  ]);
}
