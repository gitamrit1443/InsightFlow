import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => InputComponent), multi: true }],
  template: `
    <label class="label" [for]="id">{{ label }}</label>
    <input class="field" [id]="id" [type]="type" [placeholder]="placeholder" [value]="value"
      (input)="setValue($any($event.target).value)" (blur)="onTouched()" />
  `
})
export class InputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() id = '';
  @Input() type = 'text';
  @Input() placeholder = '';
  value = '';
  onChange: (value: string) => void = () => undefined;
  onTouched: () => void = () => undefined;
  setValue(value: string): void { this.value = value; this.onChange(value); }
  writeValue(value: string): void { this.value = value ?? ''; }
  registerOnChange(fn: (value: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
}
