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
import { ProductCardComponent } from './product-card/product-card.component';

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
  pageSize = signal(12);
  pageIndex = signal(0);

  // Filter form — all filters compose into a single URL query params object
  // 'categories' is an array to support multi-select chip behaviour
  filterForm = this.fb.group({
    search:      [''],
    categories:  [[] as string[]],   // multi-select: array of selected categories
    maxPrice:    [10000],
    inStockOnly: [false],
  });

  ngOnInit(): void {
    // Attach PerformanceObserver to log LCP and CLS (requirement for Task 3)
    this.attachPerformanceObserver();

    // Load categories for filter chips
    this.productService.getCategories().subscribe(cats => {
      this.categories.set(cats.map(c => c.name));
    });

    // Read ALL filters from URL on first load (deep-linking support)
    const params = this.route.snapshot.queryParams;
    if (params['search'])     this.filterForm.patchValue({ search:     params['search'] });
    if (params['categories']) {
      const cats = Array.isArray(params['categories'])
        ? params['categories']
        : [params['categories']];
      this.filterForm.patchValue({ categories: cats });
    }
    if (params['maxPrice'])   this.filterForm.patchValue({ maxPrice:   +params['maxPrice'] });
    if (params['inStockOnly']) this.filterForm.patchValue({ inStockOnly: params['inStockOnly'] === 'true' });

    this.loadProducts();

    // Re-load on any filter change — debounced to avoid API spam on every keystroke
    this.filterForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.pageIndex.set(0);
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
    const { search, categories } = this.filterForm.value;
    // dummyjson only supports a single category filter — use the first selected
    const category = categories && categories.length > 0 ? categories[0] : undefined;

    this.productService
      .getProducts({
        search: search || undefined,
        category,
        skip: this.pageIndex() * this.pageSize(),
        limit: this.pageSize(),
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

  // Filter products locally by price, in-stock toggle, and remaining selected categories
  // (API fetches by the first selected category; additional categories filtered here)
  displayedProducts = computed(() => {
    const { maxPrice, inStockOnly, categories } = this.filterForm.value;
    const selectedCats = categories ?? [];
    return this.products().filter(p => {
      if (maxPrice && p.price > maxPrice) return false;
      if (inStockOnly && this.getLiveStock(p) === 0) return false;
      // If more than one category selected, client-side filter applies the rest
      if (selectedCats.length > 1 && !selectedCats.includes(p.category)) return false;
      return true;
    });
  });

  getLiveStock(product: Product): number {
    return this.stockOverrides()[product.id] ?? product.stock;
  }

  private getBaseStock(id: number): number {
    return this.products().find(p => p.id === id)?.stock ?? 0;
  }

  // Write ALL current filters to URL so the page can be deep-linked
  private syncFiltersToUrl(): void {
    const { search, categories, maxPrice, inStockOnly } = this.filterForm.value;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search:      search        || null,
        categories:  categories && categories.length ? categories : null,
        maxPrice:    maxPrice !== 10000 ? maxPrice : null,
        inStockOnly: inStockOnly  || null,
      },
      queryParamsHandling: 'merge',
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadProducts();
  }

  navigateToProduct(id: number): void {
    this.router.navigate(['/shop/products', id]);
  }

  // Toggle a category in the multi-select array
  // — adds it if absent, removes it if already selected
  selectCategory(cat: string): void {
    const current: string[] = this.filterForm.value.categories ?? [];
    const updated = current.includes(cat)
      ? current.filter(c => c !== cat)
      : [...current, cat];
    this.filterForm.patchValue({ categories: updated });
  }

  // Check if a category is currently selected (used for chip active state)
  isCategorySelected(cat: string): boolean {
    return (this.filterForm.value.categories ?? []).includes(cat);
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
