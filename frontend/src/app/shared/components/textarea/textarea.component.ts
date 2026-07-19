import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-textarea',
  standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TextareaComponent), multi: true }],
  template: `
    <label class="label" [for]="id">{{ label }}</label>
    <textarea class="field min-h-28 resize-y" [id]="id" [placeholder]="placeholder" [value]="value"
      (input)="setValue($any($event.target).value)" (blur)="onTouched()"></textarea>
  `
})
export class TextareaComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() id = '';
  @Input() placeholder = '';
  value = '';
  onChange: (value: string) => void = () => undefined;
  onTouched: () => void = () => undefined;
  setValue(value: string): void { this.value = value; this.onChange(value); }
  writeValue(value: string): void { this.value = value ?? ''; }
  registerOnChange(fn: (value: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
}
