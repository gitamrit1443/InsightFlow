import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { Project } from '../../../core/models/project.model';
import { ProjectService } from '../../../core/services/project.service';
import { ToastService } from '../../../core/services/toast.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe, EmptyStateComponent, SpinnerComponent],
  template: `
    <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p class="eyebrow">Analysis workspace</p><h1 class="page-title mt-2">Projects</h1><p class="mt-2 text-sm text-slate-500">Organize files, insights, dashboards, and reports by business question.</p></div>
      <a routerLink="/app/projects/new" class="btn-primary">+ Create project</a>
    </header>
    <div class="mt-7 flex items-center gap-3">
      <input class="field max-w-md" [(ngModel)]="search" (ngModelChange)="searchChanges.next($event)" placeholder="Search projects...">
      <span class="text-sm text-slate-500">{{ projects().length }} projects</span>
    </div>
    @if (loading()) { <app-spinner label="Loading projects..." /> }
    @else if (!projects().length) {
      <div class="mt-8"><app-empty-state title="Create your first analysis project" description="A project keeps source files, generated insights, dashboards, chat, and reports together."><a routerLink="/app/projects/new" class="btn-primary">Create project</a></app-empty-state></div>
    } @else {
      <div class="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        @for (project of projects(); track project.id) {
          <article class="panel group p-5 transition hover:-translate-y-0.5 hover:shadow-soft">
            <div class="flex justify-between"><span class="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 font-bold text-brand-700">{{ project.name[0] }}</span><button class="text-slate-400 hover:text-red-600" (click)="remove(project, $event)" aria-label="Delete project">×</button></div>
            <a [routerLink]="['/app/projects', project.id]" class="mt-5 block"><h2 class="font-semibold group-hover:text-brand-700">{{ project.name }}</h2><p class="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{{ project.description || project.goal || 'No description added.' }}</p></a>
            <div class="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800"><span class="rounded-full bg-slate-100 px-2.5 py-1">{{ project.category || 'General' }}</span><span>{{ project.updated_at | date:'mediumDate' }}</span></div>
          </article>
        }
      </div>
    }
  `
})
export class ProjectListComponent implements OnInit {
  private readonly service = inject(ProjectService);
  private readonly toast = inject(ToastService);
  readonly projects = signal<Project[]>([]);
  readonly loading = signal(true);
  readonly searchChanges = new Subject<string>();
  search = '';
  constructor() { this.searchChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(value => this.load(value)); }
  ngOnInit(): void { this.load(); }
  load(search = ''): void { this.loading.set(true); this.service.list(search).subscribe({ next: response => { this.projects.set(response.items); this.loading.set(false); }, error: () => this.loading.set(false) }); }
  remove(project: Project, event: Event): void {
    event.preventDefault();
    if (!window.confirm(`Delete "${project.name}" and all of its data?`)) return;
    this.service.delete(project.id).subscribe(() => { this.projects.update(items => items.filter(item => item.id !== project.id)); this.toast.success('Project deleted.'); });
  }
}
