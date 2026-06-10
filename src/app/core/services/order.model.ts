// Order model — shared between admin (Task 2) and storefront (Task 3)
export type OrderStatus = 'Pending' | 'Confirmed' | 'Cancelled';

export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string; // ISO date string
}
