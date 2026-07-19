import { Component } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  template: `<section class="panel"><ng-content /></section>`
})
export class CardComponent {}
