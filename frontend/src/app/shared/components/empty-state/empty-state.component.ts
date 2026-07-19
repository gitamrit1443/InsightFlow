import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="panel flex flex-col items-center px-6 py-14 text-center">
      <div class="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-xl text-brand-600">+</div>
      <h3 class="font-semibold text-slate-900 dark:text-white">{{ title }}</h3>
      <p class="mt-2 max-w-md text-sm leading-6 text-slate-500">{{ description }}</p>
      <div class="mt-5"><ng-content /></div>
    </div>
  `
})
export class EmptyStateComponent {
  @Input() title = 'Nothing here yet';
  @Input() description = 'Create your first item to get started.';
}
