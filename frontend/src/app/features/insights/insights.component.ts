import { DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { Insight } from '../../core/models/insight.model';
import { Project } from '../../core/models/project.model';
import { InsightService } from '../../core/services/insight.service';
import { ProjectService } from '../../core/services/project.service';
import { ToastService } from '../../core/services/toast.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [DecimalPipe, EmptyStateComponent, StatCardComponent],
  template: `
    <header class="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div><p class="eyebrow">AI analysis</p><h1 class="page-title mt-2">Insights</h1><p class="mt-2 text-sm text-slate-500">Clear findings, emerging trends, anomalies, and practical recommendations.</p></div>
      <div class="flex gap-3"><select class="field min-w-64" [value]="projectId()" (change)="choose($event)"><option value="">Select project</option>@for (project of projects(); track project.id) { <option [value]="project.id">{{ project.name }}</option> }</select><button class="btn-primary whitespace-nowrap" [disabled]="!projectId() || generating()" (click)="generate()">@if (generating()) { <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span> } Generate insights</button></div>
    </header>
    @if (!insights().length) { <div class="mt-8"><app-empty-state title="No generated insights yet" description="Select a project with at least one parsed file, then run AI analysis."></app-empty-state></div> }
    @else {
      <section class="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        @for (metric of metrics; track metric.label) { <app-stat-card [label]="metric.label" [value]="metric.value" [icon]="metric.icon" [change]="metric.change" /> }
      </section>
      <div class="mt-6 grid gap-6 xl:grid-cols-[220px_1fr_320px]">
        <aside class="panel h-fit p-4"><p class="px-2 text-xs font-bold uppercase tracking-wider text-slate-400">Sections</p><nav class="mt-3 space-y-1">@for (insight of insights(); track insight.id) { <a [href]="'#insight-' + insight.id" class="block rounded-lg px-2 py-2 text-sm text-slate-600 hover:bg-slate-100">{{ insight.title }}</a> }</nav></aside>
        <main class="space-y-5">@for (insight of mainInsights; track insight.id) { <article class="panel scroll-mt-24 p-6" [id]="'insight-' + insight.id"><div class="flex items-start justify-between"><div><p class="eyebrow">{{ insight.type.replace('_', ' ') }}</p><h2 class="mt-2 text-lg font-semibold">{{ insight.title }}</h2></div>@if (insight.confidence_score) { <span class="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{{ insight.confidence_score * 100 | number:'1.0-0' }}% confidence</span> }</div><p class="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-slate-300">{{ insight.content }}</p></article> }</main>
        <aside class="space-y-5"><section class="panel p-5"><h2 class="font-semibold">Recommendations</h2><p class="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">{{ recommendation?.content || 'Generate insights to see prioritized actions.' }}</p></section><section class="rounded-2xl bg-ink p-5 text-white"><p class="text-xs font-bold text-brand-400">NEXT QUESTION</p><p class="mt-3 text-sm leading-6 text-slate-300">{{ question?.content || 'Which segment should we investigate next?' }}</p></section></aside>
      </div>
    }
  `
})
export class InsightsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly projectsService = inject(ProjectService);
  private readonly service = inject(InsightService);
  private readonly toast = inject(ToastService);
  readonly projects = signal<Project[]>([]);
  readonly projectId = signal('');
  readonly insights = signal<Insight[]>([]);
  readonly generating = signal(false);
  readonly metrics = [
    { label: 'Total records', value: '1,842', icon: '#', change: 'Across parsed files' }, { label: 'Growth rate', value: '+14.2%', icon: '↗', change: 'Recent direction' },
    { label: 'Sentiment score', value: '72%', icon: 'S', change: 'Positive signal' }, { label: 'Churn risk', value: '18', icon: '!', change: 'Accounts to review' }
  ];
  get mainInsights(): Insight[] { return this.insights().filter(item => !['recommendations', 'follow_up_questions'].includes(item.type)); }
  get recommendation(): Insight | undefined { return this.insights().find(item => item.type === 'recommendations'); }
  get question(): Insight | undefined { return this.insights().find(item => item.type === 'follow_up_questions'); }
  ngOnInit(): void { this.projectId.set(this.route.snapshot.queryParamMap.get('project') ?? ''); this.projectsService.list().subscribe(response => { this.projects.set(response.items); if (this.projectId()) this.load(); }); }
  choose(event: Event): void { this.projectId.set((event.target as HTMLSelectElement).value); this.load(); }
  load(): void { if (!this.projectId()) { this.insights.set([]); return; } this.service.list(this.projectId()).subscribe(items => this.insights.set(items)); }
  generate(): void { if (!this.projectId() || this.generating()) return; this.generating.set(true); this.service.generate(this.projectId()).pipe(finalize(() => this.generating.set(false))).subscribe({ next: items => { this.insights.set(items); this.toast.success('Insights generated.'); }, error: error => this.toast.error(error.error?.detail ?? 'Could not generate insights.') }); }
}
