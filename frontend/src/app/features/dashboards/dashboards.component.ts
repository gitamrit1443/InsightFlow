import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { Dashboard, DashboardWidget } from '../../core/models/dashboard.model';
import { Project } from '../../core/models/project.model';
import { DashboardService } from '../../core/services/dashboard.service';
import { ProjectService } from '../../core/services/project.service';
import { ToastService } from '../../core/services/toast.service';
import { ChartCardComponent } from '../../shared/components/chart-card/chart-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-dashboards',
  standalone: true,
  imports: [FormsModule, ChartCardComponent, EmptyStateComponent],
  template: `
    <header class="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
      <div><p class="eyebrow">Visual analysis</p><h1 class="page-title mt-2">Dashboard builder</h1><p class="mt-2 text-sm text-slate-500">Generate a visual plan, then refine the widgets for your audience.</p></div>
      <div class="flex flex-wrap gap-2"><select class="field min-w-60" [value]="projectId()" (change)="choose($event)"><option value="">Select project</option>@for (project of projects(); track project.id) { <option [value]="project.id">{{ project.name }}</option> }</select><button class="btn-secondary" [disabled]="!dashboard()" (click)="addChart()">+ Add chart</button><button class="btn-primary" [disabled]="!projectId() || generating()" (click)="generate()">@if (generating()) { <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span> } Generate dashboard</button></div>
    </header>
    @if (!dashboard()) { <div class="mt-8"><app-empty-state title="No dashboard generated" description="Select a project and let InsightFlow propose KPI cards, trends, and category visuals."></app-empty-state></div> }
    @else {
      <section class="mt-7 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
        <input class="field max-w-md font-semibold" [(ngModel)]="dashboardName" (blur)="saveName()" aria-label="Dashboard name">
        <div class="ml-auto flex flex-wrap gap-2"><select class="field w-auto"><option>All dates</option><option>Last 30 days</option><option>This quarter</option></select><select class="field w-auto"><option>All categories</option><option>High priority</option></select><button class="btn-secondary" (click)="toast.show('Dashboard export is ready for provider integration.')">Export</button></div>
      </section>
      <div class="mt-5 grid auto-rows-[250px] gap-5 md:grid-cols-2 xl:grid-cols-3">
        @for (widget of widgets(); track $index) {
          <div [class]="widget.type === 'line' || widget.type === 'area' ? 'group relative md:col-span-2' : 'group relative'">
            <app-chart-card [widget]="widget" />
            <div class="absolute right-4 top-4 hidden gap-1 group-hover:flex"><button class="rounded-lg bg-white px-2 py-1 text-xs shadow" (click)="rename(widget)">Rename</button><button class="rounded-lg bg-white px-2 py-1 text-xs text-red-600 shadow" (click)="remove($index)">Remove</button></div>
          </div>
        }
      </div>
    }
  `
})
export class DashboardsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly projectsService = inject(ProjectService);
  private readonly service = inject(DashboardService);
  readonly toast = inject(ToastService);
  readonly projects = signal<Project[]>([]);
  readonly projectId = signal('');
  readonly dashboard = signal<Dashboard | null>(null);
  readonly widgets = signal<DashboardWidget[]>([]);
  readonly generating = signal(false);
  dashboardName = '';
  ngOnInit(): void { this.projectId.set(this.route.snapshot.queryParamMap.get('project') ?? ''); this.projectsService.list().subscribe(response => { this.projects.set(response.items); if (this.projectId()) this.load(); }); }
  choose(event: Event): void { this.projectId.set((event.target as HTMLSelectElement).value); this.load(); }
  load(): void { if (!this.projectId()) return; this.service.list(this.projectId()).subscribe(items => this.setDashboard(items[0] ?? null)); }
  generate(): void { if (!this.projectId() || this.generating()) return; this.generating.set(true); this.service.generate(this.projectId()).pipe(finalize(() => this.generating.set(false))).subscribe({ next: item => { this.setDashboard(item); this.toast.success('Dashboard generated.'); }, error: error => this.toast.error(error.error?.detail ?? 'Dashboard generation failed.') }); }
  setDashboard(item: Dashboard | null): void { this.dashboard.set(item); this.dashboardName = item?.name ?? ''; this.widgets.set(item?.layout_config.widgets ?? []); }
  addChart(): void { this.widgets.update(items => [...items, { type: 'bar', title: 'New comparison', series: [28, 46, 64, 52, 78] }]); this.persist(); }
  remove(index: number): void { this.widgets.update(items => items.filter((_, itemIndex) => itemIndex !== index)); this.persist(); }
  rename(widget: DashboardWidget): void { const name = window.prompt('Chart title', widget.title); if (name) { widget.title = name; this.widgets.update(items => [...items]); this.persist(); } }
  saveName(): void { const dashboard = this.dashboard(); if (dashboard && this.dashboardName.trim()) this.service.update(dashboard.id, { name: this.dashboardName }).subscribe(); }
  persist(): void { const dashboard = this.dashboard(); if (dashboard) this.service.update(dashboard.id, { layout_config: { ...dashboard.layout_config, widgets: this.widgets() } }).subscribe(updated => this.dashboard.set(updated)); }
}
