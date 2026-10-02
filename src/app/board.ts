import { Component, computed, inject, input, output } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { Store } from './store';
import { Avatar } from './avatar';
import { PRODUCT_BY_ID, STATUSES, Status, Task, daysUntil, shortDate } from './model';

@Component({
  selector: 'app-board',
  imports: [CdkDropListGroup, CdkDropList, CdkDrag, CdkDragPlaceholder, Avatar],
  template: `
    <div class="scroller">
      <div class="board" cdkDropListGroup>
        @for (col of cols(); track col.id) {
          <section class="col" [class.done]="col.id === 'done'">
            <header>
              <h2 class="eyebrow">{{ col.label }}</h2>
              <span class="count num">{{ col.items.length }}</span>
            </header>
            <div
              class="list"
              cdkDropList
              [cdkDropListData]="col.id"
              (cdkDropListDropped)="drop($event)"
              [attr.aria-label]="'Tareas: ' + col.label"
            >
              @for (t of col.items; track t.id) {
                <article
                  class="card"
                  cdkDrag
                  [cdkDragData]="t"
                  tabindex="0"
                  role="button"
                  [attr.aria-label]="t.title"
                  (click)="open.emit(t)"
                  (keydown.enter)="open.emit(t)"
                >
                  <h3>{{ t.title }}</h3>
                  <div class="meta">
                    <span>{{ product(t).short }}</span>
                    @if (t.due) {
                      <span class="num" [class.late]="isLate(t)">{{ dueLabel(t) }}</span>
                    }
                    @if (t.assignee) {
                      <app-avatar class="av" [id]="t.assignee" [size]="20" [attr.title]="store.displayName(t.assignee)" />
                    }
                  </div>
                  <div class="ph" *cdkDragPlaceholder></div>
                </article>
              }
            </div>
            <button class="add" type="button" (click)="add.emit(col.id)">+ Añadir</button>
          </section>
        }
      </div>
    </div>
  `,
  styles: `
    .scroller { overflow-x: auto; margin-inline: -32px; padding-inline: 32px; padding-bottom: 8px; }
    @media (max-width: 720px) { .scroller { margin-inline: -16px; padding-inline: 16px; } }
    .board { display: grid; grid-template-columns: repeat(4, minmax(230px, 1fr)); gap: 24px; align-items: start; }
    .col { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
    header { display: flex; align-items: center; gap: 8px; height: 20px; }
    h2 { margin: 0; }
    .count { font-size: 12px; color: var(--soft); }
    .list { display: flex; flex-direction: column; gap: 8px; min-height: 48px; }
    .card {
      background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-md);
      padding: 14px 16px; cursor: grab; display: flex; flex-direction: column; gap: 8px;
      transition: border-color 0.15s;
    }
    .card:hover { border-color: var(--ink); }
    .card:active { cursor: grabbing; }
    h3 { margin: 0; font-size: 14px; font-weight: 500; line-height: 1.45; overflow-wrap: anywhere; }
    .done h3 { color: var(--muted); font-weight: 400; }
    .done .card { border-color: var(--line-soft); }
    .meta { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--muted); min-width: 0; height: 20px; }
    .late { color: var(--danger); font-weight: 500; }
    .av { margin-left: auto; }
    .ph { min-height: 56px; border: 1px dashed var(--line); border-radius: var(--r-md); }
    .add { align-self: flex-start; border: 0; background: transparent; color: var(--soft); padding: 2px 0; font-size: 13px; transition: color 0.15s; }
    .add:hover { color: var(--ink); }
  `,
})
export class Board {
  readonly store = inject(Store);
  readonly tasks = input.required<Task[]>();
  readonly open = output<Task>();
  readonly add = output<Status>();

  readonly cols = computed(() =>
    STATUSES.map((s) => {
      const items = this.tasks()
        .filter((t) => t.status === s.id)
        .sort((a, b) => a.rank - b.rank || a.createdAt - b.createdAt);
      return { ...s, items };
    }),
  );

  product(t: Task) {
    return PRODUCT_BY_ID[t.product];
  }
  isLate(t: Task) {
    return !!t.due && t.status !== 'done' && daysUntil(t.due) < 0;
  }
  dueLabel(t: Task) {
    if (!t.due) return '';
    if (t.status === 'done') return shortDate(t.due);
    const d = daysUntil(t.due);
    if (d === 0) return 'hoy';
    if (d === 1) return 'mañana';
    if (d < 0) return `Atrasada`;
    return shortDate(t.due);
  }

  drop(e: CdkDragDrop<Status>) {
    const task = e.item.data as Task;
    const target = e.container.data;
    const col = this.cols()
      .find((c) => c.id === target)!
      .items.filter((t) => t.id !== task.id);
    const i = e.currentIndex;
    const before = col[i - 1];
    const after = col[i];
    const rank = before && after ? (before.rank + after.rank) / 2 : before ? before.rank + 1 : after ? after.rank - 1 : 1;
    this.store.move(task, target, rank);
  }
}
