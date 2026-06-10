import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { Product } from '../../../core/services/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatButtonModule, MatIconModule, MatChipsModule, MatSnackBarModule,
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit {
  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private productSvc   = inject(ProductService);
  private cartService  = inject(CartService);
  private snackBar     = inject(MatSnackBar);
  private destroyRef   = inject(DestroyRef);

  // Product is pre-loaded by the route resolver — available immediately via route data
  product = signal<Product | null>(null);
  relatedProducts = signal<Product[]>([]);
  quantity = signal(1);

  ngOnInit(): void {
    // Read the resolved product from route data
    const resolved = this.route.snapshot.data['product'] as Product;
    this.product.set(resolved);

    // Load related products from the same category (max 4)
    if (resolved?.category) {
      this.productSvc
        .getProducts({ category: resolved.category, limit: 5 })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(page => {
          // Exclude the current product from related list
          const related = page.products.filter(p => p.id !== resolved.id).slice(0, 4);
          this.relatedProducts.set(related);
        });
    }
  }

  // Increase quantity — bounded by available stock
  increaseQty(): void {
    const max = this.product()?.stock ?? 1;
    this.quantity.update(q => Math.min(q + 1, max));
  }

  decreaseQty(): void {
    this.quantity.update(q => Math.max(q - 1, 1));
  }

  addToCart(): void {
    const p = this.product();
    if (!p || p.stock === 0) return;

    this.cartService.addItem({
      productId:   p.id,
      productName: p.title,
      thumbnail:   p.thumbnail,
      unitPrice:   p.price,
      quantity:    this.quantity(),
      maxStock:    p.stock,
    });

    this.snackBar.open(`${p.title} added to cart!`, 'View Cart', { duration: 3000 })
      .onAction().subscribe(() => this.router.navigate(['/shop/checkout/step/1']));
  }

  navigateToRelated(id: number): void {
    this.router.navigate(['/shop/products', id]);
  }
}
