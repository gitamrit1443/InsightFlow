import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950">
      <app-sidebar [open]="menuOpen" (close)="menuOpen = false" />
      <div class="lg:pl-64">
        <app-topbar (menu)="menuOpen = true" />
        <main class="mx-auto max-w-[1600px] p-4 lg:p-8"><router-outlet /></main>
      </div>
      @if (menuOpen) { <button class="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" (click)="menuOpen = false" aria-label="Close menu"></button> }
    </div>
  `
})
export class AppShellComponent { menuOpen = false; }
