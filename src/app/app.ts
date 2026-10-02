import { Component, computed, inject, signal } from '@angular/core';
import { Store } from './store';
import { Board } from './board';
import { Progress } from './progress';
import { Editor } from './editor';
import { Avatar } from './avatar';
import { Gantt } from './gantt';
import { PLAN } from './plan';
import { PRODUCTS, Product, Status, Task, daysUntil, shortDate } from './model';

type View = 'tablero' | 'cronograma' | 'progreso';
type Who = 'all' | 'me' | 'none' | string;

function load(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
function keep(key: string, v: string) {
  try {
    localStorage.setItem(key, v);
  } catch {}
}

@Component({
  selector: 'app-root',
  imports: [Board, Progress, Editor, Avatar, Gantt],
  template: `
    @switch (store.session()) {
      @case ('loading') {
        <p class="center muted">Cargando…</p>
      }
      @case ('out') {
        <div class="center gate">
          <h1>Pizarra</h1>
          <p class="muted">Tareas del equipo EQUIPO BASKET · FP.451</p>
          <button class="btn primary" type="button" (click)="store.signIn()">Entrar con Google</button>
          @if (store.error(); as e) { <p class="err">{{ e }}</p> }
        </div>
      }
      @case ('denied') {
        <div class="center gate">
          <h1>Sin acceso</h1>
          <p class="muted">La cuenta {{ store.user()?.email }} no está en la lista del equipo.<br />Pide que añadan tu correo en <code>firestore.rules</code>.</p>
          <button class="btn" type="button" (click)="store.signOut()">Usar otra cuenta</button>
        </div>
      }
      @case ('in') {
    <div class="wrap">
      <header class="top">
        <div class="brand">
          <h1>Pizarra</h1>
          @if (nextDeadline(); as n) {
            <p class="next num">{{ n.short }} · {{ n.date }} · {{ n.days }} {{ n.days === 1 ? 'día' : 'días' }}</p>
          }
        </div>
        <div class="right">
          <button class="btn primary" type="button" (click)="openNew('todo')">Nueva tarea</button>
          <button class="me" type="button" (click)="store.signOut()" [title]="'Cerrar sesión (' + store.user()?.email + ')'">
            <app-avatar [id]="store.me()" [size]="32" />
            <span class="sr">Cerrar sesión</span>
          </button>
        </div>
      </header>

      @if (store.error(); as e) {
        <p class="note err" role="alert">{{ e }}</p>
      }

      <nav class="bar">
        <div class="tabs" role="tablist">
          <button role="tab" type="button" [class.on]="view() === 'tablero'" [attr.aria-selected]="view() === 'tablero'" (click)="setView('tablero')">Tablero</button>
          <button role="tab" type="button" [class.on]="view() === 'cronograma'" [attr.aria-selected]="view() === 'cronograma'" (click)="setView('cronograma')">Cronograma</button>
          <button role="tab" type="button" [class.on]="view() === 'progreso'" [attr.aria-selected]="view() === 'progreso'" (click)="setView('progreso')">Progreso</button>
        </div>
        <div class="filters">
          <div class="seg" role="group" aria-label="Filtrar por producto">
            <button type="button" [class.on]="product() === 'all'" (click)="setProduct('all')">Todo</button>
            @for (p of products; track p.id) {
              <button type="button" [class.on]="product() === p.id" (click)="setProduct(p.id)">{{ p.short }}</button>
            }
          </div>
          <label class="who">
            <span class="sr">Filtrar por persona</span>
            <select id="filter-who" [value]="who()" (change)="setWho($any($event.target).value)">
              <option value="all">Todo el equipo</option>
              @if (store.me()) { <option value="me">Mis tareas</option> }
              <option value="none">Sin asignar</option>
              @for (id of store.memberIds(); track id) {
                @if (id !== store.me()) { <option [value]="id">{{ store.displayName(id) }}</option> }
              }
            </select>
          </label>
        </div>
      </nav>

      <main>
        @if (!store.loaded()) {
          <p class="empty">Cargando…</p>
        } @else {
          @if (!store.tasks().length) {
            <div class="seed">
              <div>
                <p class="seed-title">La pizarra está vacía</p>
                <p class="muted">Carga el plan del proyecto: {{ planSize }} tareas de los enunciados y el calendario del aula, con fechas y estimaciones que luego puedes editar.</p>
              </div>
              <button class="btn primary" type="button" [disabled]="importing()" (click)="importPlan()">{{ importing() ? 'Cargando…' : 'Cargar plan del proyecto' }}</button>
            </div>
          }
          @if (view() === 'tablero') {
            <app-board [tasks]="filtered()" (open)="openTask($event)" (add)="openNew($event)" />
          } @else if (view() === 'cronograma') {
            <app-gantt [tasks]="filtered()" (open)="openTask($event)" />
          } @else {
            <app-progress [tasks]="filtered()" />
          }
        }
      </main>
    </div>

    @if (editing(); as e) {
      <app-editor [task]="e.task" [status]="e.status" (close)="editing.set(null)" />
    }
      }
    }
  `,
  styles: `
    .wrap { max-width: 1240px; margin: 0 auto; padding: 40px 32px 64px; display: flex; flex-direction: column; gap: 32px; }
    .top { display: flex; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
    .brand { display: flex; flex-direction: column; gap: 6px; }
    h1 { margin: 0; font-size: 32px; font-weight: 600; line-height: 1.1; letter-spacing: -0.02em; }
    .next { margin: 0; font-size: 13px; color: var(--muted); }
    .right { margin-left: auto; display: flex; align-items: center; gap: 8px; }
    .note { margin: -16px 0 0; font-size: 13px; }
    .err { color: var(--danger); font-size: 13px; margin: 0; }
    .muted { color: var(--muted); }
    .center { min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 24px 16px; margin: 0; }
    .gate { gap: 12px; }
    .gate p { margin: 0 0 12px; line-height: 1.6; }
    .gate code { font-size: 12px; background: var(--fill); padding: 1px 5px; border-radius: var(--r-sm); }
    .me { border: 0; background: transparent; padding: 0; border-radius: 50%; display: inline-flex; }
    .me:hover { opacity: 0.8; }
    .bar { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; border-bottom: 1px solid var(--line); }
    .tabs { display: flex; gap: 24px; align-self: stretch; }
    .tabs button { border: 0; background: transparent; padding: 0 0 12px; font-weight: 500; color: var(--muted); border-bottom: 1px solid transparent; margin-bottom: -1px; transition: color 0.15s; }
    .tabs button:hover { color: var(--ink); }
    .tabs button.on { color: var(--ink); border-bottom-color: var(--ink); }
    .filters { margin-left: auto; display: flex; gap: 16px; flex-wrap: wrap; align-items: center; padding-bottom: 10px; }
    .seg { display: flex; gap: 14px; }
    .seg button { border: 0; background: transparent; padding: 0; font-size: 13px; font-weight: 500; color: var(--soft); transition: color 0.15s; }
    .seg button:hover { color: var(--ink); }
    .seg button.on { color: var(--ink); }
    .who select { border: 0; background: transparent; padding: 0; font-size: 13px; font-weight: 500; color: var(--ink); cursor: pointer; max-width: 170px; }
    .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    .seed { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; justify-content: space-between; padding: 24px; border: 1px solid var(--line); border-radius: var(--r-md); margin-bottom: 32px; }
    .seed p { margin: 0; max-width: 60ch; }
    .seed-title { font-size: 16px; font-weight: 600; margin-bottom: 4px !important; }
    .empty { color: var(--muted); padding: 64px 0; text-align: center; margin: 0; }
    @media (max-width: 720px) {
      .wrap { padding: 24px 16px 48px; gap: 24px; }
      h1 { font-size: 26px; }
      .filters { order: -1; margin-left: 0; width: 100%; padding-bottom: 4px; }
    }
  `,
})
export class App {
  readonly store = inject(Store);
  readonly products = PRODUCTS;
  readonly planSize = PLAN.length;
  readonly importing = signal(false);
  readonly view = signal<View>(
    (['tablero', 'cronograma', 'progreso'] as View[]).find((v) => location.hash === '#' + v) ?? (load('pz.view', 'tablero') as View),
  );
  readonly product = signal<Product | 'all'>(load('pz.product', 'all') as Product | 'all');
  readonly who = signal<Who>(load('pz.who', 'all'));
  readonly editing = signal<{ task: Task | null; status: Status } | null>(null);

  readonly filtered = computed(() => {
    const p = this.product();
    const w = this.who();
    const me = this.store.me();
    return this.store.tasks().filter((t) => {
      if (p !== 'all' && t.product !== p) return false;
      if (w === 'me') return t.assignee === me;
      if (w === 'none') return !t.assignee;
      if (w !== 'all') return t.assignee === w;
      return true;
    });
  });

  readonly nextDeadline = computed(() => {
    const up = PRODUCTS.filter((p) => p.deadline && daysUntil(p.deadline) >= 0);
    if (!up.length) return null;
    const p = up[0];
    return { short: p.short, days: daysUntil(p.deadline!), date: shortDate(p.deadline!) };
  });

  async importPlan() {
    this.importing.set(true);
    await this.store.importPlan();
    this.importing.set(false);
  }

  setView(v: View) {
    this.view.set(v);
    keep('pz.view', v);
  }
  setProduct(p: Product | 'all') {
    this.product.set(p);
    keep('pz.product', p);
  }
  setWho(w: Who) {
    this.who.set(w);
    keep('pz.who', w);
  }
  openTask(t: Task) {
    this.editing.set({ task: t, status: t.status });
  }
  openNew(s: Status) {
    this.editing.set({ task: null, status: s });
  }
}
