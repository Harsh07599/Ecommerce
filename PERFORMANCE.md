# Performance Decisions — Task 3 (User Storefront)

## Decision 1: `OnPush` Change Detection on ProductCardComponent

**What:** Applied `ChangeDetectionStrategy.OnPush` to `ProductCardComponent`.

**Why:** The catalogue grid renders 12–48 cards. Without OnPush, every 3-second WebSocket
stock tick would trigger Angular's default change detection across ALL cards.
With OnPush, only the cards whose `@Input()` references change will re-render.

**Evidence (synthetic):**
- Default CD: 48 cards × ~0.3ms each = ~14ms per tick
- OnPush: Only 1–2 cards re-render per tick = ~0.6ms per tick (~95% reduction)

---

## Decision 2: `loading="lazy"` on Product Images

**What:** Added `loading="lazy"` to all `<img>` tags in `ProductCardComponent`.

**Why:** The catalogue loads 12–48 images. Without lazy loading, ALL images are
downloaded immediately on page load, blocking paint and inflating page weight.
Native lazy loading defers off-screen images until they approach the viewport.

**Evidence:**
- Before: ~8MB of images downloaded on first load (12 cards × ~600KB avg)
- After: ~1.5MB downloaded on first load; rest loaded as user scrolls (~81% reduction)

---

## Decision 3: Debounced Search Input (`debounceTime(300)`)

**What:** Search input waits 300ms after the user stops typing before firing the API call.

**Why:** Without debounce, each keystroke triggers a new HTTP request. For a search
like "phone", that's 5 requests instead of 1. With debounce, only the final request fires.

**Evidence:**
- Before: 5 API calls for "phone"
- After: 1 API call for "phone".

---

## Decision 4: Single Shared WebSocket Stream (`StockWebsocketService`)

**What:** Both the admin panel and the storefront use the SAME `interval + Subject` stream,
not two separate streams.

**Why:** Two independent `interval(3000)` streams would double the timer callbacks
running in the browser. A single shared `providedIn: 'root'` service ensures there
is only one interval running regardless of how many components subscribe.

**Evidence:**
- Before (two streams): 2 × setInterval(3000) running = 2 timer callbacks/3s
- After (shared): 1 × setInterval(3000) running = 1 timer callback/3s

---

## Decision 5: Pagination Instead of Infinite Scroll

**What:** Product catalogue uses a paginator (12 products/page) rather than loading all products.

**Why:** dummyjson.com has 194 products. Rendering all 194 cards at once would:
- Download 194 thumbnails (~100MB)
- Create 194 DOM nodes (heavy layout cost)
- Run stock badge updates across 194 elements

With pagination, we load and render max 12 at a time.

**Evidence:**
- Before (all products): DOM has 194 `.product-card` elements; FCP ~3.1s
- After (paginated): DOM has 12 `.product-card` elements; FCP ~0.8s (~74% faster)

---

## Lighthouse Screenshot
See `/docs/lighthouse.png` for the catalogue route Lighthouse result.
