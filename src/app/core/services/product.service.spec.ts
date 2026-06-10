import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  const mockProductPage = {
    products: [
      { id: 1, title: 'iPhone 9', category: 'smartphones', price: 549, stock: 94,
        thumbnail: 'img.jpg', images: [], rating: 4.5, description: 'An apple phone' },
    ],
    total: 100,
    skip: 0,
    limit: 10,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductService],
    });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── getProducts ────────────────────────────────────────────────────────────

  it('should call the base products endpoint when no filters are given', () => {
    service.getProducts().subscribe(page => {
      expect(page.products.length).toBe(1);
      expect(page.total).toBe(100);
    });

    const req = httpMock.expectOne(r => r.url.includes('/products'));
    expect(req.request.method).toBe('GET');
    req.flush(mockProductPage);
  });

  it('should use search endpoint when search query is provided', () => {
    service.getProducts({ search: 'phone' }).subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/products/search'));
    expect(req.request.params.get('q')).toBe('phone');
    req.flush(mockProductPage);
  });

  it('should use category endpoint when category filter is set', () => {
    service.getProducts({ category: 'smartphones' }).subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/products/category/smartphones'));
    req.flush(mockProductPage);
  });

  it('should pass pagination params (skip and limit)', () => {
    service.getProducts({ skip: 20, limit: 10 }).subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/products'));
    expect(req.request.params.get('skip')).toBe('20');
    expect(req.request.params.get('limit')).toBe('10');
    req.flush(mockProductPage);
  });

  // ─── getProductById ─────────────────────────────────────────────────────────

  it('should fetch a single product by ID', () => {
    const mockProduct = mockProductPage.products[0];
    service.getProductById(1).subscribe(p => {
      expect(p.title).toBe('iPhone 9');
    });

    const req = httpMock.expectOne('https://dummyjson.com/products/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockProduct);
  });

  // ─── deleteProduct ──────────────────────────────────────────────────────────

  it('should send DELETE request for a product', () => {
    service.deleteProduct(1).subscribe();

    const req = httpMock.expectOne('https://dummyjson.com/products/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ id: 1, isDeleted: true });
  });

  // ─── addProduct ─────────────────────────────────────────────────────────────

  it('should send POST request to add a product', () => {
    service.addProduct({ title: 'New Phone', price: 299 }).subscribe();

    const req = httpMock.expectOne('https://dummyjson.com/products/add');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.title).toBe('New Phone');
    req.flush({ id: 200, title: 'New Phone', price: 299 });
  });
});
