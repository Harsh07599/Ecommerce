# E-Commerce Angular 18 App

## Setup

```bash
npm install
npm run start       # → http://localhost:4200
npm test            # Run unit tests
```

## Demo Credentials

| Role  | Email              | Password    |
|-------|--------------------|-------------|
| Admin | alice@admin.com    | Admin@123   |
| Admin | bob@admin.com      | Admin@123   |
| User  | charlie@user.com   | User@123    |
| User  | diana@user.com     | User@123    |

## Architecture

- **Angular 18** — standalone components, no NgModules
- **`inject()`** — no constructor injection anywhere
- **Angular Signals** — auth state, cart state, order state
- **Angular Material** — UI components
- **dummyjson.com** — mock product API
- **bcryptjs** — password hashing
- **Lazy loading** — all feature modules are lazy-loaded

## Task Summary

### Task 1 — Authentication & RBAC
- Signal-based `AuthService` with `currentUser`, `role`, `isAuthenticated`
- Login form with `OnPush`, loading skeleton, error state
- `authGuard` + `adminGuard` route protection
- Session persists via `sessionStorage` mock JWT
- `APP_INITIALIZER` rehydrates session on refresh

### Task 2 — Admin Panel
- **Products**: Debounced search, category filter, sortable table, optimistic delete, live stock badge
- **Orders**: Status filter, date range, inline side-panel, inline status update
- **Analytics**: Summary cards derived from shared signal store
- **DynamicFormComponent**: JSON-driven form reused in Task 3

### Task 3 — User Storefront
- **Catalogue**: Card grid, URL-synced filters, loading skeletons, `OnPush` cards
- **Product Detail**: Route resolver (no skeleton), add-to-cart, related products
- **Cart**: Signal-based, `localStorage` persistence, live nav badge
- **Checkout**: 3 lazy-loaded steps, checkout guard, dynamic form reuse, Luhn validation
- **Performance**: `PerformanceObserver` for LCP/CLS, `@defer` patterns

## Known Limitations

- Mock API (dummyjson.com) limits PUT/DELETE to simulated responses — changes aren't persisted server-side
- Orders are in-memory only (reset on page refresh for admin, persisted via signals within session)
