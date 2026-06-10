import { Injectable, signal, computed } from '@angular/core';

// A single item in the shopping cart
export interface CartItem {
  productId: number;
  productName: string;
  thumbnail: string;
  unitPrice: number;
  quantity: number;
  maxStock: number; // upper bound for quantity selector
}

// Key used to persist cart in localStorage across page refreshes
const CART_STORAGE_KEY = 'app_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  // ─── Signal-based cart state ───────────────────────────────────────────────
  // Loaded from localStorage on startup so it survives a page refresh
  private _items = signal<CartItem[]>(this.loadFromStorage());

  // Derived signals consumed by components
  readonly items = this._items.asReadonly();

  // Total number of items (sum of quantities) — shown on the nav cart icon
  readonly itemCount = computed(() =>
    this._items().reduce((sum, item) => sum + item.quantity, 0)
  );

  // ─── Add to cart ───────────────────────────────────────────────────────────
  addItem(newItem: CartItem): void {
    this._items.update(items => {
      const existing = items.find(i => i.productId === newItem.productId);
      if (existing) {
        // Increase quantity, capped at available stock
        return items.map(i =>
          i.productId === newItem.productId
            ? { ...i, quantity: Math.min(i.quantity + newItem.quantity, i.maxStock) }
            : i
        );
      }
      return [...items, newItem];
    });
    this.saveToStorage();
  }

  // ─── Update quantity for a specific item ───────────────────────────────────
  updateQuantity(productId: number, quantity: number): void {
    this._items.update(items =>
      items.map(i => (i.productId === productId ? { ...i, quantity } : i))
    );
    this.saveToStorage();
  }

  // ─── Remove an item from the cart ─────────────────────────────────────────
  removeItem(productId: number): void {
    this._items.update(items => items.filter(i => i.productId !== productId));
    this.saveToStorage();
  }

  // ─── Clear entire cart ─────────────────────────────────────────────────────
  // Called after a successful order is placed
  clearCart(): void {
    this._items.set([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  }

  // ─── Persist to localStorage ───────────────────────────────────────────────
  private saveToStorage(): void {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this._items()));
  }

  // ─── Load from localStorage on service init ────────────────────────────────
  private loadFromStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}
