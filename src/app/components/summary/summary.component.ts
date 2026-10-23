import { Component, computed, input, output } from '@angular/core';
import { PRODUCTS, Product, Task, daysUntil, shortDate, stats } from '../../model';

/** Cifras clave del proyecto y tarjeta de progreso por producto. */
@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss',
})
export class SummaryComponent {
  readonly tasks = input.required<Task[]>();
  readonly selected = input<Product | 'all'>('all');
  readonly pick = output<Product | 'all'>();

  protected readonly shortDate = shortDate;

  protected readonly total = computed(() => stats(this.tasks()));

  protected readonly next = computed(() => {
    const p = PRODUCTS.filter((x) => x.id !== 'ORG' && x.deadline && daysUntil(x.deadline) >= 0)[0];
    return p ? { ...p, days: daysUntil(p.deadline!) } : null;
  });

  protected readonly products = computed(() =>
    PRODUCTS.map((info) => {
      const s = stats(this.tasks().filter((t) => t.product === info.id));
      const days = info.deadline ? daysUntil(info.deadline) : null;
      let state: 'done' | 'active' | 'next' | 'late' = 'next';
      if (s.total && s.done === s.total) state = 'done';
      else if (days !== null && days < 0) state = 'late';
      else if (s.doing > 0 || s.done > 0) state = 'active';
      return { info, s, days, state };
    }),
  );

  protected readonly stateLabel = { done: 'Completado', active: 'En marcha', next: 'Pendiente', late: 'Fuera de plazo' };

  protected hours(n: number): string {
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
  }
}
