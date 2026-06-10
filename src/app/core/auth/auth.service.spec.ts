import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  // Mock users matching users.json structure
  const mockUsers = [
    {
      id: '1',
      name: 'Alice Admin',
      email: 'alice@admin.com',
      // bcrypt hash of 'Admin@123'
      passwordHash: '$2a$10$Kkx5KZ4x9A0GbA1z4e6.JuGmB6/klFYw7y9wQ6r3NXkBMHvAV8Uu2',
      role: 'admin',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    // Clear sessionStorage before each test
    sessionStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  // ─── Initial state ──────────────────────────────────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with no user (isAuthenticated = false)', () => {
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.currentUser()).toBeNull();
    expect(service.role()).toBeNull();
  });

  // ─── Session rehydration ────────────────────────────────────────────────────

  it('should rehydrate session from sessionStorage', () => {
    // Store a mock session token in sessionStorage
    const user = { id: '1', name: 'Alice', email: 'alice@admin.com', role: 'admin' };
    const token = btoa(JSON.stringify({ user, issuedAt: Date.now() }));
    sessionStorage.setItem('app_session_token', token);

    // Call rehydrate — should restore the user signal
    service.rehydrateSession();

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.currentUser()?.email).toBe('alice@admin.com');
    expect(service.role()).toBe('admin');
  });

  it('should handle corrupted sessionStorage token gracefully', () => {
    sessionStorage.setItem('app_session_token', 'not-valid-base64!!');
    service.rehydrateSession();

    // Should not throw and should remain unauthenticated
    expect(service.isAuthenticated()).toBeFalse();
  });

  // ─── Logout ─────────────────────────────────────────────────────────────────

  it('should clear user state on logout', () => {
    // Manually set a user via rehydration
    const user = { id: '1', name: 'Alice', email: 'alice@admin.com', role: 'admin' };
    const token = btoa(JSON.stringify({ user, issuedAt: Date.now() }));
    sessionStorage.setItem('app_session_token', token);
    service.rehydrateSession();

    expect(service.isAuthenticated()).toBeTrue();

    service.logout();

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.currentUser()).toBeNull();
    expect(sessionStorage.getItem('app_session_token')).toBeNull();
  });
});
