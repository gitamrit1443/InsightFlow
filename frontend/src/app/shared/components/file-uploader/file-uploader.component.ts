import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'app-file-uploader',
  standalone: true,
  template: `
    <label class="block cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition"
      [class]="dragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-slate-50 hover:border-brand-400 dark:border-slate-700 dark:bg-slate-900'">
      <input type="file" class="hidden" accept=".csv,.xlsx,.pdf,.txt,.json" (change)="choose($event)" [disabled]="disabled">
      <span class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-2xl shadow-sm dark:bg-slate-800">↑</span>
      <p class="mt-4 font-semibold text-slate-900 dark:text-white">Drop your data here or browse</p>
      <p class="mt-2 text-sm text-slate-500">CSV, XLSX, PDF, TXT or JSON · maximum 10MB</p>
    </label>
  `
})
export class FileUploaderComponent {
  @Input() disabled = false;
  @Output() fileSelected = new EventEmitter<File>();
  dragging = false;

  @HostListener('dragover', ['$event']) onDragOver(event: DragEvent): void { event.preventDefault(); this.dragging = true; }
  @HostListener('dragleave') onDragLeave(): void { this.dragging = false; }
  @HostListener('drop', ['$event']) onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging = false;
    const file = event.dataTransfer?.files.item(0);
    if (file && !this.disabled) this.fileSelected.emit(file);
  }
  choose(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.item(0);
    if (file) this.fileSelected.emit(file);
  }
}
