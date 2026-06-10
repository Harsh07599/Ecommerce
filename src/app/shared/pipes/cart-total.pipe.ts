import { Pipe, PipeTransform } from '@angular/core';
import { CartItem } from '../../core/services/cart.service';

// Tax rate — configurable here without touching component logic
const TAX_RATE = 0.1; // 10%

/*
 * CartTotalPipe — a PURE pipe that computes subtotal, tax, and grand total.
 * Being pure means Angular only re-runs it when the input reference changes.
 * This is correct here because CartService.items() returns a new array reference
 * every time items change.
 */
@Pipe({ name: 'cartTotal', standalone: true, pure: true })
export class CartTotalPipe implements PipeTransform {
  transform(items: CartItem[]): { subtotal: number; tax: number; total: number } {
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    return { subtotal, tax, total };
  }
}
