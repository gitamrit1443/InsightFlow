import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="grid min-h-screen bg-white lg:grid-cols-2">
      <section class="flex items-center justify-center px-5 py-12">
        <div class="w-full max-w-md">
          <a routerLink="/" class="flex items-center gap-3 font-bold"><span class="grid h-10 w-10 place-items-center rounded-xl bg-ink text-brand-400">IF</span>InsightFlow</a>
          <h1 class="mt-12 text-3xl font-bold tracking-tight">Welcome back</h1>
          <p class="mt-2 text-sm text-slate-500">Sign in to continue turning data into decisions.</p>
          <form class="mt-8 space-y-5" [formGroup]="form" (ngSubmit)="submit()">
            <div><label class="label" for="email">Email address</label><input id="email" class="field" type="email" formControlName="email" placeholder="you@company.com"></div>
            <div><div class="flex justify-between"><label class="label" for="password">Password</label><a routerLink="/forgot-password" class="text-xs font-semibold text-brand-600">Forgot password?</a></div><input id="password" class="field" type="password" formControlName="password" placeholder="••••••••"></div>
            @if (error()) { <p class="rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ error() }}</p> }
            <button class="btn-primary w-full" type="submit" [disabled]="form.invalid || loading()">@if (loading()) { <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span> } Sign in</button>
          </form>
          <div class="my-6 flex items-center gap-3 text-xs text-slate-400"><span class="h-px flex-1 bg-slate-200"></span>OR CONTINUE WITH<span class="h-px flex-1 bg-slate-200"></span></div>
          <div class="grid grid-cols-2 gap-3"><button class="btn-secondary">Google</button><button class="btn-secondary">GitHub</button></div>
          <p class="mt-8 text-center text-sm text-slate-500">New to InsightFlow? <a routerLink="/register" class="font-semibold text-brand-600">Create an account</a></p>
          <button class="mt-3 w-full text-center text-xs text-slate-400" (click)="demo()">Use demo credentials</button>
        </div>
      </section>
      <section class="relative hidden overflow-hidden bg-ink p-16 text-white lg:flex lg:flex-col lg:justify-end">
        <div class="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl"></div>
        <blockquote class="relative max-w-xl text-3xl font-semibold leading-snug">“InsightFlow cut our weekly reporting cycle from two days to under an hour.”</blockquote>
        <p class="relative mt-6 text-sm text-slate-400">Operations leader · Growth-stage SaaS</p>
      </section>
    </main>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]], password: ['', Validators.required] });

  submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true); this.error.set('');
    this.auth.login(this.form.getRawValue()).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => void this.router.navigate(['/app']),
      error: error => this.error.set(error.error?.detail ?? 'Unable to sign in.')
    });
  }
  demo(): void { this.form.setValue({ email: 'demo@insightflow.ai', password: 'Demo1234!' }); }
}
