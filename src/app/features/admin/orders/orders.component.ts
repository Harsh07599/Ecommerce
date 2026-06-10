import {
  Component, OnInit, signal, inject, ChangeDetectionStrategy, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatChipsModule } from '@angular/material/chips';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { Order, OrderStatus } from '../../../core/services/order.model';

@Component({
  selector: 'app-orders',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatSelectModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatSidenavModule, MatChipsModule,
  ],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
})
export class OrdersComponent {
  private orderService = inject(OrderService);
  private fb = inject(FormBuilder);

  // All statuses for the filter chips
  readonly statusOptions: ('All' | OrderStatus)[] = ['All', 'Pending', 'Confirmed', 'Cancelled'];

  // Currently selected status filter and selected order for the side-panel
  selectedStatus = signal<'All' | OrderStatus>('All');
  selectedOrder = signal<Order | null>(null);

  // Date range filter
  filterForm = this.fb.group({ from: [''], to: [''] });

  // Pagination
  pageSize = 10;
  pageIndex = 0;

  displayedColumns = ['id', 'customerName', 'total', 'status', 'createdAt'];

  // ─── Filtered + paginated orders ──────────────────────────────────────────
  // Computed from the signal store — reacts instantly when status is updated
  filteredOrders = computed(() => {
    let orders = this.orderService.orders();

    // Apply status filter
    if (this.selectedStatus() !== 'All') {
      orders = orders.filter(o => o.status === this.selectedStatus());
    }

    // Apply date range filter
    const from = this.filterForm.value.from;
    const to   = this.filterForm.value.to;
    if (from) orders = orders.filter(o => o.createdAt >= from!);
    if (to)   orders = orders.filter(o => o.createdAt <= to! + 'T23:59:59');

    return orders;
  });

  // Current page slice of filtered orders
  pagedOrders = computed(() => {
    const start = this.pageIndex * this.pageSize;
    return this.filteredOrders().slice(start, start + this.pageSize);
  });

  // ─── Open order detail in the side-panel (not a new route) ────────────────
  openOrderDetail(order: Order): void {
    this.selectedOrder.set(order);
  }

  closePanel(): void {
    this.selectedOrder.set(null);
  }

  // ─── Inline status update — reflected immediately via shared signal store ──
  updateStatus(orderId: string, status: OrderStatus): void {
    this.orderService.updateOrderStatus(orderId, status);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize  = event.pageSize;
  }

  // Get status chip color
  getStatusColor(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
      Pending: 'warn', Confirmed: 'primary', Cancelled: 'accent'
    };
    return map[status];
  }
}
