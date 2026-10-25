import { Component, computed, input, output } from '@angular/core';
import { PRODUCT_BY_ID, Product, STATUS_LABEL, Task, byDue, isLate, shortDate } from '../../model';

/** Hitos (entregas y tareas marcadas como hito) con su estado y el enlace que los demuestra. */
@Component({
  selector: 'app-milestones',
  template: `
    <section aria-labelledby="ms-title">
      <div class="head">
        <h2 id="ms-title" class="section-title">Hitos</h2>
        <span class="count num">{{ done() }}/{{ items().length }}</span>
      </div>
      @if (items().length === 0) {
        <p class="text-body-secondary small mb-0">Marca una tarea como «Hito» para verla aquí.</p>
      } @else {
        <ol class="list list-unstyled mb-0">
          @for (t of items(); track t.id) {
            <li>
              <button type="button" class="item" (click)="open.emit(t)">
                <span class="diamond" [class.done]="t.status === 'done'" [class.late]="isLate(t)" aria-hidden="true"></span>
                <span class="date num" [class.text-danger]="isLate(t)">{{ shortDate(t.due) }}</span>
                <span class="title">{{ t.title }}</span>
                <span class="state" [class.text-danger]="isLate(t)">{{ isLate(t) ? 'Atrasado' : statusLabel[t.status] }}</span>
              </button>
              @if (safe(t.link); as url) {
                <a class="link" [href]="url" target="_blank" rel="noopener" [attr.aria-label]="'Abrir enlace de ' + t.title">
                  <i class="bi bi-arrow-up-right" aria-hidden="true"></i>
                </a>
              }
            </li>
          }
        </ol>
      }
    </section>
  `,
  styles: `
    :host { display: block; }
    .head { display: flex; align-items: baseline; justify-content: space-between; gap: .5rem; margin-bottom: .75rem; }
    .count { font-size: .78rem; color: var(--eagles-text-muted); }
    .list { border-top: 1px solid var(--eagles-line); }
    li { display: flex; align-items: center; border-bottom: 1px solid var(--eagles-line); }
    .item { flex: 1; min-width: 0; display: flex; align-items: center; gap: .75rem; min-height: var(--eagles-touch);
      padding: 0 .25rem; border: 0; background: none; color: var(--eagles-text); font-size: .875rem; text-align: left; }
    .item:hover { background: var(--eagles-surface); }
    .diamond { flex-shrink: 0; width: 8px; height: 8px; transform: rotate(45deg); box-shadow: inset 0 0 0 1.5px var(--eagles-text-muted); }
    .diamond.done { background: var(--eagles-lime); box-shadow: none; }
    .diamond.late { box-shadow: inset 0 0 0 1.5px var(--eagles-danger); }
    .date { flex: 0 0 3.6rem; font-size: .78rem; color: var(--eagles-text-muted); }
    .title { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .state { flex-shrink: 0; font-size: .75rem; color: var(--eagles-text-muted); }
    .link { display: inline-flex; align-items: center; justify-content: center; width: var(--eagles-touch); height: var(--eagles-touch);
      color: var(--eagles-text-muted); }
    .link:hover { color: var(--eagles-lime); }
  `,
})
export class MilestonesComponent {
  readonly tasks = input.required<Task[]>();
  readonly filter = input<Product | 'all'>('all');
  readonly open = output<Task>();

  protected readonly products = PRODUCT_BY_ID;
  protected readonly statusLabel = STATUS_LABEL;
  protected readonly shortDate = shortDate;
  protected readonly isLate = isLate;

  protected readonly items = computed(() =>
    this.tasks()
      .filter((t) => t.milestone && (this.filter() === 'all' || t.product === this.filter()))
      .sort(byDue),
  );
  protected readonly done = computed(() => this.items().filter((t) => t.status === 'done').length);

  protected safe(url: string): string | null {
    return /^https?:\/\//i.test(url) ? url : null;
  }
}
