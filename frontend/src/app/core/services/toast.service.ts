import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private nextId = 1;

  show(message: string, type: Toast['type'] = 'info'): void {
    const id = this.nextId++;
    this.toasts.update(items => [...items, { id, message, type }]);
    window.setTimeout(() => this.dismiss(id), 4500);
  }

  success(message: string): void { this.show(message, 'success'); }
  error(message: string): void { this.show(message, 'error'); }
  dismiss(id: number): void { this.toasts.update(items => items.filter(item => item.id !== id)); }
}
