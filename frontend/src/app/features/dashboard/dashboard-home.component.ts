import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Project } from '../../core/models/project.model';
import { ProjectService } from '../../core/services/project.service';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [RouterLink, DatePipe, SpinnerComponent, StatCardComponent],
  template: `
    <div class="flex flex-col gap-8">
      <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p class="eyebrow">Workspace overview</p><h1 class="page-title mt-2">Welcome back, {{ firstName }}</h1><p class="mt-2 text-sm text-slate-500">Here’s what is happening across your analysis workspace.</p></div>
        <div class="flex gap-3"><a routerLink="/app/projects/new" class="btn-secondary">New project</a><a routerLink="/app/upload" class="btn-primary">↑ Upload new data</a></div>
      </header>
      <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <app-stat-card label="Total projects" [value]="projects().length" icon="P" change="+ Ready for analysis" />
        <app-stat-card label="Files analyzed" [value]="projects().length ? 12 : 0" icon="F" change="Across all projects" />
        <app-stat-card label="Insights generated" [value]="projects().length ? 28 : 0" icon="I" change="+8 this week" />
        <app-stat-card label="Reports exported" [value]="projects().length ? 6 : 0" icon="R" change="2 shared recently" />
      </section>
      <div class="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section class="panel p-6">
          <div class="flex items-center justify-between"><div><h2 class="font-semibold">Recent projects</h2><p class="mt-1 text-xs text-slate-500">Continue where you left off</p></div><a routerLink="/app/projects" class="text-sm font-semibold text-brand-600">View all</a></div>
          @if (loading()) { <app-spinner /> } @else {
            <div class="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
              @for (project of projects().slice(0, 4); track project.id) {
                <a [routerLink]="['/app/projects', project.id]" class="flex items-center gap-4 py-4">
                  <span class="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 font-bold text-slate-600">{{ project.name[0] }}</span>
                  <span class="min-w-0 flex-1"><span class="block truncate text-sm font-semibold">{{ project.name }}</span><span class="mt-1 block text-xs text-slate-500">{{ project.category || 'General analysis' }} · Updated {{ project.updated_at | date:'mediumDate' }}</span></span>
                  <span class="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Active</span>
                </a>
              } @empty { <div class="py-10 text-center text-sm text-slate-500">Create a project to start analyzing data.</div> }
            </div>
          }
        </section>
        <section class="panel p-6">
          <h2 class="font-semibold">Suggested actions</h2>
          <div class="mt-5 space-y-3">
            @for (action of actions; track action.title) {
              <a [routerLink]="action.path" class="flex gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-brand-200 hover:bg-brand-50/50 dark:border-slate-800">
                <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">{{ action.icon }}</span>
                <span><span class="block text-sm font-semibold">{{ action.title }}</span><span class="mt-1 block text-xs leading-5 text-slate-500">{{ action.text }}</span></span>
              </a>
            }
          </div>
        </section>
      </div>
      <section class="panel p-6"><h2 class="font-semibold">Activity timeline</h2><div class="mt-6 grid gap-5 md:grid-cols-3">@for (event of activity; track event.title) { <div class="border-l-2 border-brand-200 pl-4"><p class="text-xs text-slate-400">{{ event.time }}</p><p class="mt-1 text-sm font-semibold">{{ event.title }}</p><p class="mt-1 text-xs text-slate-500">{{ event.detail }}</p></div> }</div></section>
    </div>
  `
})
export class DashboardHomeComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly projectsService = inject(ProjectService);
  readonly projects = signal<Project[]>([]);
  readonly loading = signal(true);
  readonly actions = [
    { icon: '↑', title: 'Analyze a new file', text: 'Upload a spreadsheet, PDF, or feedback export.', path: '/app/upload' },
    { icon: '✦', title: 'Generate fresh insights', text: 'Turn parsed project data into clear findings.', path: '/app/insights' },
    { icon: 'Q', title: 'Ask your data a question', text: 'Explore a project with natural language.', path: '/app/chat' }
  ];
  readonly activity = [
    { time: 'Today', title: 'Workspace ready', detail: 'Your dashboard is synchronized with the API.' },
    { time: 'Next', title: 'Upload source data', detail: 'InsightFlow will extract and validate its structure.' },
    { time: 'Then', title: 'Generate decisions', detail: 'Create insights, dashboards, reports, and chat answers.' }
  ];
  get firstName(): string { return this.auth.user()?.name.split(' ')[0] ?? 'Analyst'; }
  ngOnInit(): void { this.projectsService.list().subscribe({ next: response => { this.projects.set(response.items); this.loading.set(false); }, error: () => this.loading.set(false) }); }
}
