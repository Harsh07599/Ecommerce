import {
  Component, Input, Output, EventEmitter, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Product } from '../../../../core/services/product.model';

/*
 * WHY OnPush here?
 * ProductCardComponent receives product data + a live stock number as @Input().
 * With OnPush, Angular only re-renders this card when its inputs change by reference.
 * Without OnPush, every WebSocket tick (every 3s) would trigger re-renders across
 * ALL cards in the grid, even those whose stock didn't change. OnPush makes this
 * efficient — only the card whose liveStock input changed will re-render.
 */
@Component({
  selector: 'app-product-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;

  // Live stock updated from the shared WebSocket stream
  @Input() liveStock = 0;

  // Emit click so the parent handles navigation
  @Output() cardClick = new EventEmitter<void>();

  get isOutOfStock(): boolean {
    return this.liveStock === 0;
  }

  get isLowStock(): boolean {
    return this.liveStock > 0 && this.liveStock <= 5;
  }
}
