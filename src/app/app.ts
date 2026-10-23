import { Component, computed, inject, signal } from '@angular/core';
import { Store } from './store';
import { PRODUCTS, Product, Status, Task, daysUntil, shortDate } from './model';
import { SummaryComponent } from './components/summary/summary.component';
import { TimelineComponent } from './components/timeline/timeline.component';
import { PendingComponent } from './components/pending/pending.component';
import { MilestonesComponent } from './components/milestones/milestones.component';
import { BoardComponent } from './components/board/board.component';
import { EditRequest, TaskEditorComponent } from './components/task-editor/task-editor.component';
import { ShareDialogComponent } from './components/share-dialog/share-dialog.component';

type View = 'roadmap' | 'board';

/** Preferencias de vista del navegador (si el almacenamiento falla, se usan los valores por defecto). */
function load<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key) as T | null;
    return v && allowed.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
}
function keep(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

@Component({
  selector: 'app-root',
  imports: [SummaryComponent, TimelineComponent, PendingComponent, MilestonesComponent, BoardComponent, TaskEditorComponent, ShareDialogComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly store = inject(Store);
  protected readonly products = PRODUCTS;

  protected readonly view = signal<View>(load('pizarra.view', ['roadmap', 'board'] as const, 'roadmap'));
  protected readonly filter = signal<Product | 'all'>(
    load('pizarra.filter', ['all', 'ORG', 'P1', 'P2', 'P3', 'P4'] as const, 'all'),
  );
  protected readonly editing = signal<EditRequest | null>(null);
  protected readonly sharing = signal(false);
  protected readonly seeding = signal(false);

  protected readonly nextDeadline = computed(() => {
    const p = PRODUCTS.find((x) => x.id !== 'ORG' && x.deadline && daysUntil(x.deadline) >= 0);
    return p ? { short: p.short, date: shortDate(p.deadline), days: daysUntil(p.deadline!) } : null;
  });

  protected setView(v: View): void {
    this.view.set(v);
    keep('pizarra.view', v);
  }

  protected setFilter(f: Product | 'all'): void {
    this.filter.set(f);
    keep('pizarra.filter', f);
  }

  protected openTask(task: Task): void {
    this.editing.set({ task });
  }

  protected newTask(status: Status = 'todo'): void {
    const f = this.filter();
    this.editing.set({ task: null, status, product: f === 'all' ? 'P1' : f });
  }

  protected async seed(): Promise<void> {
    this.seeding.set(true);
    await this.store.seed().catch(() => undefined);
    this.seeding.set(false);
  }
}
