# AI Prompts Used — PROMPTS.md

## Prompt 1 — Project Scaffold
**Prompt:** "Create an Angular 18 project for an e-commerce app with standalone components, reactive forms, Angular Material, and bcryptjs."

**Decision:** Used `ng new` with `--standalone` flag. Did NOT use NgModules as the spec requires standalone only.

---

## Prompt 2 — AuthService Design
**Prompt:** "Design a signal-based AuthService in Angular 18 that stores currentUser, role, and isAuthenticated as signals, uses bcryptjs for password comparison, and persists session in sessionStorage."

**Decision:** Kept it simple — used `signal()` + `computed()` directly rather than NGRX signals store, which would be over-engineering for this scope.

---

## Prompt 3 — DynamicFormComponent
**Prompt:** "Build a reusable Angular component that accepts a JSON config array and a FormGroup, renders appropriate input types, handles visibleWhen predicates, and builds Angular validators from string notation like 'required', 'email', 'minLength:3'."

**Decision:** Kept the component stateless (no internal state). All state lives in the parent's FormGroup.

---

## Prompt 4 — Luhn Algorithm Validator
**Prompt:** "Implement the Luhn algorithm as an Angular ValidatorFn that returns ValidationErrors or null."

**Decision:** Implemented as a pure function (not a class-based validator) for simplicity and testability.

---

## Prompt 5 — Optimistic Delete
**Prompt:** "Show how to do optimistic UI delete in Angular — remove the row immediately from a signal array, call the API, then rollback on failure."

**Decision:** Used `products.update()` with a filter to remove immediately, then restored the saved snapshot on error. Simpler than a dedicated undo queue.

---

## Prompt 6 — StockWebSocket Simulation
**Prompt:** "Simulate a WebSocket stream in Angular using interval() and Subject that emits random stock updates for visible products."

**Decision:** Made it a shared singleton (`providedIn: 'root'`) so both admin and storefront use the same stream. This avoids duplicate intervals.

---

## Prompt 7 — Checkout Step Guard
**Prompt:** "Write a CanActivateFn that prevents users from navigating to checkout step 2 or 3 without completing the prior step."

**Decision:** Used sessionStorage flag ('checkout_step2_done') instead of a shared form state service, which keeps the guard simple and self-contained.
