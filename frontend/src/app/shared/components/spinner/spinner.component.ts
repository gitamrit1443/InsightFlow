import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  standalone: true,
  template: `
    <div class="flex items-center justify-center gap-3 py-10 text-sm text-slate-500">
      <span class="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></span>
      {{ label }}
    </div>
  `
})
export class SpinnerComponent { @Input() label = 'Loading...'; }
