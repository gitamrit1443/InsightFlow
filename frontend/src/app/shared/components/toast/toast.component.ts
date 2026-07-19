import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="fixed right-4 top-4 z-[100] space-y-3" aria-live="polite">
      @for (toast of service.toasts(); track toast.id) {
        <button class="block min-w-72 rounded-xl border px-4 py-3 text-left text-sm font-medium shadow-lg"
          [class]="toast.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' : toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-700'"
          (click)="service.dismiss(toast.id)">
          {{ toast.message }}
        </button>
      }
    </div>
  `
})
export class ToastComponent { readonly service = inject(ToastService); }
