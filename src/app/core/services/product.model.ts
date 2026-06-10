// Product model — matches the structure returned by dummyjson.com/products
export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  thumbnail: string;
  images: string[];
  rating: number;
  brand?: string;
}

// Paginated response wrapper from dummyjson
export interface ProductPage {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

// Parameters used to filter/search/paginate the product list
export interface ProductQueryParams {
  search?: string;
  category?: string;
  skip?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}
