import { TestBed } from '@angular/core/testing';
import { OrderService } from './order.service';

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [OrderService] });
    service = TestBed.inject(OrderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have pre-seeded mock orders', () => {
    expect(service.orders().length).toBeGreaterThan(0);
  });

  // ─── updateOrderStatus ──────────────────────────────────────────────────────

  it('should update the status of an order by ID', () => {
    const firstOrderId = service.orders()[0].id;

    service.updateOrderStatus(firstOrderId, 'Cancelled');

    const updated = service.orders().find(o => o.id === firstOrderId);
    expect(updated?.status).toBe('Cancelled');
  });

  it('should not affect other orders when updating status', () => {
    const orders = service.orders();
    if (orders.length < 2) return; // skip if only 1 order

    const firstId  = orders[0].id;
    const secondId = orders[1].id;
    const secondStatusBefore = orders[1].status;

    service.updateOrderStatus(firstId, 'Cancelled');

    const secondAfter = service.orders().find(o => o.id === secondId);
    expect(secondAfter?.status).toBe(secondStatusBefore);
  });

  // ─── addOrder ───────────────────────────────────────────────────────────────

  it('should add a new order at the top of the list', () => {
    const countBefore = service.orders().length;

    const newOrder = {
      id: 'ORD-TEST',
      customerId: '3',
      customerName: 'Test User',
      items: [{ productId: 1, productName: 'Phone', quantity: 1, unitPrice: 100 }],
      total: 100,
      status: 'Confirmed' as const,
      createdAt: new Date().toISOString(),
    };

    service.addOrder(newOrder);

    expect(service.orders().length).toBe(countBefore + 1);
    // New order should be at the top
    expect(service.orders()[0].id).toBe('ORD-TEST');
  });

  // ─── getOrdersForUser ────────────────────────────────────────────────────────

  it('should return only orders belonging to a specific customer', () => {
    const userOrders = service.getOrdersForUser('3');
    userOrders.forEach(o => expect(o.customerId).toBe('3'));
  });

  it('should return empty array for a customer with no orders', () => {
    const orders = service.getOrdersForUser('999');
    expect(orders).toEqual([]);
  });
});
