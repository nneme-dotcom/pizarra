import { Component, computed, input } from '@angular/core';
import { PRODUCTS, PRODUCT_BY_ID, Product, Task, daysUntil, shortDate, stats } from '../../model';

/** Cuatro cifras clave en una sola franja. Respetan el filtro de producto. */
@Component({
  selector: 'app-summary',
  template: `
    <section class="stats" aria-label="Resumen">
      <div class="stat">
        <span class="eyebrow">Avance</span>
        <span class="value display num">{{ s().pct }}<small>%</small></span>
        <div class="eagles-progress" role="progressbar" [attr.aria-valuenow]="s().pct" aria-valuemin="0" aria-valuemax="100" aria-label="Avance">
          <span [style.width.%]="s().pct"></span>
        </div>
      </div>
      <div class="stat">
        <span class="eyebrow">Próxima entrega</span>
        @if (next(); as n) {
          <span class="value display num">{{ n.days }}<small>{{ n.days === 1 ? 'día' : 'días' }}</small></span>
          <span class="foot">{{ n.short }} · {{ shortDate(n.deadline) }}</span>
        } @else {
          <span class="value display">—</span>
        }
      </div>
      <div class="stat">
        <span class="eyebrow">Tareas</span>
        <span class="value display num">{{ s().done }}<small>/ {{ s().total }}</small></span>
        <span class="foot" [class.text-danger]="s().late > 0">
          {{ s().late ? s().late + (s().late === 1 ? ' atrasada' : ' atrasadas') : s().doing + ' en curso' }}
        </span>
      </div>
      <div class="stat">
        <span class="eyebrow">Horas</span>
        <span class="value display num">{{ h(s().spent) }}<small>/ {{ h(s().estimate) }}</small></span>
        <span class="foot">reales / estimadas</span>
      </div>
    </section>
  `,
  styles: `
    .stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .stat { display: flex; flex-direction: column; gap: .4rem; padding: 0 1.25rem; border-left: 1px solid var(--eagles-line); }
    .stat:first-child { padding-left: 0; border-left: 0; }
    .value { font-size: 2.4rem; color: var(--eagles-text); }
    .stat:first-child .value { color: var(--eagles-lime); }
    .value small { margin-left: .2rem; font-size: .45em; color: var(--eagles-text-muted); }
    .foot { font-size: .78rem; color: var(--eagles-text-muted); }
    .eagles-progress { max-width: 12rem; }
    @media (max-width: 767.98px) {
      .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 1.25rem; }
      .stat:nth-child(3) { padding-left: 0; border-left: 0; }
    }
  `,
})
export class SummaryComponent {
  readonly tasks = input.required<Task[]>();
  readonly filter = input<Product | 'all'>('all');

  protected readonly shortDate = shortDate;

  protected readonly s = computed(() =>
    stats(this.tasks().filter((t) => this.filter() === 'all' || t.product === this.filter())),
  );

  protected readonly next = computed(() => {
    const f = this.filter();
    const p =
      f !== 'all' && f !== 'ORG'
        ? PRODUCT_BY_ID[f]
        : PRODUCTS.find((x) => x.id !== 'ORG' && x.deadline && daysUntil(x.deadline) >= 0);
    return p?.deadline ? { ...p, days: daysUntil(p.deadline) } : null;
  });

  protected h(n: number): string {
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
  }
}
