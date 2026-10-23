import { AfterViewInit, Component, ElementRef, HostListener, OnInit, inject, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PRODUCTS, PRODUCT_BY_ID, Product, STATUSES, Status, Task, TaskData, emptyTask, isLate, shortDate } from '../../model';
import { Store } from '../../store';

export interface EditRequest {
  task: Task | null;
  status?: Status;
  product?: Product;
}

/**
 * Ventana de detalle/edición de una tarea.
 * Propietaria: formulario editable. Consultor: los mismos datos en solo lectura.
 */
@Component({
  selector: 'app-task-editor',
  imports: [FormsModule],
  templateUrl: './task-editor.component.html',
  styleUrl: './task-editor.component.scss',
})
export class TaskEditorComponent implements OnInit, AfterViewInit {
  protected readonly store = inject(Store);

  readonly request = input.required<EditRequest>();
  readonly closed = output<void>();

  protected readonly products = PRODUCTS;
  protected readonly productInfo = PRODUCT_BY_ID;
  protected readonly statuses = STATUSES;
  protected readonly shortDate = shortDate;
  protected readonly isLate = isLate;

  protected draft!: TaskData;
  protected readonly saving = signal(false);
  protected readonly confirmDelete = signal(false);
  protected readonly invalid = signal<string | null>(null);

  private readonly firstField = viewChild<ElementRef<HTMLElement>>('first');
  private readonly opener = document.activeElement as HTMLElement | null;

  ngOnInit(): void {
    const r = this.request();
    if (r.task) {
      const { id: _id, ...data } = r.task;
      this.draft = data;
    } else {
      this.draft = emptyTask(r.product ?? 'P1', r.status ?? 'todo');
    }
  }

  ngAfterViewInit(): void {
    this.firstField()?.nativeElement.focus();
  }

  protected get isNew(): boolean {
    return !this.request().task;
  }

  protected get readonly(): boolean {
    return !this.store.canEdit();
  }

  protected onProduct(): void {
    // Al crear, la fecha límite sugerida es la entrega del producto elegido
    if (this.isNew) this.draft.due = PRODUCT_BY_ID[this.draft.product].deadline ?? this.draft.due;
  }

  protected async save(): Promise<void> {
    const d = this.draft;
    if (!d.title.trim()) return this.invalid.set('Escribe un título.');
    if (d.start && d.due && d.start > d.due) return this.invalid.set('La fecha de inicio no puede ser posterior a la fecha límite.');
    this.invalid.set(null);
    this.saving.set(true);
    try {
      await this.store.save(this.request().task?.id ?? null, {
        ...d,
        estimate: Math.max(0, Number(d.estimate) || 0),
        spent: Math.max(0, Number(d.spent) || 0),
        start: d.start || null,
        due: d.due || null,
        link: d.link.trim(),
        rubric: d.rubric.trim(),
      });
      this.close();
    } catch {
      this.saving.set(false);
    }
  }

  protected async remove(): Promise<void> {
    const t = this.request().task;
    if (!t) return;
    if (!this.confirmDelete()) {
      this.confirmDelete.set(true);
      return;
    }
    await this.store.remove(t.id).catch(() => undefined);
    this.close();
  }

  @HostListener('document:keydown.escape')
  protected close(): void {
    this.closed.emit();
    this.opener?.focus?.();
  }

  protected safeLink(url: string): string | null {
    return /^https?:\/\//i.test(url) ? url : null;
  }
}
