import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-progress-stepper',
  standalone: true,
  template: `
    <div class="space-y-3">
      @for (step of steps; track step; let index = $index) {
        <div class="flex items-center gap-3 text-sm">
          <span class="grid h-7 w-7 place-items-center rounded-full font-semibold"
            [class]="index < active ? 'bg-brand-500 text-white' : index === active ? 'border-2 border-brand-500 text-brand-600' : 'bg-slate-100 text-slate-400'">
            {{ index < active ? '✓' : index + 1 }}
          </span>
          <span [class]="index <= active ? 'font-medium text-slate-800 dark:text-slate-200' : 'text-slate-400'">{{ step }}</span>
        </div>
      }
    </div>
  `
})
export class ProgressStepperComponent {
  @Input() steps: string[] = [];
  @Input() active = 0;
}
