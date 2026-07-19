import { HttpEventType } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { DocumentAnalysis, ParsedFileData, UploadedDataFile } from '../../core/models/file.model';
import { Project } from '../../core/models/project.model';
import { FileService } from '../../core/services/file.service';
import { ProjectService } from '../../core/services/project.service';
import { ToastService } from '../../core/services/toast.service';
import { FileUploaderComponent } from '../../shared/components/file-uploader/file-uploader.component';
import { ProgressStepperComponent } from '../../shared/components/progress-stepper/progress-stepper.component';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [RouterLink, FileUploaderComponent, ProgressStepperComponent],
  template: `
    <header><p class="eyebrow">Data ingestion</p><h1 class="page-title mt-2">Upload data</h1><p class="mt-2 text-sm text-slate-500">Extract text and tables, run local NLP, create transformer embeddings, and prepare retrieval-ready data.</p></header>
    <div class="mt-7 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <section class="panel p-6">
        <label class="label" for="project">Choose project</label>
        <select id="project" class="field mb-6" [value]="projectId()" (change)="selectProject($event)">
          <option value="">Select a project</option>
          @for (project of projects(); track project.id) { <option [value]="project.id">{{ project.name }}</option> }
        </select>
        @if (!projects().length) {
          <p class="mb-5 text-sm text-amber-700">Create a project before uploading data. <a routerLink="/app/projects/new" class="font-semibold underline">Create project</a></p>
        }
        <app-file-uploader [disabled]="!projectId() || uploading()" (fileSelected)="upload($event)" />
        @if (uploading()) {
          <div class="mt-5">
            <div class="flex justify-between text-sm"><span>Uploading file...</span><span>{{ progress() }}%</span></div>
            <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div class="h-full bg-brand-500 transition-all" [style.width.%]="progress()"></div></div>
          </div>
        }
        @if (currentFile()) {
          <div class="mt-5 flex items-center gap-4 rounded-xl border border-slate-200 p-4">
            <span class="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-xs font-bold uppercase text-brand-700">{{ currentFile()?.file_type }}</span>
            <div class="min-w-0 flex-1"><p class="truncate text-sm font-semibold">{{ currentFile()?.original_name }}</p><p class="mt-1 text-xs capitalize text-slate-500">{{ currentFile()?.status }}</p></div>
            @if (currentFile()?.status !== 'parsed') { <button class="btn-secondary" (click)="checkStatus()">Refresh</button> }
          </div>
        }
      </section>
      <aside class="panel p-6">
        <h2 class="font-semibold">NLP processing pipeline</h2>
        <p class="mt-2 text-sm leading-6 text-slate-500">Processing runs locally. TensorFlow transformer embeddings are preferred, with a TF-IDF fallback if the model is unavailable.</p>
        <div class="mt-6"><app-progress-stepper [steps]="steps" [active]="activeStep()" /></div>
        @if (currentFile()?.status === 'failed') { <p class="mt-6 rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ currentFile()?.error_message }}</p> }
      </aside>
    </div>

    @if (analysis(); as nlp) {
      <section class="panel mt-6 p-6">
        <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div><p class="eyebrow">Document intelligence</p><h2 class="mt-2 text-lg font-semibold">Local NLP analysis complete</h2></div>
          <span class="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">{{ nlp.embedding_backend }} · {{ nlp.embedding_model }}</span>
        </div>
        <div class="mt-5 grid gap-4 sm:grid-cols-4">
          <div class="rounded-xl bg-slate-50 p-4"><p class="text-xs text-slate-500">Words</p><p class="mt-1 text-xl font-bold">{{ nlp.word_count }}</p></div>
          <div class="rounded-xl bg-slate-50 p-4"><p class="text-xs text-slate-500">RAG chunks</p><p class="mt-1 text-xl font-bold">{{ nlp.chunk_count }}</p></div>
          <div class="rounded-xl bg-slate-50 p-4"><p class="text-xs text-slate-500">Sentiment</p><p class="mt-1 text-xl font-bold capitalize">{{ nlp.sentiment.label }}</p></div>
          <div class="rounded-xl bg-slate-50 p-4"><p class="text-xs text-slate-500">Score</p><p class="mt-1 text-xl font-bold">{{ nlp.sentiment.score }}</p></div>
        </div>
        <p class="mt-5 text-sm leading-7 text-slate-600">{{ nlp.summary }}</p>
        <div class="mt-5 flex flex-wrap gap-2">
          @for (keyword of nlp.keywords.slice(0, 12); track keyword.term) {
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{{ keyword.term }} · {{ keyword.count }}</span>
          }
        </div>
      </section>
    }

    <section class="mt-6 rounded-2xl bg-ink p-6 text-white">
      <div class="grid gap-5 sm:grid-cols-3">
        <div><p class="text-xs text-slate-400">SUPPORTED</p><p class="mt-2 font-semibold">CSV · XLSX · PDF · TXT · JSON</p></div>
        <div><p class="text-xs text-slate-400">PROCESSING</p><p class="mt-2 font-semibold">TensorFlow + Transformers + NLP</p></div>
        <div><p class="text-xs text-slate-400">PRIVACY</p><p class="mt-2 font-semibold">Local by default, external AI optional</p></div>
      </div>
    </section>
  `
})
export class UploadComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly projectsService = inject(ProjectService);
  private readonly files = inject(FileService);
  private readonly toast = inject(ToastService);
  readonly projects = signal<Project[]>([]);
  readonly projectId = signal('');
  readonly uploading = signal(false);
  readonly progress = signal(0);
  readonly currentFile = signal<UploadedDataFile | null>(null);
  readonly analysis = signal<DocumentAnalysis | null>(null);
  readonly steps = ['File uploaded', 'Text and tables extracted', 'Entities and keywords detected', 'Transformer embeddings generated', 'RAG index prepared', 'Charts and insights ready'];
  readonly activeStep = signal(0);

  ngOnInit(): void {
    this.projectId.set(this.route.snapshot.queryParamMap.get('project') ?? '');
    this.projectsService.list().subscribe(response => this.projects.set(response.items));
  }

  selectProject(event: Event): void {
    this.projectId.set((event.target as HTMLSelectElement).value);
    this.currentFile.set(null);
    this.analysis.set(null);
    this.activeStep.set(0);
  }

  upload(file: File): void {
    if (!this.projectId() || this.uploading()) return;
    const allowed = ['csv', 'xlsx', 'pdf', 'txt', 'json'];
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!allowed.includes(extension) || file.size > 10 * 1024 * 1024) {
      this.toast.error('Choose a supported file no larger than 10MB.');
      return;
    }
    this.uploading.set(true);
    this.progress.set(0);
    this.files.upload(this.projectId(), file).pipe(finalize(() => this.uploading.set(false))).subscribe({
      next: event => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.progress.set(Math.round(100 * event.loaded / event.total));
        }
        if (event.type === HttpEventType.Response && event.body) {
          this.setFile(event.body);
          this.activeStep.set(1);
          this.toast.success('Upload complete. Local NLP processing has started.');
        }
      },
      error: error => this.toast.error(error.error?.detail ?? 'Upload failed.')
    });
  }

  checkStatus(): void {
    const file = this.currentFile();
    if (!file) return;
    this.files.get(file.id).subscribe(updated => {
      this.setFile(updated);
      this.activeStep.set(updated.status === 'parsed' ? 5 : updated.status === 'processing' ? 2 : 1);
    });
  }

  private setFile(file: UploadedDataFile): void {
    this.currentFile.set(file);
    const parsed = file.parsed_data;
    this.analysis.set(parsed && !Array.isArray(parsed) ? (parsed as ParsedFileData).document_analysis ?? null : null);
  }
}
