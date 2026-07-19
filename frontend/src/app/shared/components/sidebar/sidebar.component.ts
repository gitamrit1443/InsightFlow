import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="fixed inset-y-0 left-0 z-40 w-64 bg-ink px-4 py-5 text-white transition-transform lg:translate-x-0"
      [class.-translate-x-full]="!open">
      <div class="flex items-center justify-between px-2">
        <a routerLink="/app" class="flex items-center gap-3">
          <span class="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 font-black text-ink">IF</span>
          <span class="text-lg font-bold">InsightFlow</span>
        </a>
        <button class="lg:hidden" (click)="close.emit()">✕</button>
      </div>
      <nav class="mt-9 space-y-1">
        @for (item of nav; track item.path) {
          <a [routerLink]="item.path" routerLinkActive="bg-white/10 text-white"
            [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
            class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
            (click)="close.emit()">
            <span class="w-5 text-center">{{ item.icon }}</span>{{ item.label }}
          </a>
        }
      </nav>
      <div class="absolute bottom-5 left-4 right-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p class="text-xs font-semibold text-brand-400">PRO WORKSPACE</p>
        <p class="mt-2 text-sm text-slate-300">Unlock 200 AI analyses each day.</p>
        <button class="mt-3 text-xs font-semibold text-white">View plan →</button>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  @Input() open = false;
  @Output() close = new EventEmitter<void>();
  readonly nav = [
    { path: '/app', label: 'Home', icon: '⌂', exact: true },
    { path: '/app/projects', label: 'Projects', icon: '▦' },
    { path: '/app/upload', label: 'Upload Data', icon: '↑' },
    { path: '/app/insights', label: 'Insights', icon: '✦' },
    { path: '/app/dashboards', label: 'Dashboards', icon: '▥' },
    { path: '/app/chat', label: 'AI Chat', icon: '◌' },
    { path: '/app/reports', label: 'Reports', icon: '▤' },
    { path: '/app/settings', label: 'Settings', icon: '⚙' }
  ];
}
