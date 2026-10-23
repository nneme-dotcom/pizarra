import { Component, computed, input, output } from '@angular/core';
import { PRODUCT_BY_ID, Product, STATUS_LABEL, Task, byDue, daysUntil, isLate, shortDate } from '../../model';

/** Hitos (entregas y tareas marcadas como hito) con su estado y el enlace que los demuestra. */
@Component({
  selector: 'app-milestones',
  template: `
    <div class="card h-100">
      <div class="card-body">
        <div class="d-flex align-items-baseline justify-content-between gap-2 mb-3">
          <h2 class="section-title">Hitos</h2>
          <span class="small text-body-secondary num">{{ done() }}/{{ items().length }} cumplidos</span>
        </div>
        @if (items().length === 0) {
          <p class="text-body-secondary mb-0">Marca una tarea como «Hito» para verla aquí.</p>
        } @else {
          <ol class="steps list-unstyled mb-0">
            @for (t of items(); track t.id) {
              <li class="step" [class]="'step ' + t.status" [class.late]="isLate(t)">
                <span class="node" aria-hidden="true"></span>
                <button type="button" class="step-body" (click)="open.emit(t)">
                  <span class="step-top">
                    <span class="prod-badge" [class.org]="t.product === 'ORG'">{{ products[t.product].short }}</span>
                    <span class="step-date num">{{ shortDate(t.due) }}</span>
                    <span class="step-state" [class.text-danger]="isLate(t)">{{ isLate(t) ? 'Atrasado' : statusLabel[t.status] }}</span>
                  </span>
                  <span class="step-title">{{ t.title }}</span>
                </button>
                @if (safe(t.link); as url) {
                  <a class="btn btn-ghost btn-sm btn-touch" [href]="url" target="_blank" rel="noopener" [attr.aria-label]="'Abrir enlace de ' + t.title">
                    <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i>
                  </a>
                }
              </li>
            }
          </ol>
        }
      </div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .steps { position: relative; display: grid; grid-template-columns: minmax(0, 1fr); gap: .35rem; }
    .step { position: relative; display: flex; align-items: center; gap: .5rem; padding-left: 1.6rem; }
    /* Línea vertical que une los hitos */
    .step::before { content: ''; position: absolute; left: .45rem; top: -.35rem; bottom: -.35rem; width: 2px; background: var(--eagles-line); }
    .step:first-child::before { top: 50%; }
    .step:last-child::before { bottom: 50%; }
    .node { position: absolute; left: .17rem; top: 50%; width: .75rem; height: .75rem; margin-top: -.375rem;
      transform: rotate(45deg); background: var(--eagles-bg); box-shadow: inset 0 0 0 2px var(--eagles-text-muted); }
    .step.doing .node { box-shadow: inset 0 0 0 2px var(--eagles-neon), 0 0 8px rgba(106,247,120,.6); }
    .step.done .node { background: var(--eagles-lime); box-shadow: 0 0 8px rgba(205,220,57,.5); }
    .step.done::before { background: rgba(205,220,57,.5); }
    .step.late .node { box-shadow: inset 0 0 0 2px var(--eagles-danger); }
    .step-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: .15rem; padding: .5rem .7rem; border: 0;
      border-radius: var(--eagles-radius); background: var(--eagles-surface-alt); color: var(--eagles-text); text-align: left;
      transition: background-color .15s; }
    .step-body:hover { background: var(--eagles-surface-hover); }
    .step-top { display: flex; align-items: center; gap: .6rem; font-size: .75rem; color: var(--eagles-text-muted); }
    .step-top .prod-badge { font-size: .8rem; }
    .step-date { font-family: var(--eagles-font-display); font-size: 1rem; letter-spacing: .04em; color: var(--eagles-lime); }
    .step-state { margin-left: auto; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; font-size: .68rem; }
    .step.done .step-state { color: var(--eagles-lime); }
    .step.doing .step-state { color: var(--eagles-neon); }
    .step-title { font-weight: 600; font-size: .86rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
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
  protected readonly daysUntil = daysUntil;

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
