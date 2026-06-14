import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { Project } from '../../core/models/project.model';
import { Report } from '../../core/models/report.model';
import { ProjectService } from '../../core/services/project.service';
import { ReportService } from '../../core/services/report.service';
import { ToastService } from '../../core/services/toast.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule, DatePipe, EmptyStateComponent],
  template: `
    <header class="flex flex-col justify-between gap-4 xl:flex-row xl:items-end"><div><p class="eyebrow">Stakeholder deliverables</p><h1 class="page-title mt-2">Reports</h1><p class="mt-2 text-sm text-slate-500">Turn project findings into a structured business narrative.</p></div><div class="flex flex-wrap gap-2"><select class="field min-w-60" [value]="projectId()" (change)="choose($event)"><option value="">Select project</option>@for (project of projects(); track project.id) { <option [value]="project.id">{{ project.name }}</option> }</select><button class="btn-primary" [disabled]="!projectId() || generating()" (click)="generate()">@if (generating()) { <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span> } Generate report</button></div></header>
    @if (!selected()) { <div class="mt-8"><app-empty-state title="No report selected" description="Generate a report from a project’s saved insights and dashboards."></app-empty-state></div> }
    @else {
      <div class="mt-7 grid gap-6 xl:grid-cols-[260px_1fr]">
        <aside class="panel h-fit p-4"><p class="px-2 text-xs font-bold uppercase tracking-wider text-slate-400">Project reports</p><div class="mt-3 space-y-2">@for (report of reports(); track report.id) { <button class="w-full rounded-xl p-3 text-left hover:bg-slate-100" [class.bg-brand-50]="selected()?.id === report.id" (click)="selected.set(report)"><span class="block text-sm font-semibold">{{ report.title }}</span><span class="mt-1 block text-xs text-slate-400">{{ report.created_at | date:'mediumDate' }}</span></button> }</div></aside>
        <article class="panel overflow-hidden">
          <header class="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center"><div><p class="text-xs font-semibold text-brand-600">ANALYSIS REPORT</p><h2 class="mt-1 text-lg font-bold">{{ selected()?.title }}</h2></div><div class="flex flex-wrap gap-2"><button class="btn-secondary" (click)="copy()">Copy summary</button><button class="btn-secondary" (click)="placeholder('PDF')">Download PDF</button><button class="btn-secondary" (click)="placeholder('DOCX')">Export DOCX</button><button class="btn-secondary" (click)="placeholder('sharing')">Share</button></div></header>
          <div class="mx-auto max-w-4xl p-6 sm:p-10"><div class="whitespace-pre-wrap text-sm leading-8 text-slate-700 dark:text-slate-300">{{ selected()?.content }}</div><div class="mt-10 grid gap-4 sm:grid-cols-3">@for (item of ['Risks reviewed', 'Opportunities ranked', 'Next steps defined']; track item) { <div class="rounded-xl bg-slate-50 p-4 text-center text-xs font-semibold text-slate-600">{{ item }}</div> }</div></div>
        </article>
      </div>
    }
  `
})
export class ReportsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly projectsService = inject(ProjectService);
  private readonly service = inject(ReportService);
  private readonly toast = inject(ToastService);
  readonly projects = signal<Project[]>([]);
  readonly projectId = signal('');
  readonly reports = signal<Report[]>([]);
  readonly selected = signal<Report | null>(null);
  readonly generating = signal(false);
  ngOnInit(): void { this.projectId.set(this.route.snapshot.queryParamMap.get('project') ?? ''); this.projectsService.list().subscribe(response => { this.projects.set(response.items); if (this.projectId()) this.load(); }); }
  choose(event: Event): void { this.projectId.set((event.target as HTMLSelectElement).value); this.load(); }
  load(): void { if (!this.projectId()) return; this.service.list(this.projectId()).subscribe(items => { this.reports.set(items); this.selected.set(items[0] ?? null); }); }
  generate(): void { if (!this.projectId() || this.generating()) return; this.generating.set(true); this.service.generate(this.projectId()).pipe(finalize(() => this.generating.set(false))).subscribe({ next: report => { this.reports.update(items => [report, ...items]); this.selected.set(report); this.toast.success('Report generated.'); }, error: error => this.toast.error(error.error?.detail ?? 'Report generation failed.') }); }
  copy(): void { const content = this.selected()?.content; if (content) { void navigator.clipboard.writeText(content); this.toast.success('Report copied.'); } }
  placeholder(type: string): void { this.toast.show(`${type} export is prepared as an integration placeholder.`); }
}
