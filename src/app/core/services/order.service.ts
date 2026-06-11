import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Order, OrderStatus } from './order.model';

// Seeded mock orders — shared between admin order view (Task 2) and user order history (Task 3)
const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-001',
    customerId: '3',
    customerName: 'Charlie User',
    items: [
      { productId: 1, productName: 'iPhone 9', quantity: 1, unitPrice: 549 },
      { productId: 2, productName: 'iPhone X', quantity: 2, unitPrice: 899 },
    ],
    total: 2347,
    status: 'Confirmed',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORD-002',
    customerId: '4',
    customerName: 'Diana User',
    items: [
      { productId: 5, productName: 'Samsung Galaxy', quantity: 1, unitPrice: 399 },
    ],
    total: 399,
    status: 'Pending',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORD-003',
    customerId: '3',
    customerName: 'Charlie User',
    items: [
      { productId: 3, productName: 'OPPOF19', quantity: 3, unitPrice: 280 },
    ],
    total: 840,
    status: 'Cancelled',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http    = inject(HttpClient);

  // Orders are stored as a signal so any component can react to changes instantly
  private _orders = signal<Order[]>(MOCK_ORDERS);

  // Read-only view of all orders for components
  readonly orders = this._orders.asReadonly();

  // ─── Get orders for a specific customer ────────────────────────────────────
  // Used on the user order history page
  getOrdersForUser(customerId: string): Order[] {
    return this._orders().filter(o => o.customerId === customerId);
  }

  // ─── Update order status ───────────────────────────────────────────────────
  // Called from the admin order side-panel. Updates signal in place so
  // the admin table reflects the change immediately without a page reload.
  updateOrderStatus(orderId: string, status: OrderStatus): void {
    this._orders.update(orders =>
      orders.map(o => (o.id === orderId ? { ...o, status } : o))
    );
  }

  // ─── Add a new order ─────────────────────────────────────────────────────────────────
  // Called optimistically before the API confirms
  addOrder(order: Order): void {
    this._orders.update(orders => [order, ...orders]);
  }

  // ─── Remove an order by ID (used for rollback on API failure) ─────────────────────
  removeOrder(orderId: string): void {
    this._orders.update(orders => orders.filter(o => o.id !== orderId));
  }

  // ─── Submit order to mock API endpoint ─────────────────────────────────────────
  // Uses dummyjson /carts/add as a stand-in for a real order endpoint.
  // Waits 800ms first to simulate network latency.
  submitOrder(order: Order): Observable<any> {
    return timer(800).pipe(
      switchMap(() =>
        this.http.post('https://dummyjson.com/carts/add', {
          userId: Number(order.customerId) || 1,
          products: order.items.map(i => ({
            id: i.productId, quantity: i.quantity,
          })),
        })
      )
    );
  }
}
