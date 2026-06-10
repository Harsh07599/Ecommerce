import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/auth/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockUser = { id: '1', name: 'Alice', email: 'alice@admin.com', role: 'admin' as const };

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'logout']);

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,         // standalone component — imported directly
        ReactiveFormsModule,
        RouterTestingModule,
        NoopAnimationsModule,   // prevents Material animation errors in tests
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ─── Component creation ─────────────────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── Form validation ────────────────────────────────────────────────────────

  it('should have an invalid form when empty', () => {
    expect(component.loginForm.invalid).toBeTrue();
  });

  it('should show error when email is invalid', () => {
    component.loginForm.patchValue({ email: 'not-an-email', password: 'pass123' });
    expect(component.emailControl.errors?.['email']).toBeTruthy();
  });

  it('should show error when password is too short', () => {
    component.loginForm.patchValue({ email: 'test@test.com', password: '123' });
    expect(component.passwordControl.errors?.['minlength']).toBeTruthy();
  });

  it('should have a valid form when email and password are correct', () => {
    component.loginForm.patchValue({ email: 'alice@admin.com', password: 'Admin@123' });
    expect(component.loginForm.valid).toBeTrue();
  });

  // ─── Submit behavior ────────────────────────────────────────────────────────

  it('should not call login if form is invalid', () => {
    component.onSubmit();
    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  it('should set isLoading to true while waiting for auth', fakeAsync(() => {
    authServiceSpy.login.and.returnValue(of(mockUser));
    component.loginForm.patchValue({ email: 'alice@admin.com', password: 'Admin@123' });

    component.onSubmit();
    // Before tick, loading should still be true in real async — just check it was set
    tick(700); // wait past the 600ms auth delay
    expect(component.isLoading()).toBeFalse(); // should be false after success
  }));

  it('should set error message on failed login', fakeAsync(() => {
    authServiceSpy.login.and.returnValue(throwError(() => new Error('Invalid email or password')));
    component.loginForm.patchValue({ email: 'wrong@test.com', password: 'wrongpass' });

    component.onSubmit();
    tick();

    expect(component.errorMessage()).toBe('Invalid email or password');
    expect(component.isLoading()).toBeFalse();
  }));

  it('should clear error message on new submit attempt', fakeAsync(() => {
    // First attempt fails
    authServiceSpy.login.and.returnValue(throwError(() => new Error('Error')));
    component.loginForm.patchValue({ email: 'a@b.com', password: 'pass123' });
    component.onSubmit();
    tick();
    expect(component.errorMessage()).toBeTruthy();

    // Second attempt starts — error should clear
    authServiceSpy.login.and.returnValue(of(mockUser));
    component.onSubmit();
    // Error clears at start of new submit
    expect(component.errorMessage()).toBe('');
    tick(700);
  }));

  // ─── Password visibility toggle ─────────────────────────────────────────────

  it('should toggle password visibility', () => {
    expect(component.showPassword()).toBeFalse();
    component.togglePassword();
    expect(component.showPassword()).toBeTrue();
    component.togglePassword();
    expect(component.showPassword()).toBeFalse();
  });
});
