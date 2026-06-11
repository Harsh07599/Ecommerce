import {
  Component, OnInit, signal, inject, ChangeDetectionStrategy, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
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
    MatTableModule, MatPaginatorModule, MatSortModule, MatSelectModule,
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

  displayedColumns = ['id', 'customerName', 'products', 'total', 'status', 'createdAt'];
  sortField = 'createdAt';
  sortDir: 'asc' | 'desc' = 'desc';

  // ─── Filtered + paginated orders ──────────────────────────────────────────
  // Computed from the signal store — reacts instantly when status is updated
  filteredOrders = computed(() => {
    let orders = this.orderService.orders();

    // Apply status filter
    if (this.selectedStatus() !== 'All') {
      orders = orders.filter(o => o.status === this.selectedStatus());
    }

    return orders;
  });

  // Sorted filtered orders — recomputed when sortField/sortDir change
  sortedOrders = computed(() => {
    const field = this.sortField;
    const dir   = this.sortDir;
    return [...this.filteredOrders()].sort((a, b) => {
      const aVal = (a as any)[field] ?? '';
      const bVal = (b as any)[field] ?? '';
      const cmp  = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return dir === 'asc' ? cmp : -cmp;
    });
  });

  // Current page slice
  pagedOrders = computed(() => {
    const start = this.pageIndex * this.pageSize;
    return this.sortedOrders().slice(start, start + this.pageSize);
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

  // ─── Sort handler ────────────────────────────────────────────────────────────────
  onSortChange(sort: Sort): void {
    this.sortField = sort.active || 'createdAt';
    this.sortDir   = (sort.direction as 'asc' | 'desc') || 'desc';
    this.pageIndex = 0;
  }

  // Get status chip color
  getStatusColor(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
      Pending: 'warn', Confirmed: 'primary', Cancelled: 'accent'
    };
    return map[status];
  }

  // ─── Summarise product names for the orders table Products column ────────────
  getProductNames(order: Order): string {
    return order.items.map(i => i.productName).join(', ');
  }
}
