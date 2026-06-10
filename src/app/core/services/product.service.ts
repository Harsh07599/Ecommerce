import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, ProductPage, ProductQueryParams } from './product.model';

// Base URL for the mock product API
const API_BASE = 'https://dummyjson.com';

@Injectable({ providedIn: 'root' })
export class ProductService {
  // inject() is used throughout — no constructor injection per requirement
  private http = inject(HttpClient);

  // ─── Get paginated product list ────────────────────────────────────────────
  // Used by both Admin products table (Task 2) and Shop catalogue (Task 3)
  getProducts(params: ProductQueryParams = {}): Observable<ProductPage> {
    const { search, category, skip = 0, limit = 20, sortBy, order } = params;

    // Build query string dynamically based on provided filters
    let url = `${API_BASE}/products`;

    if (search) {
      url = `${API_BASE}/products/search`;
    } else if (category) {
      url = `${API_BASE}/products/category/${category}`;
    }

    let httpParams = new HttpParams()
      .set('limit', limit)
      .set('skip', skip);

    if (search) httpParams = httpParams.set('q', search);
    if (sortBy) httpParams = httpParams.set('sortBy', sortBy);
    if (order)  httpParams = httpParams.set('order', order);

    return this.http.get<ProductPage>(url, { params: httpParams });
  }

  // ─── Get single product by ID ──────────────────────────────────────────────
  // Used by the product detail page route resolver (Task 3)
  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${API_BASE}/products/${id}`);
  }

  // ─── Get all category names ────────────────────────────────────────────────
  // Used to populate the category filter dropdown/chips
  getCategories(): Observable<{ slug: string; name: string; url: string }[]> {
    return this.http.get<{ slug: string; name: string; url: string }[]>(
      `${API_BASE}/products/categories`
    );
  }

  // ─── Simulate Add / Update product ─────────────────────────────────────────
  // dummyjson supports POST/PUT — used for the admin add/edit form
  addProduct(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(`${API_BASE}/products/add`, product);
  }

  updateProduct(id: number, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${API_BASE}/products/${id}`, product);
  }

  // ─── Simulate Delete product ───────────────────────────────────────────────
  // Used with optimistic UI — the row is removed immediately, then this is called.
  // If it fails, the caller rolls back the row.
  deleteProduct(id: number): Observable<Product> {
    return this.http.delete<Product>(`${API_BASE}/products/${id}`);
  }
}
