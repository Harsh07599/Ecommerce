import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

describe('authGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  // Minimal mock route and state needed by the guard
  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = (url: string) => ({ url } as RouterStateSnapshot);

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', [], {
      // isAuthenticated is a signal — spy on it as a function
      isAuthenticated: jasmine.createSpy('isAuthenticated'),
    });

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authSpy }],
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
  });

  it('should allow access when user is authenticated', () => {
    (authService.isAuthenticated as jasmine.Spy).and.returnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard(mockRoute, mockState('/admin'))
    );

    expect(result).toBeTrue();
  });

  it('should redirect to /login with returnUrl when not authenticated', () => {
    (authService.isAuthenticated as jasmine.Spy).and.returnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      authGuard(mockRoute, mockState('/shop/catalogue'))
    ) as any;

    // Should be a UrlTree redirecting to /login
    expect(result.toString()).toContain('login');
  });
});
