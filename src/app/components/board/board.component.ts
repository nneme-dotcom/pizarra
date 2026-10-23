import { Component, computed, inject, input, output } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { PRODUCT_BY_ID, Product, STATUSES, Status, Task, isLate, shortDate } from '../../model';
import { Store } from '../../store';

/**
 * Tablero kanban de tres columnas. La propietaria arrastra las tarjetas entre columnas
 * (Angular CDK); el consultor ve el mismo tablero sin poder moverlas.
 */
@Component({
  selector: 'app-board',
  imports: [CdkDropListGroup, CdkDropList, CdkDrag],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
})
export class BoardComponent {
  protected readonly store = inject(Store);

  readonly tasks = input.required<Task[]>();
  readonly filter = input<Product | 'all'>('all');
  readonly open = output<Task>();
  readonly create = output<Status>();

  protected readonly statuses = STATUSES;
  protected readonly products = PRODUCT_BY_ID;
  protected readonly shortDate = shortDate;
  protected readonly isLate = isLate;

  protected readonly columns = computed(() => {
    const visible = this.tasks().filter((t) => this.filter() === 'all' || t.product === this.filter());
    return Object.fromEntries(
      STATUSES.map((s) => [s.id, visible.filter((t) => t.status === s.id).sort((a, b) => a.rank - b.rank)]),
    ) as Record<Status, Task[]>;
  });

  protected hours(list: Task[]): number {
    return list.reduce((a, t) => a + t.estimate, 0);
  }

  /** Coloca la tarjeta entre sus vecinas calculando un «rank» intermedio (no hace falta renumerar). */
  protected drop(e: CdkDragDrop<Status, Status, Task>): void {
    const task = e.item.data;
    const target = e.container.data;
    if (target === task.status && e.previousIndex === e.currentIndex) return;
    const list = this.columns()[target].filter((t) => t.id !== task.id);
    const prev = list[e.currentIndex - 1];
    const next = list[e.currentIndex];
    const rank = prev && next ? (prev.rank + next.rank) / 2 : prev ? prev.rank + 1000 : next ? next.rank - 1000 : Date.now();
    void this.store.move(task.id, target, rank).catch(() => undefined);
  }
}
