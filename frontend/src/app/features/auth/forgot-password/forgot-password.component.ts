import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <main class="grid min-h-screen place-items-center bg-slate-50 p-5">
      <section class="panel w-full max-w-md p-8 text-center">
        <span class="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-ink font-bold text-brand-400">IF</span>
        <h1 class="mt-6 text-2xl font-bold">Reset your password</h1>
        <p class="mt-2 text-sm leading-6 text-slate-500">Enter your email and we’ll send instructions when email delivery is configured.</p>
        @if (!sent()) {
          <input class="field mt-6 text-left" [(ngModel)]="email" type="email" placeholder="you@company.com">
          <button class="btn-primary mt-4 w-full" (click)="sent.set(true)" [disabled]="!email">Send reset link</button>
        } @else { <p class="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">Reset instructions are ready to be sent to {{ email }}.</p> }
        <a routerLink="/login" class="mt-6 inline-block text-sm font-semibold text-brand-600">← Back to sign in</a>
      </section>
    </main>
  `
})
export class ForgotPasswordComponent { email = ''; readonly sent = signal(false); }
