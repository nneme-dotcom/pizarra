import { Component, ElementRef, afterNextRender, computed, input, output, signal, viewChild } from '@angular/core';
import {
  PRODUCTS,
  Product,
  ProductInfo,
  STATUS_LABEL,
  Task,
  byDue,
  dayNum,
  isLate,
  isoFromDay,
  monthName,
  shortDate,
  stats,
  todayIso,
} from '../../model';

interface Group {
  info: ProductInfo;
  tasks: Task[];
  pct: number;
  span: { left: number; width: number } | null;
  deadline: number | null;
}

/**
 * Línea temporal del proyecto (diagrama de Gantt).
 * Cada tarea es una barra entre su inicio y su fecha límite; las entregas de cada producto
 * son líneas verticales y «hoy» es la línea neón. Las posiciones se calculan en % del rango
 * total de días, así el diagrama se adapta a cualquier ancho sin recalcular píxeles.
 */
@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss',
})
export class TimelineComponent {
  readonly tasks = input.required<Task[]>();
  readonly filter = input<Product | 'all'>('all');
  readonly open = output<Task>();

  protected readonly collapsed = signal<Set<Product>>(new Set());
  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');

  constructor() {
    // En pantallas estrechas el diagrama se abre desplazado hasta «hoy», no al principio del curso
    afterNextRender(() => {
      const el = this.scroller()?.nativeElement;
      const t = this.today();
      if (!el || t === null || el.scrollWidth <= el.clientWidth) return;
      const tl = el.firstElementChild as HTMLElement;
      const label = parseFloat(getComputedStyle(tl).getPropertyValue('--label')) || 0;
      const x = label + ((tl.offsetWidth - label) * t) / 100;
      el.scrollLeft = Math.max(0, x - label - 60);
    });
  }
  protected readonly statusLabel = STATUS_LABEL;
  protected readonly shortDate = shortDate;
  protected readonly isLate = isLate;

  /** Rango visible: de lunes a domingo, cubriendo todas las tareas y entregas. */
  private readonly range = computed(() => {
    const days: number[] = [dayNum('2026-09-21'), dayNum('2026-12-27')];
    for (const t of this.tasks()) {
      if (t.start) days.push(dayNum(t.start));
      if (t.due) days.push(dayNum(t.due));
    }
    const min = Math.min(...days);
    const max = Math.max(...days);
    // 1970-01-01 fue jueves: (n + 3) % 7 da 0 para los lunes
    const start = min - ((min + 3) % 7);
    // una semana extra al final para que quepan las etiquetas de la última entrega
    const end = max + (6 - ((max + 3) % 7)) + 7;
    return { start, total: end - start + 1 };
  });

  protected pct(day: number): number {
    const r = this.range();
    return ((day - r.start) / r.total) * 100;
  }

  protected readonly weeks = computed(() => {
    const r = this.range();
    const out: { left: number; label: string }[] = [];
    for (let d = r.start; d < r.start + r.total; d += 7) {
      out.push({ left: this.pct(d), label: String(Number(isoFromDay(d).slice(8))) });
    }
    return out;
  });

  protected readonly months = computed(() => {
    const r = this.range();
    const out: { left: number; width: number; label: string }[] = [];
    let d = r.start;
    const end = r.start + r.total;
    while (d < end) {
      const iso = isoFromDay(d);
      const [y, m] = iso.split('-').map(Number);
      const next = Math.min(dayNum(m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`), end);
      out.push({ left: this.pct(d), width: this.pct(next) - this.pct(d), label: `${monthName(iso)} ${y}` });
      d = next;
    }
    return out;
  });

  protected readonly today = computed(() => {
    const t = dayNum(todayIso());
    const r = this.range();
    return t >= r.start && t < r.start + r.total ? this.pct(t + 0.5) : null;
  });

  protected readonly deadlines = computed(() =>
    PRODUCTS.filter((p) => p.id !== 'ORG' && p.deadline && (this.filter() === 'all' || this.filter() === p.id)).map((p) => ({
      id: p.id,
      left: this.pct(dayNum(p.deadline!) + 0.5),
      label: shortDate(p.deadline),
    })),
  );

  protected readonly groups = computed<Group[]>(() => {
    const f = this.filter();
    return PRODUCTS.filter((p) => f === 'all' || p.id === f)
      .map((info) => {
        const tasks = this.tasks()
          .filter((t) => t.product === info.id)
          .sort((a, b) => (a.start ?? a.due ?? '').localeCompare(b.start ?? b.due ?? '') || byDue(a, b));
        const dated = tasks.filter((t) => t.start || t.due);
        let span: Group['span'] = null;
        if (dated.length) {
          const s = Math.min(...dated.map((t) => dayNum(t.start ?? t.due!)));
          const e = Math.max(...dated.map((t) => dayNum(t.due ?? t.start!))) + 1;
          span = { left: this.pct(s), width: this.pct(e) - this.pct(s) };
        }
        return {
          info,
          tasks,
          pct: stats(tasks).pct,
          span,
          deadline: info.deadline && info.id !== 'ORG' ? this.pct(dayNum(info.deadline) + 0.5) : null,
        };
      })
      .filter((g) => g.tasks.length > 0);
  });

  protected bar(t: Task): { left: number; width: number } | null {
    const s = t.start ?? t.due;
    const e = t.due ?? t.start;
    if (!s || !e) return null;
    const a = dayNum(s);
    const b = Math.max(dayNum(e), a) + 1;
    return { left: this.pct(a), width: Math.max(this.pct(b) - this.pct(a), 0.8) };
  }

  protected milestoneLeft(t: Task): number | null {
    return t.milestone && t.due ? this.pct(dayNum(t.due) + 0.5) : null;
  }

  protected toggle(p: Product): void {
    this.collapsed.update((s) => {
      const n = new Set(s);
      n.has(p) ? n.delete(p) : n.add(p);
      return n;
    });
  }

  protected barTitle(t: Task): string {
    const late = isLate(t) ? ' · ATRASADA' : '';
    return `${t.title}\n${shortDate(t.start)} → ${shortDate(t.due)} · ${t.estimate} h · ${STATUS_LABEL[t.status]}${late}`;
  }
}
