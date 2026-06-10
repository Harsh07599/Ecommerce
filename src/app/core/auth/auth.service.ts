import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { timer, switchMap, of, Observable } from 'rxjs';
import * as bcrypt from 'bcryptjs';
import { User, SessionToken } from './user.model';

// Key used to store/retrieve the session from sessionStorage
const SESSION_KEY = 'app_session_token';

// Mock auth delay to simulate a real network request (600ms as per requirement)
const AUTH_DELAY_MS = 600;

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Dependencies injected using inject() — no constructor injection
  private http = inject(HttpClient);
  private router = inject(Router);

  // ─── Angular Signals ───────────────────────────────────────────────────────
  // currentUser is the single source of truth for the logged-in user.
  // All components must read from these signals — never hold a copy locally.
  private _currentUser = signal<User | null>(null);

  // Derived (computed) signals for convenience
  readonly currentUser = this._currentUser.asReadonly();
  readonly role = computed(() => this._currentUser()?.role ?? null);
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  // ─── Session Rehydration ───────────────────────────────────────────────────
  // Called via APP_INITIALIZER on app startup to restore session from storage.
  rehydrateSession(): void {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return;

    try {
      const token: SessionToken = JSON.parse(atob(raw));
      this._currentUser.set(token.user);
    } catch {
      // If the token is corrupted, clear it and start fresh
      sessionStorage.removeItem(SESSION_KEY);
    }
  }

  // ─── Login ─────────────────────────────────────────────────────────────────
  // Simulates a 600ms network delay, then validates credentials against users.json.
  // Returns an observable that emits the user on success or throws on failure.
  login(email: string, password: string): Observable<User> {
    return timer(AUTH_DELAY_MS).pipe(
      switchMap(() => this.http.get<any[]>('/assets/users.json')),
      switchMap(users => {
        const found = users.find(u => u.email === email);

        // Check if user exists and the password matches the bcrypt hash
        if (!found || !bcrypt.compareSync(password, found.passwordHash)) {
          throw new Error('Invalid email or password');
        }

        // Build the user object (exclude passwordHash)
        const user: User = {
          id: found.id,
          name: found.name,
          email: found.email,
          role: found.role,
        };

        // Store a mock JWT: base64(JSON) — no real signing needed for this exercise
        const token: SessionToken = { user, issuedAt: Date.now() };
        sessionStorage.setItem(SESSION_KEY, btoa(JSON.stringify(token)));

        // Update the signal so all components reactively update
        this._currentUser.set(user);

        return of(user);
      })
    );
  }

  // ─── Logout ────────────────────────────────────────────────────────────────
  logout(): void {
    sessionStorage.removeItem(SESSION_KEY);
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
