import {
  Component, OnInit, signal, inject, ChangeDetectionStrategy,
  DestroyRef, computed,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ProductService } from '../../../core/services/product.service';
import { StockWebsocketService } from '../../../core/services/stock-websocket.service';
import { Product } from '../../../core/services/product.model';
import { ProductCardComponent } from './product-card.component';

@Component({
  selector: 'app-catalogue',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatSliderModule,
    MatProgressSpinnerModule, MatPaginatorModule, MatSlideToggleModule,
    ProductCardComponent,
  ],
  templateUrl: './catalogue.component.html',
  styleUrl: './catalogue.component.scss',
})
export class CatalogueComponent implements OnInit {
  private productService = inject(ProductService);
  private stockWs = inject(StockWebsocketService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  // ─── State ─────────────────────────────────────────────────────────────────
  products = signal<Product[]>([]);
  total = signal(0);
  isLoading = signal(false);
  hasError = signal(false);
  categories = signal<string[]>([]);
  stockOverrides = signal<Record<number, number>>({});

  // Filter form — all filters compose into a single URL query params object
  filterForm = this.fb.group({
    search:    [''],
    category:  [''],
    maxPrice:  [10000],
    inStockOnly: [false],
  });

  pageSize  = 12;
  pageIndex = 0;

  ngOnInit(): void {
    // Attach PerformanceObserver to log LCP and CLS (requirement for Task 3)
    this.attachPerformanceObserver();

    // Load categories for filter chips
    this.productService.getCategories().subscribe(cats => {
      this.categories.set(cats.map(c => c.name));
    });

    // Read filters from URL on first load (deep-linking support)
    const params = this.route.snapshot.queryParams;
    if (params['category']) this.filterForm.patchValue({ category: params['category'] });
    if (params['search'])   this.filterForm.patchValue({ search:   params['search']   });

    this.loadProducts();

    // Re-load on any filter change — debounced to avoid API spam on every keystroke
    this.filterForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.pageIndex = 0;
        this.syncFiltersToUrl(); // reflect filters in URL for deep-linking
        this.loadProducts();
      });

    // Subscribe to the shared WebSocket stock stream
    this.stockWs.stockUpdates$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(update => {
        this.stockOverrides.update(prev => ({
          ...prev,
          [update.productId]: Math.max(
            0,
            (prev[update.productId] ?? this.getBaseStock(update.productId)) + update.newStock
          ),
        }));
      });
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    const { search, category } = this.filterForm.value;

    this.productService
      .getProducts({
        search: search || undefined,
        category: category || undefined,
        skip: this.pageIndex * this.pageSize,
        limit: this.pageSize,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: page => {
          this.products.set(page.products);
          this.total.set(page.total);
          this.isLoading.set(false);
          // Tell the WS service which products are on screen
          this.stockWs.setVisibleProducts(page.products.map(p => p.id));
        },
        error: () => {
          this.isLoading.set(false);
          this.hasError.set(true);
        },
      });
  }

  // Filter products locally by price + in-stock toggle after loading
  displayedProducts = computed(() => {
    const { maxPrice, inStockOnly } = this.filterForm.value;
    return this.products().filter(p => {
      if (maxPrice && p.price > maxPrice) return false;
      if (inStockOnly && this.getLiveStock(p) === 0) return false;
      return true;
    });
  });

  getLiveStock(product: Product): number {
    return this.stockOverrides()[product.id] ?? product.stock;
  }

  private getBaseStock(id: number): number {
    return this.products().find(p => p.id === id)?.stock ?? 0;
  }

  // Write current filters to URL query params so the page can be deep-linked
  private syncFiltersToUrl(): void {
    const { search, category } = this.filterForm.value;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: search || null, category: category || null },
      queryParamsHandling: 'merge',
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize  = event.pageSize;
    this.loadProducts();
  }

  navigateToProduct(id: number): void {
    this.router.navigate(['/shop/products', id]);
  }

  selectCategory(cat: string): void {
    const current = this.filterForm.value.category;
    this.filterForm.patchValue({ category: current === cat ? '' : cat });
  }

  // Log Largest Contentful Paint and Cumulative Layout Shift to the console
  private attachPerformanceObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      new PerformanceObserver(list => {
        list.getEntries().forEach(entry => console.log('[LCP]', entry));
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      new PerformanceObserver(list => {
        list.getEntries().forEach(entry => console.log('[CLS]', entry));
      }).observe({ type: 'layout-shift', buffered: true });
    } catch {
      // PerformanceObserver may not support all entry types in all browsers
    }
  }
}
