import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  template: `
    <div class="panel p-5">
      <div class="flex items-start justify-between">
        <div>
          <p class="text-sm font-medium text-slate-500">{{ label }}</p>
          <p class="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{{ value }}</p>
        </div>
        <span class="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 font-bold text-brand-600">{{ icon }}</span>
      </div>
      @if (change) { <p class="mt-3 text-xs font-medium text-brand-600">{{ change }}</p> }
    </div>
  `
})
export class StatCardComponent {
  @Input() label = '';
  @Input() value: string | number = 0;
  @Input() icon = '↗';
  @Input() change = '';
}
