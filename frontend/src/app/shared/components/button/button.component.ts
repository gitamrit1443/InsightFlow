import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="variant === 'primary' ? 'btn-primary' : 'btn-secondary'"
      (click)="pressed.emit()">
      @if (loading) { <span class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span> }
      <ng-content />
    </button>
  `
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' = 'primary';
  @Input() type: 'button' | 'submit' = 'button';
  @Input() loading = false;
  @Input() disabled = false;
  @Output() pressed = new EventEmitter<void>();
}
