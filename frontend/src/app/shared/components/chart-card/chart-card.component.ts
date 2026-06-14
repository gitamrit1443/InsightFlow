import { Component, Input } from '@angular/core';
import { DashboardWidget } from '../../../core/models/dashboard.model';

@Component({
  selector: 'app-chart-card',
  standalone: true,
  template: `
    <div class="panel h-full p-5">
      <div class="mb-5 flex items-center justify-between">
        <h3 class="font-semibold text-slate-900 dark:text-white">{{ widget.title }}</h3>
        <span class="text-slate-400">•••</span>
      </div>
      @if (widget.type === 'kpi') {
        <p class="text-4xl font-bold tracking-tight">{{ widget.value ?? '—' }}</p>
        <p class="mt-3 text-sm text-brand-600">Updated from project data</p>
      } @else if (widget.type === 'pie') {
        <div class="flex items-center justify-center gap-6">
          <div class="h-36 w-36 shrink-0 rounded-full" [style.background]="pieGradient()"></div>
          <div class="space-y-2">
            @for (label of (widget.labels ?? []).slice(0, 5); track label; let index = $index) {
              <div class="flex items-center gap-2 text-xs text-slate-500">
                <span class="h-2.5 w-2.5 rounded-full" [style.background]="colors[index % colors.length]"></span>
                <span class="max-w-28 truncate">{{ label }}</span>
                <strong>{{ (widget.series ?? [])[index] }}</strong>
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="flex h-44 items-end gap-2 border-b border-l border-slate-200 px-2 pt-3">
          @for (value of widget.series ?? fallback; track $index) {
            <div class="min-w-3 flex-1 rounded-t-md bg-gradient-to-t from-brand-600 to-brand-400"
              [style.height.%]="normalized(value)"></div>
          }
        </div>
        @if (widget.labels?.length) {
          <div class="mt-2 flex gap-2 overflow-hidden">
            @for (label of (widget.labels ?? []).slice(0, 8); track label) {
              <span class="min-w-0 flex-1 truncate text-center text-[10px] text-slate-400">{{ label }}</span>
            }
          </div>
        }
      }
    </div>
  `
})
export class ChartCardComponent {
  @Input({ required: true }) widget!: DashboardWidget;
  readonly fallback = [34, 62, 48, 75, 58, 88, 72];
  readonly colors = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#06b6d4'];
  normalized(value: number): number {
    const values = this.widget.series?.length ? this.widget.series : this.fallback;
    const max = Math.max(...values, 1);
    return Math.max(8, Math.min(100, value / max * 100));
  }
  pieGradient(): string {
    const values = this.widget.series?.length ? this.widget.series : [44, 31, 25];
    const total = values.reduce((sum, value) => sum + value, 0) || 1;
    let cursor = 0;
    const segments = values.slice(0, 5).map((value, index) => {
      const start = cursor;
      cursor += value / total * 100;
      return `${this.colors[index]} ${start}% ${cursor}%`;
    });
    return `conic-gradient(${segments.join(', ')})`;
  }
}
