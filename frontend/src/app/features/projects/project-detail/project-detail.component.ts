import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { UploadedDataFile } from '../../../core/models/file.model';
import { Insight } from '../../../core/models/insight.model';
import { Project } from '../../../core/models/project.model';
import { FileService } from '../../../core/services/file.service';
import { InsightService } from '../../../core/services/insight.service';
import { ProjectService } from '../../../core/services/project.service';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, SpinnerComponent],
  template: `
    @if (loading()) { <app-spinner label="Loading project..." /> } @else if (project()) {
      <header class="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div><a routerLink="/app/projects" class="text-sm font-semibold text-slate-500">← Projects</a><div class="mt-5 flex items-center gap-3"><span class="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{{ project()?.category || 'General' }}</span><span class="text-xs text-slate-400">Updated {{ project()?.updated_at | date:'medium' }}</span></div><h1 class="mt-3 text-3xl font-bold tracking-tight">{{ project()?.name }}</h1><p class="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{{ project()?.description || project()?.goal }}</p></div>
        <div class="flex flex-wrap gap-2"><a [routerLink]="['/app/upload']" [queryParams]="{project: project()?.id}" class="btn-secondary">↑ Add data</a><a [routerLink]="['/app/chat']" [queryParams]="{project: project()?.id}" class="btn-primary">Ask AI</a></div>
      </header>
      <nav class="mt-8 flex gap-2 overflow-x-auto border-b border-slate-200 pb-3">
        @for (action of actions; track action.label) { <a [routerLink]="action.path" [queryParams]="{project: project()?.id}" class="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">{{ action.label }}</a> }
      </nav>
      <div class="mt-7 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section class="panel p-6"><div class="flex justify-between"><h2 class="font-semibold">Source files</h2><span class="text-xs text-slate-500">{{ files().length }} files</span></div><div class="mt-4 divide-y divide-slate-100 dark:divide-slate-800">@for (file of files(); track file.id) { <div class="flex items-center gap-3 py-4"><span class="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-xs font-bold uppercase">{{ file.file_type }}</span><span class="min-w-0 flex-1"><span class="block truncate text-sm font-medium">{{ file.original_name }}</span><span class="text-xs text-slate-500">{{ file.file_size / 1024 | number:'1.0-0' }} KB</span></span><span class="rounded-full px-2 py-1 text-[11px] font-semibold" [class]="file.status === 'parsed' ? 'bg-emerald-50 text-emerald-700' : file.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'">{{ file.status }}</span></div> } @empty { <p class="py-10 text-center text-sm text-slate-500">No source files yet.</p> }</div></section>
        <section class="panel p-6"><div class="flex justify-between"><h2 class="font-semibold">Latest insights</h2><a [routerLink]="['/app/insights']" [queryParams]="{project: project()?.id}" class="text-xs font-semibold text-brand-600">Open insights</a></div><div class="mt-5 space-y-4">@for (insight of insights().slice(0, 3); track insight.id) { <div><p class="text-sm font-semibold">{{ insight.title }}</p><p class="mt-1 line-clamp-3 whitespace-pre-line text-xs leading-5 text-slate-500">{{ insight.content }}</p></div> } @empty { <p class="py-8 text-center text-sm text-slate-500">Generate insights after a file is parsed.</p> }</div></section>
      </div>
    }
  `
})
export class ProjectDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly projects = inject(ProjectService);
  private readonly fileService = inject(FileService);
  private readonly insightService = inject(InsightService);
  readonly project = signal<Project | null>(null);
  readonly files = signal<UploadedDataFile[]>([]);
  readonly insights = signal<Insight[]>([]);
  readonly loading = signal(true);
  readonly actions = [{ label: 'Upload', path: '/app/upload' }, { label: 'Insights', path: '/app/insights' }, { label: 'Dashboard', path: '/app/dashboards' }, { label: 'AI Chat', path: '/app/chat' }, { label: 'Reports', path: '/app/reports' }];
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    forkJoin({ project: this.projects.get(id), files: this.fileService.list(id), insights: this.insightService.list(id) }).subscribe({
      next: result => { this.project.set(result.project); this.files.set(result.files); this.insights.set(result.insights); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
