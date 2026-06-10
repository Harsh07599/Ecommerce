import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  OnInit,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../../core/auth/auth.service';

/*
 * WHY OnPush?
 * The login form only changes state when: the user types, submits, or an error arrives.
 * All of these are signal/event-driven. OnPush ensures Angular skips this component
 * during unrelated change detection cycles, which is especially important in a large app
 * where the root component's CD can cascade unnecessarily.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  // Dependencies via inject()
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // ─── Local UI state as signals ─────────────────────────────────────────────
  isLoading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);

  // Reactive login form
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  // ─── Form submission ───────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.loginForm.invalid) return;

    const { email, password } = this.loginForm.value;

    this.isLoading.set(true);
    this.errorMessage.set('');

    // The auth service handles the 600ms delay + bcrypt comparison
    this.auth.login(email!, password!).subscribe({
      next: user => {
        this.isLoading.set(false);

        // After login, redirect to returnUrl (if came from a guard redirect)
        // or to the role-appropriate default page
        const returnUrl = this.route.snapshot.queryParams['returnUrl'];
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
        } else if (user.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/shop']);
        }
      },
      error: (err: Error) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Login failed. Please try again.');
      },
    });
  }

  // Toggle password field visibility
  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  // Helpers to check form field errors cleanly in the template
  get emailControl() { return this.loginForm.get('email')!; }
  get passwordControl() { return this.loginForm.get('password')!; }
}
