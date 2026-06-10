import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/services/product.model';

// Route resolver for the product detail page.
// The product is loaded BEFORE navigation completes — no loading skeleton needed on the detail page.
// Navigation only finishes once the product data is ready.
export const productResolver: ResolveFn<Product> = (route) => {
  const productService = inject(ProductService);
  const id = Number(route.paramMap.get('id'));
  return productService.getProductById(id);
};
