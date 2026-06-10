import {
  Component, OnInit, signal, inject, ChangeDetectionStrategy, DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

import { ProductService } from '../../../core/services/product.service';
import { StockWebsocketService } from '../../../core/services/stock-websocket.service';
import { Product } from '../../../core/services/product.model';
import { ProductFormDialogComponent } from './product-form-dialog.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-products',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatBadgeModule,
    MatDialogModule, MatSnackBarModule, MatProgressSpinnerModule, MatChipsModule,
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
})
export class ProductsComponent implements OnInit {
  // Dependencies
  private productService = inject(ProductService);
  private stockWs = inject(StockWebsocketService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  // ─── Table state as signals ────────────────────────────────────────────────
  products = signal<Product[]>([]);
  totalProducts = signal(0);
  isLoading = signal(false);

  // Live stock overrides — keyed by product ID
  // Updated by the simulated WebSocket without re-fetching the product list
  stockOverrides = signal<Record<number, number>>({});

  // Pagination + sorting
  pageSize = 10;
  pageIndex = 0;
  sortBy = '';
  sortOrder: 'asc' | 'desc' = 'asc';

  // Table columns to display
  displayedColumns = ['thumbnail', 'title', 'category', 'price', 'stock', 'actions'];

  // Categories for the filter dropdown
  categories = signal<string[]>([]);

  // Filter form — search input + category select compose into one query object
  filterForm = this.fb.group({
    search: [''],
    category: [''],
  });

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
    this.subscribeToStockUpdates();

    // Re-fetch when filters change — debounced to avoid firing on every keystroke
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.pageIndex = 0; // reset to first page on filter change
        this.loadProducts();
      });
  }

  // ─── Load products from the API ────────────────────────────────────────────
  loadProducts(): void {
    this.isLoading.set(true);
    const { search, category } = this.filterForm.value;

    this.productService
      .getProducts({
        search: search || undefined,
        category: category || undefined,
        skip: this.pageIndex * this.pageSize,
        limit: this.pageSize,
        sortBy: this.sortBy || undefined,
        order: this.sortOrder,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: page => {
          this.products.set(page.products);
          this.totalProducts.set(page.total);
          this.isLoading.set(false);

          // Register visible product IDs with the WS service
          this.stockWs.setVisibleProducts(page.products.map(p => p.id));
        },
        error: () => {
          this.isLoading.set(false);
          this.snackBar.open('Failed to load products', 'Dismiss', { duration: 3000 });
        },
      });
  }

  // ─── Load category list for the filter dropdown ────────────────────────────
  loadCategories(): void {
    this.productService
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(cats => {
        this.categories.set(cats.map(c => c.name));
      });
  }

  // ─── Subscribe to simulated WebSocket stock updates ────────────────────────
  // Updates the stockOverrides map — no re-fetch needed
  subscribeToStockUpdates(): void {
    this.stockWs.stockUpdates$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(update => {
        this.stockOverrides.update(overrides => ({
          ...overrides,
          [update.productId]: Math.max(
            0,
            (overrides[update.productId] ?? this.getProductStock(update.productId)) + update.newStock
          ),
        }));
      });
  }

  // Get live stock for a product (from override map or original data)
  getStockForProduct(product: Product): number {
    return this.stockOverrides()[product.id] ?? product.stock;
  }

  private getProductStock(id: number): number {
    return this.products().find(p => p.id === id)?.stock ?? 0;
  }

  // ─── Pagination ────────────────────────────────────────────────────────────
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadProducts();
  }

  // ─── Sorting ───────────────────────────────────────────────────────────────
  onSortChange(sort: Sort): void {
    this.sortBy = sort.active;
    this.sortOrder = sort.direction as 'asc' | 'desc' || 'asc';
    this.loadProducts();
  }

  // ─── Add / Edit product dialog ─────────────────────────────────────────────
  openProductForm(product?: Product): void {
    const dialogRef = this.dialog.open(ProductFormDialogComponent, {
      width: '600px',
      data: { product },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadProducts(); // refresh table after save
    });
  }

  // ─── Optimistic Delete ─────────────────────────────────────────────────────
  // Removes the row immediately from the UI, then calls the API.
  // On failure, the row is restored and a toast is shown.
  deleteProduct(product: Product): void {
    // 1. Remove from UI immediately (optimistic)
    const previousProducts = this.products();
    this.products.update(list => list.filter(p => p.id !== product.id));
    this.totalProducts.update(n => n - 1);

    // 2. Call the API
    this.productService
      .deleteProduct(product.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open(`"${product.title}" deleted`, 'OK', { duration: 2000 });
        },
        error: () => {
          // 3. Rollback on failure
          this.products.set(previousProducts);
          this.totalProducts.update(n => n + 1);
          this.snackBar.open('Delete failed — product restored', 'Dismiss', { duration: 4000 });
        },
      });
  }
}
