import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { FileService } from '../../../core/services/file.service';
import { ProjectService } from '../../../core/services/project.service';
import { ToastService } from '../../../core/services/toast.service';
import { FileUploaderComponent } from '../../../shared/components/file-uploader/file-uploader.component';

@Component({
  selector: 'app-project-create',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, FileUploaderComponent],
  template: `
    <div class="mx-auto max-w-3xl">
      <a routerLink="/app/projects" class="text-sm font-semibold text-slate-500">← Back to projects</a>
      <header class="mt-6"><p class="eyebrow">New analysis</p><h1 class="page-title mt-2">Create a project</h1><p class="mt-2 text-sm text-slate-500">Define the decision you want the data to support.</p></header>
      <form class="panel mt-7 space-y-6 p-6 sm:p-8" [formGroup]="form" (ngSubmit)="submit()">
        <div><label class="label" for="name">Project name *</label><input id="name" class="field" formControlName="name" placeholder="Q4 Customer Feedback Analysis"></div>
        <div><label class="label" for="description">Description</label><textarea id="description" class="field min-h-28" formControlName="description" placeholder="What data is included and why does it matter?"></textarea></div>
        <div class="grid gap-5 sm:grid-cols-2">
          <div><label class="label" for="category">Category / industry</label><select id="category" class="field" formControlName="category"><option value="">Select category</option>@for (category of categories; track category) { <option [value]="category">{{ category }}</option> }</select></div>
          <div><label class="label" for="goal">Goal of analysis</label><input id="goal" class="field" formControlName="goal" placeholder="Understand churn risks"></div>
        </div>
        <div><p class="label">Optional source file</p><app-file-uploader (fileSelected)="selectedFile.set($event)" />@if (selectedFile()) { <p class="mt-2 text-sm font-medium text-brand-700">Selected: {{ selectedFile()?.name }}</p> }</div>
        <div class="flex justify-end gap-3 border-t border-slate-100 pt-5"><a routerLink="/app/projects" class="btn-secondary">Cancel</a><button type="submit" class="btn-primary" [disabled]="form.invalid || saving()">@if (saving()) { <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span> } Create project</button></div>
      </form>
    </div>
  `
})
export class ProjectCreateComponent {
  private readonly fb = inject(FormBuilder);
  private readonly projects = inject(ProjectService);
  private readonly files = inject(FileService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly saving = signal(false);
  readonly selectedFile = signal<File | null>(null);
  readonly categories = ['Customer Success', 'Sales', 'Marketing', 'Finance', 'Product', 'Operations', 'Research'];
  readonly form = this.fb.nonNullable.group({ name: ['', [Validators.required, Validators.minLength(2)]], description: [''], category: [''], goal: [''] });
  submit(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.projects.create(this.form.getRawValue()).subscribe({
      next: project => {
        const file = this.selectedFile();
        if (!file) {
          this.saving.set(false);
          this.toast.success('Project created.');
          void this.router.navigate(['/app/projects', project.id]);
          return;
        }
        this.files.upload(project.id, file).pipe(finalize(() => {
          this.saving.set(false);
          void this.router.navigate(['/app/projects', project.id]);
        })).subscribe({
          complete: () => this.toast.success('Project created and file uploaded.'),
          error: () => this.toast.error('Project was created, but the file upload failed.')
        });
      },
      error: () => this.saving.set(false)
    });
  }
}
