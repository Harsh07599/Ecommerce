import { Injectable, OnDestroy } from '@angular/core';
import { Subject, interval, Subscription } from 'rxjs';

// Represents a single stock update event for a product
export interface StockUpdate {
  productId: number;
  newStock: number;
}

@Injectable({ providedIn: 'root' })
export class StockWebsocketService implements OnDestroy {
  // Subject acts as the "WebSocket channel" — emits stock updates
  private stockSubject = new Subject<StockUpdate>();

  // Public observable that both admin and storefront components subscribe to.
  // This is the SAME stream — not duplicated. Both tasks use this single instance.
  readonly stockUpdates$ = this.stockSubject.asObservable();

  // Holds the interval subscription so we can clean up on destroy
  private intervalSub: Subscription;

  // IDs of products currently visible — set by components to limit random updates
  private visibleProductIds: number[] = [];

  constructor() {
    // Emit a random stock update every 3 seconds to simulate a live WebSocket feed
    this.intervalSub = interval(3000).subscribe(() => {
      if (this.visibleProductIds.length === 0) return;

      // Pick a random product from the visible list
      const randomIndex = Math.floor(Math.random() * this.visibleProductIds.length);
      const productId = this.visibleProductIds[randomIndex];

      // Simulate a small random stock change (+/- 1 to 5 units)
      const delta = Math.floor(Math.random() * 5) + 1;
      const change = Math.random() > 0.5 ? delta : -delta;

      this.stockSubject.next({
        productId,
        // We don't store stock here — the component tracks it and applies the delta
        newStock: Math.max(0, change), // components interpret this as a delta
      });
    });
  }

  // Components call this to register which product IDs are currently on screen
  setVisibleProducts(ids: number[]): void {
    this.visibleProductIds = ids;
  }

  ngOnDestroy(): void {
    this.intervalSub.unsubscribe();
    this.stockSubject.complete();
  }
}
