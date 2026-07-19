import { Component, EventEmitter, inject, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-8 dark:border-slate-800 dark:bg-slate-950/90">
      <button class="rounded-lg p-2 lg:hidden" (click)="menu.emit()" aria-label="Open navigation">☰</button>
      <div class="hidden max-w-md flex-1 lg:block">
        <label class="sr-only" for="global-search">Search</label>
        <input id="global-search" class="field bg-slate-50" placeholder="Search projects, insights, reports...">
      </div>
      <div class="ml-auto flex items-center gap-3">
        <a routerLink="/app/upload" class="btn-primary hidden sm:inline-flex">+ Upload data</a>
        <button class="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-sm">?</button>
        <button class="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100" (click)="auth.logout()">
          <span class="grid h-8 w-8 place-items-center rounded-full bg-ink text-xs font-bold text-white">{{ initials }}</span>
          <span class="hidden text-left sm:block">
            <span class="block text-xs font-semibold">{{ auth.user()?.name }}</span>
            <span class="block text-[11px] text-slate-500">Sign out</span>
          </span>
        </button>
      </div>
    </header>
  `
})
export class TopbarComponent {
  readonly auth = inject(AuthService);
  @Output() menu = new EventEmitter<void>();
  get initials(): string { return this.auth.user()?.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() ?? 'IF'; }
}
