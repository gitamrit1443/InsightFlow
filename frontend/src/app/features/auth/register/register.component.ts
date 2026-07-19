import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  return control.get('password')?.value === control.get('confirmPassword')?.value ? null : { mismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="min-h-screen bg-slate-50 px-5 py-10">
      <div class="mx-auto w-full max-w-lg">
        <a routerLink="/" class="flex justify-center gap-3 font-bold"><span class="grid h-10 w-10 place-items-center rounded-xl bg-ink text-brand-400">IF</span><span class="self-center">InsightFlow</span></a>
        <section class="panel mt-8 p-7 sm:p-9">
          <h1 class="text-3xl font-bold tracking-tight">Create your workspace</h1><p class="mt-2 text-sm text-slate-500">Start analyzing your first project for free.</p>
          <form class="mt-7 space-y-4" [formGroup]="form" (ngSubmit)="submit()">
            <div><label class="label" for="name">Full name</label><input id="name" class="field" formControlName="name" placeholder="Alex Morgan"></div>
            <div><label class="label" for="email">Work email</label><input id="email" class="field" type="email" formControlName="email" placeholder="alex@company.com"></div>
            <div><label class="label" for="password">Password</label><input id="password" class="field" type="password" formControlName="password" placeholder="At least 8 characters"></div>
            <div><label class="label" for="confirm">Confirm password</label><input id="confirm" class="field" type="password" formControlName="confirmPassword"></div>
            @if (form.hasError('mismatch') && form.controls.confirmPassword.touched) { <p class="text-xs text-red-600">Passwords must match.</p> }
            @if (error()) { <p class="rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ error() }}</p> }
            <button class="btn-primary mt-2 w-full" type="submit" [disabled]="form.invalid || loading()">Create free account</button>
          </form>
          <p class="mt-6 text-center text-sm text-slate-500">Already have an account? <a routerLink="/login" class="font-semibold text-brand-600">Sign in</a></p>
        </section>
      </div>
    </main>
  `
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  }, { validators: passwordsMatch });
  submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    const { name, email, password } = this.form.getRawValue();
    this.auth.register({ name, email, password }).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => void this.router.navigate(['/app']),
      error: error => this.error.set(error.error?.detail ?? 'Unable to create account.')
    });
  }
}
