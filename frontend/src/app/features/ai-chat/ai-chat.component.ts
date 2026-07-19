import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { debounceTime, finalize, Subject } from 'rxjs';
import { ChatMessage } from '../../core/models/chat.model';
import { Project } from '../../core/models/project.model';
import { ChatService } from '../../core/services/chat.service';
import { InsightService } from '../../core/services/insight.service';
import { ProjectService } from '../../core/services/project.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="flex min-h-[calc(100vh-8rem)] flex-col">
      <header class="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center"><div><p class="eyebrow">Project copilot</p><h1 class="page-title mt-2">Chat with your data</h1></div><select class="field max-w-sm" [value]="projectId()" (change)="choose($event)"><option value="">Select project</option>@for (project of projects(); track project.id) { <option [value]="project.id">{{ project.name }}</option> }</select></header>
      <div class="grid min-h-0 flex-1 gap-6 pt-6 xl:grid-cols-[1fr_280px]">
        <section class="panel flex min-h-[600px] flex-col overflow-hidden">
          <div class="flex-1 space-y-5 overflow-y-auto p-5 sm:p-7">
            @if (!messages().length) { <div class="mx-auto max-w-lg py-20 text-center"><span class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-xl font-bold text-brand-600">AI</span><h2 class="mt-5 text-xl font-semibold">What would you like to understand?</h2><p class="mt-2 text-sm leading-6 text-slate-500">Select a project and ask about trends, risks, segments, anomalies, or next actions.</p></div> }
            @for (message of messages(); track message.id) {
              <div class="flex" [class.justify-end]="message.role === 'user'"><div class="max-w-3xl rounded-2xl px-4 py-3 text-sm leading-7" [class]="message.role === 'user' ? 'bg-ink text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'"><p class="whitespace-pre-line">{{ message.content }}</p>@if (message.role === 'assistant') { <div class="mt-3 flex gap-4 border-t border-slate-200 pt-2 text-xs"><button (click)="copy(message.content)">Copy</button><button (click)="save(message)">Save insight</button></div> }</div></div>
            }
            @if (loading()) { <div class="flex"><div class="rounded-2xl bg-slate-100 px-5 py-4"><span class="inline-flex gap-1"><i class="h-2 w-2 animate-bounce rounded-full bg-slate-400"></i><i class="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:100ms]"></i><i class="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:200ms]"></i></span></div></div> }
          </div>
          <form class="border-t border-slate-200 p-4" (ngSubmit)="queueSend()"><div class="flex gap-3"><textarea class="field min-h-12 flex-1 resize-none" [(ngModel)]="question" name="question" rows="1" placeholder="Ask a question about this project..." (keydown.enter)="enter($event)"></textarea><button class="btn-primary self-end" type="submit" [disabled]="!projectId() || !question.trim() || loading()">Send ↑</button></div><p class="mt-2 text-xs text-slate-400">AI can make mistakes. Validate important decisions against source data.</p></form>
        </section>
        <aside class="panel h-fit p-5"><h2 class="font-semibold">Suggested prompts</h2><div class="mt-4 space-y-2">@for (prompt of prompts; track prompt) { <button class="w-full rounded-xl border border-slate-200 p-3 text-left text-xs leading-5 text-slate-600 hover:border-brand-300 hover:bg-brand-50" (click)="usePrompt(prompt)">{{ prompt }}</button> }</div></aside>
      </div>
    </div>
  `
})
export class AiChatComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly projectsService = inject(ProjectService);
  private readonly chat = inject(ChatService);
  private readonly insightService = inject(InsightService);
  private readonly toast = inject(ToastService);
  private readonly sendRequests = new Subject<void>();
  readonly projects = signal<Project[]>([]);
  readonly projectId = signal('');
  readonly messages = signal<ChatMessage[]>([]);
  readonly loading = signal(false);
  question = '';
  readonly prompts = ['Summarize this dataset.', 'What are the top trends?', 'Which customers are at risk?', 'What should I improve first?', 'Generate a report for my manager.', 'Find anomalies in this file.', 'Compare performance by month.'];
  constructor() { this.sendRequests.pipe(debounceTime(250)).subscribe(() => this.send()); }
  ngOnInit(): void { this.projectId.set(this.route.snapshot.queryParamMap.get('project') ?? ''); this.projectsService.list().subscribe(response => { this.projects.set(response.items); if (this.projectId()) this.load(); }); }
  choose(event: Event): void { this.projectId.set((event.target as HTMLSelectElement).value); this.load(); }
  load(): void { if (!this.projectId()) { this.messages.set([]); return; } this.chat.history(this.projectId()).subscribe(items => this.messages.set(items)); }
  queueSend(): void { if (!this.loading()) this.sendRequests.next(); }
  send(): void {
    const question = this.question.trim(); if (!question || !this.projectId() || this.loading()) return;
    this.loading.set(true); this.question = '';
    this.chat.send(this.projectId(), question).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: response => this.messages.update(items => [...items, response.user_message, response.assistant_message]),
      error: error => { this.question = question; if (error.status !== 429) this.toast.error(error.error?.detail ?? 'The AI request failed.'); }
    });
  }
  enter(event: Event): void { const keyboard = event as KeyboardEvent; if (!keyboard.shiftKey) { event.preventDefault(); this.queueSend(); } }
  usePrompt(prompt: string): void { this.question = prompt; }
  copy(content: string): void { void navigator.clipboard.writeText(content); this.toast.success('Response copied.'); }
  save(message: ChatMessage): void { this.insightService.save(this.projectId(), { type: 'saved_chat', title: 'Saved chat insight', content: message.content }).subscribe(() => this.toast.success('Insight saved.')); }
}
