import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { adminGuard } from './admin.guard';
import { AuthService } from './auth.service';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

describe('adminGuard', () => {
  let authService: { isAuthenticated: jasmine.Spy; role: jasmine.Spy };
  let router: Router;

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = (url: string) => ({ url } as RouterStateSnapshot);

  beforeEach(() => {
    const authSpy = {
      isAuthenticated: jasmine.createSpy('isAuthenticated'),
      role: jasmine.createSpy('role'),
    };

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authSpy }],
    });

    authService = TestBed.inject(AuthService) as any;
    router = TestBed.inject(Router);
  });

  it('should allow access when user is authenticated and has admin role', () => {
    authService.isAuthenticated.and.returnValue(true);
    authService.role.and.returnValue('admin');

    const result = TestBed.runInInjectionContext(() =>
      adminGuard(mockRoute, mockState('/admin'))
    );

    expect(result).toBeTrue();
  });

  it('should redirect to /login when not authenticated', () => {
    authService.isAuthenticated.and.returnValue(false);
    authService.role.and.returnValue(null);

    const result = TestBed.runInInjectionContext(() =>
      adminGuard(mockRoute, mockState('/admin'))
    ) as any;

    expect(result.toString()).toContain('login');
  });

  it('should redirect to /shop when authenticated but not admin', () => {
    authService.isAuthenticated.and.returnValue(true);
    authService.role.and.returnValue('user');

    const result = TestBed.runInInjectionContext(() =>
      adminGuard(mockRoute, mockState('/admin'))
    ) as any;

    expect(result.toString()).toContain('shop');
  });
});
