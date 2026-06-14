import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    @if (open) {
      <div class="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4" (click)="closed.emit()">
        <section class="panel w-full max-w-lg p-6" (click)="$event.stopPropagation()">
          <div class="mb-5 flex items-center justify-between">
            <h2 class="text-lg font-semibold">{{ title }}</h2>
            <button class="text-slate-400" (click)="closed.emit()" aria-label="Close">✕</button>
          </div>
          <ng-content />
        </section>
      </div>
    }
  `
})
export class ModalComponent {
  @Input() open = false;
  @Input() title = '';
  @Output() closed = new EventEmitter<void>();
}
