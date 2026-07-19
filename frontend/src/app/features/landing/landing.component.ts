import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen overflow-hidden bg-white text-slate-950">
      <header class="mx-auto flex h-20 max-w-7xl items-center justify-between px-5">
        <a routerLink="/" class="flex items-center gap-3 font-bold">
          <span class="grid h-10 w-10 place-items-center rounded-xl bg-ink text-sm text-brand-400">IF</span>
          <span class="text-lg">InsightFlow</span>
        </a>
        <nav class="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <a href="#features">Features</a><a href="#how">How it works</a><a href="#pricing">Pricing</a>
        </nav>
        <div class="flex items-center gap-3">
          <a routerLink="/login" class="hidden text-sm font-semibold sm:block">Sign in</a>
          <a routerLink="/register" class="btn-primary">Start free</a>
        </div>
      </header>

      <main>
        <section class="relative mx-auto max-w-7xl px-5 pb-24 pt-20 text-center lg:pt-28">
          <div class="absolute left-1/2 top-10 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-100/70 blur-3xl"></div>
          <p class="eyebrow">Your data finally speaks business</p>
          <h1 class="mx-auto mt-6 max-w-5xl text-5xl font-extrabold leading-[1.05] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
            Turn Raw Data Into <span class="text-brand-600">Actionable Insights</span> Instantly
          </h1>
          <p class="mx-auto mt-7 max-w-3xl text-lg leading-8 text-slate-600">
            Upload spreadsheets, reports, or feedback files and let InsightFlow generate summaries, dashboards, trends, and AI-powered recommendations.
          </p>
          <div class="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <a routerLink="/register" class="btn-primary px-6 py-3.5">Get Started →</a>
            <a href="#demo" class="btn-secondary px-6 py-3.5">View Demo</a>
          </div>
          <div id="demo" class="mx-auto mt-16 max-w-6xl rounded-[2rem] border border-slate-200 bg-slate-100 p-2 shadow-2xl shadow-slate-300/60">
            <div class="overflow-hidden rounded-[1.5rem] bg-ink p-4 text-left sm:p-6">
              <div class="grid gap-4 md:grid-cols-[180px_1fr]">
                <div class="hidden rounded-xl bg-white/5 p-4 text-xs text-slate-400 md:block">
                  <p class="font-bold text-white">InsightFlow</p>
                  @for (item of ['Home','Projects','Insights','Dashboards','AI Chat','Reports']; track item) {
                    <p class="mt-5">{{ item }}</p>
                  }
                </div>
                <div class="rounded-xl bg-slate-50 p-5">
                  <div class="flex items-center justify-between"><div><p class="text-xs text-slate-500">Q4 analysis</p><h2 class="mt-1 font-bold">Customer intelligence</h2></div><span class="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700">Analysis complete</span></div>
                  <div class="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    @for (metric of metrics; track metric.label) {
                      <div class="rounded-xl bg-white p-4 shadow-sm"><p class="text-xs text-slate-500">{{ metric.label }}</p><p class="mt-2 text-xl font-bold">{{ metric.value }}</p></div>
                    }
                  </div>
                  <div class="mt-3 grid gap-3 lg:grid-cols-3">
                    <div class="rounded-xl bg-white p-4 lg:col-span-2"><p class="text-xs font-semibold">Sentiment trend</p><div class="mt-6 flex h-28 items-end gap-2">@for (bar of bars; track $index) { <span class="flex-1 rounded-t bg-brand-400" [style.height.%]="bar"></span> }</div></div>
                    <div class="rounded-xl bg-white p-4"><p class="text-xs font-semibold">AI recommendation</p><p class="mt-4 text-sm leading-6 text-slate-600">Prioritize accounts mentioning slow response times. They show the strongest churn-risk signal.</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" class="bg-slate-50 py-24">
          <div class="mx-auto max-w-7xl px-5">
            <p class="eyebrow text-center">One intelligent workspace</p>
            <h2 class="mx-auto mt-4 max-w-2xl text-center text-4xl font-bold tracking-tight">From upload to decision in minutes</h2>
            <div class="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              @for (feature of features; track feature.title) {
                <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
                  <span class="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-lg font-bold text-brand-600">{{ feature.icon }}</span>
                  <h3 class="mt-5 text-lg font-semibold">{{ feature.title }}</h3>
                  <p class="mt-2 text-sm leading-6 text-slate-600">{{ feature.description }}</p>
                </article>
              }
            </div>
          </div>
        </section>

        <section id="how" class="mx-auto max-w-7xl px-5 py-24">
          <p class="eyebrow">Simple by design</p><h2 class="mt-4 text-4xl font-bold">Four steps from data to action</h2>
          <div class="mt-12 grid gap-8 md:grid-cols-4">
            @for (step of steps; track step.title; let index = $index) {
              <div><span class="text-4xl font-extrabold text-brand-100">0{{ index + 1 }}</span><h3 class="mt-4 font-semibold">{{ step.title }}</h3><p class="mt-2 text-sm leading-6 text-slate-600">{{ step.text }}</p></div>
            }
          </div>
        </section>

        <section class="bg-ink py-24 text-white">
          <div class="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-2">
            <div><p class="eyebrow text-brand-400">Built for every team</p><h2 class="mt-4 text-4xl font-bold">Answers for the questions that move your business</h2></div>
            <div class="grid grid-cols-2 gap-4">
              @for (useCase of useCases; track useCase) { <div class="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">✓ {{ useCase }}</div> }
            </div>
          </div>
        </section>

        <section id="pricing" class="mx-auto max-w-7xl px-5 py-24 text-center">
          <p class="eyebrow">Transparent pricing</p><h2 class="mt-4 text-4xl font-bold">Start free. Scale when insights compound.</h2>
          <div class="mt-12 grid gap-5 text-left md:grid-cols-3">
            @for (plan of plans; track plan.name) {
              <div class="rounded-2xl border p-7" [class]="plan.name === 'Pro' ? 'border-brand-500 shadow-soft' : 'border-slate-200'">
                <p class="font-semibold">{{ plan.name }}</p><p class="mt-4 text-4xl font-bold">{{ plan.price }}</p><p class="mt-2 text-sm text-slate-500">{{ plan.detail }}</p>
                <a routerLink="/register" class="mt-7 block text-center" [class]="plan.name === 'Pro' ? 'btn-primary' : 'btn-secondary'">Choose {{ plan.name }}</a>
              </div>
            }
          </div>
        </section>
      </main>
      <footer class="border-t border-slate-200 py-10"><div class="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-5 text-sm text-slate-500 sm:flex-row"><span>© 2026 InsightFlow</span><span>Privacy · Terms · Security</span></div></footer>
    </div>
  `
})
export class LandingComponent {
  readonly metrics = [{ label: 'Responses', value: '1,842' }, { label: 'Sentiment', value: '72%' }, { label: 'At risk', value: '18' }, { label: 'Growth', value: '+14.2%' }];
  readonly bars = [32, 48, 43, 62, 58, 75, 86, 78, 92];
  readonly features = [
    { icon: 'AI', title: 'AI Data Analysis', description: 'Parse structured and unstructured data into concise, evidence-based findings.' },
    { icon: '▥', title: 'Auto Dashboard Generation', description: 'Turn raw columns into useful KPI cards and visual dashboard plans.' },
    { icon: 'Q', title: 'Natural Language Data Chat', description: 'Ask plain-language questions and keep every answer in project context.' },
    { icon: '↗', title: 'Smart Recommendations', description: 'Receive prioritized actions tied directly to trends in your data.' },
    { icon: '!', title: 'Trend & Anomaly Detection', description: 'Surface unusual records, changing patterns, and emerging business risks.' },
    { icon: '↓', title: 'Exportable Reports', description: 'Package summaries, findings, risks, and next steps for stakeholders.' }
  ];
  readonly steps = [
    { title: 'Upload your data', text: 'Add CSV, Excel, PDF, TXT, or JSON files securely.' },
    { title: 'Let AI analyze it', text: 'InsightFlow extracts structure, context, and useful signals.' },
    { title: 'Explore dashboards', text: 'Review metrics, trends, anomalies, and recommendations.' },
    { title: 'Take action', text: 'Share reports and investigate the next best questions.' }
  ];
  readonly useCases = ['Product research', 'Sales analytics', 'Marketing reports', 'Customer feedback', 'Financial summaries', 'Operations reviews'];
  readonly plans = [
    { name: 'Free', price: '$0', detail: '10 AI requests per day for individual exploration.' },
    { name: 'Pro', price: '$39', detail: '200 AI requests per day for growing teams.' },
    { name: 'Business', price: 'Custom', detail: '2,000 daily requests, governance, and support.' }
  ];
}
