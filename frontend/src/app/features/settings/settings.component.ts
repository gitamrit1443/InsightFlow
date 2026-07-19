import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { SettingsService, WorkspaceSettings } from '../../core/services/settings.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <header><p class="eyebrow">Workspace controls</p><h1 class="page-title mt-2">Settings</h1><p class="mt-2 text-sm text-slate-500">Manage your profile, organization, preferences, plan, and data controls.</p></header>
    <div class="mt-7 grid gap-6 xl:grid-cols-[220px_1fr]">
      <nav class="panel h-fit p-3">@for (section of sections; track section) { <a [href]="'#' + section.toLowerCase().replace(' ', '-')" class="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100">{{ section }}</a> }</nav>
      <form class="space-y-6" [formGroup]="form" (ngSubmit)="save()">
        <section id="profile" class="panel p-6"><h2 class="font-semibold">Profile settings</h2><div class="mt-5 grid gap-5 sm:grid-cols-2"><div><label class="label">Name</label><input class="field" [value]="auth.user()?.name" disabled></div><div><label class="label">Email</label><input class="field" [value]="auth.user()?.email" disabled></div></div></section>
        <section id="organization" class="panel p-6"><h2 class="font-semibold">Organization</h2><div class="mt-5"><label class="label" for="organization">Organization name</label><input id="organization" class="field" formControlName="organization_name" placeholder="Acme, Inc."></div></section>
        <section id="appearance" class="panel p-6"><h2 class="font-semibold">Appearance & notifications</h2><div class="mt-5 grid gap-5 sm:grid-cols-2"><div><label class="label" for="theme">Theme</label><select id="theme" class="field" formControlName="theme" (change)="previewTheme()"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></div><label class="flex items-center gap-3 self-end rounded-xl border border-slate-200 p-3 text-sm"><input type="checkbox" formControlName="notification_enabled"> Product and analysis notifications</label></div></section>
        <section id="api-access" class="panel p-6"><h2 class="font-semibold">API access</h2><p class="mt-2 text-sm text-slate-500">External API keys are managed by the server environment and are never exposed here.</p><div class="mt-4 flex"><input class="field rounded-r-none" value="sk-insightflow••••••••••••" disabled><button type="button" class="btn-secondary rounded-l-none" (click)="toast.show('API key management is an integration placeholder.')">Manage</button></div></section>
        <section id="billing" class="panel p-6"><div class="flex justify-between"><div><h2 class="font-semibold">Billing plan</h2><p class="mt-2 text-sm text-slate-500">Current plan includes daily AI request protection.</p></div><span class="h-fit rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase text-brand-700">{{ settings()?.billing_plan || 'free' }}</span></div></section>
        <section id="data-privacy" class="panel p-6"><h2 class="font-semibold">Data privacy</h2><div class="mt-5"><label class="label" for="retention">Data retention period</label><select id="retention" class="field max-w-xs" formControlName="data_retention_days"><option [value]="30">30 days</option><option [value]="90">90 days</option><option [value]="365">1 year</option></select></div></section>
        <div class="flex justify-end"><button class="btn-primary" type="submit" [disabled]="form.invalid || saving()">@if (saving()) { <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span> } Save settings</button></div>
      </form>
    </div>
  `
})
export class SettingsComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(SettingsService);
  readonly settings = signal<WorkspaceSettings | null>(null);
  readonly saving = signal(false);
  readonly sections = ['Profile', 'Organization', 'Appearance', 'API Access', 'Billing', 'Data Privacy'];
  readonly form = this.fb.nonNullable.group({ organization_name: [''], theme: ['system', Validators.pattern(/^(light|dark|system)$/)], notification_enabled: [true], data_retention_days: [30, [Validators.min(1), Validators.max(3650)]] });
  ngOnInit(): void { this.service.get().subscribe(settings => { this.settings.set(settings); this.form.patchValue({ organization_name: settings.organization_name ?? '', theme: settings.theme, notification_enabled: settings.notification_enabled, data_retention_days: settings.data_retention_days }); this.applyTheme(settings.theme); }); }
  save(): void { if (this.form.invalid || this.saving()) return; this.saving.set(true); this.service.update(this.form.getRawValue() as Partial<WorkspaceSettings>).pipe(finalize(() => this.saving.set(false))).subscribe(settings => { this.settings.set(settings); this.applyTheme(settings.theme); this.toast.success('Workspace settings saved.'); }); }
  previewTheme(): void { this.applyTheme(this.form.controls.theme.value as WorkspaceSettings['theme']); }
  private applyTheme(theme: WorkspaceSettings['theme']): void { const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches); document.documentElement.classList.toggle('dark', dark); }
}
