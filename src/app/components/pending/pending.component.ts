import { Component, computed, input, output, signal } from '@angular/core';
import { PRODUCT_BY_ID, Product, STATUS_LABEL, Task, byDue, daysUntil, isLate, monthName } from '../../model';

/** Tareas abiertas ordenadas por fecha límite: lo que falta, de un vistazo. */
@Component({
  selector: 'app-pending',
  templateUrl: './pending.component.html',
  styleUrl: './pending.component.scss',
})
export class PendingComponent {
  readonly tasks = input.required<Task[]>();
  readonly filter = input<Product | 'all'>('all');
  readonly open = output<Task>();

  protected readonly expanded = signal(false);
  protected readonly products = PRODUCT_BY_ID;
  protected readonly statusLabel = STATUS_LABEL;
  protected readonly isLate = isLate;
  protected readonly limit = 6;

  protected readonly open_ = computed(() =>
    this.tasks()
      .filter((t) => t.status !== 'done' && (this.filter() === 'all' || t.product === this.filter()))
      .sort(byDue),
  );

  protected readonly visible = computed(() => (this.expanded() ? this.open_() : this.open_().slice(0, this.limit)));

  protected readonly hours = computed(() => this.open_().reduce((a, t) => a + t.estimate, 0));

  protected day(iso: string | null): string {
    return iso ? String(Number(iso.slice(8))) : '—';
  }
  protected month(iso: string | null): string {
    return iso ? monthName(iso) : '';
  }

  protected when(t: Task): string {
    if (!t.due) return 'Sin fecha';
    const d = daysUntil(t.due);
    if (d < 0) return `${-d} ${d === -1 ? 'día' : 'días'} tarde`;
    if (d === 0) return 'Hoy';
    if (d === 1) return 'Mañana';
    return `En ${d} días`;
  }
}
