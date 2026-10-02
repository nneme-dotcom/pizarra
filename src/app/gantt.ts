import { Component, computed, inject, input, output } from '@angular/core';
import { Store } from './store';
import { Avatar } from './avatar';
import { PRODUCTS, Task, dayNum, isoFromDay, shortDate, todayIso } from './model';

const DAY = 8; // px por día
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

interface Row {
  task: Task;
  left: number;
  width: number;
  kind: 'bar' | 'milestone' | 'none';
  state: 'todo' | 'active' | 'done' | 'late';
}

/** Cronograma (Gantt): una fila por tarea, agrupadas por producto, sobre una escala de días. */
@Component({
  selector: 'app-gantt',
  imports: [Avatar],
  template: `
    <div class="legend">
      <span><i class="sw todo"></i>Por hacer</span>
      <span><i class="sw active"></i>En curso</span>
      <span><i class="sw done"></i>Hecho</span>
      <span><i class="sw late"></i>Atrasada</span>
    </div>

    <div class="scroller">
      <div class="chart" [style.--w.px]="scale().width">
        <!-- cabecera: meses y semanas -->
        <div class="head">
          <div class="name-col eyebrow">Tarea</div>
          <div class="track">
            @for (m of scale().months; track m.left) {
              <span class="month" [style.left.px]="m.left">{{ m.label }}</span>
            }
            @for (w of scale().weeks; track w.left) {
              <span class="week num" [style.left.px]="w.left">{{ w.label }}</span>
            }
          </div>
        </div>

        <div class="body">
          <!-- capa de fondo: semanas, entregas y hoy -->
          <div class="overlay" aria-hidden="true">
            @for (w of scale().weeks; track w.left) {
              <i class="gl" [style.left.px]="w.left"></i>
            }
            @for (d of scale().deadlines; track d.label) {
              <i class="dl" [style.left.px]="d.left"><b>{{ d.label }}</b></i>
            }
            @if (scale().today !== null) {
              <i class="today" [style.left.px]="scale().today"><b>Hoy</b></i>
            }
          </div>

          @for (g of groups(); track g.id) {
            <div class="group">
              <div class="name-col"><span class="eyebrow">{{ g.label }}</span></div>
              <div class="track"></div>
            </div>
            @for (r of g.rows; track r.task.id) {
              <div class="row" [class.is-done]="r.task.status === 'done'">
                <button class="name-col name" type="button" (click)="open.emit(r.task)" [title]="r.task.title">
                  <span class="t">{{ r.task.title }}</span>
                  @if (r.task.assignee) { <app-avatar [id]="r.task.assignee" [size]="18" /> }
                </button>
                <div class="track">
                  @if (r.kind === 'bar') {
                    <button
                      type="button"
                      [class]="'bar ' + r.state"
                      [style.left.px]="r.left"
                      [style.width.px]="r.width"
                      [title]="tip(r.task)"
                      (click)="open.emit(r.task)"
                    ></button>
                  } @else if (r.kind === 'milestone') {
                    <button
                      type="button"
                      [class]="'ms ' + r.state"
                      [style.left.px]="r.left"
                      [title]="tip(r.task)"
                      (click)="open.emit(r.task)"
                    ></button>
                  } @else {
                    <span class="nodate">Sin fechas</span>
                  }
                </div>
              </div>
            }
          } @empty {
            <p class="empty">No hay tareas con este filtro.</p>
          }
        </div>
      </div>
    </div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: 16px; --name: 280px; }
    @media (max-width: 720px) { :host { --name: 150px; } }
    .legend { display: flex; gap: 16px; flex-wrap: wrap; font-size: 12px; color: var(--muted); justify-content: flex-end; }
    .legend span { display: inline-flex; align-items: center; gap: 6px; }
    .sw { width: 14px; height: 6px; border-radius: 2px; display: inline-block; }
    .scroller { overflow-x: auto; margin-inline: -32px; padding-inline: 32px; }
    @media (max-width: 720px) { .scroller { margin-inline: -16px; padding-inline: 16px; } }
    .chart { width: calc(var(--name) + var(--w)); min-width: 100%; }

    .head, .row, .group { display: grid; grid-template-columns: var(--name) var(--w); }
    .name-col { position: sticky; left: 0; z-index: 2; background: var(--bg); padding-right: 16px; min-width: 0; }
    .track { position: relative; }

    .head { height: 44px; border-bottom: 1px solid var(--line); }
    .head .name-col { display: flex; align-items: flex-end; padding-bottom: 8px; }
    .month { position: absolute; top: 2px; font-size: 12px; font-weight: 500; white-space: nowrap; padding-left: 4px; }
    .week { position: absolute; bottom: 8px; font-size: 11px; color: var(--soft); padding-left: 4px; }

    .body { position: relative; }
    .overlay { position: absolute; top: 0; bottom: 0; left: var(--name); width: var(--w); pointer-events: none; z-index: 0; }
    .overlay i { position: absolute; top: 0; bottom: 0; width: 0; }
    .gl { border-left: 1px solid var(--line-soft); }
    .dl { border-left: 1px dashed var(--muted); }
    .today { border-left: 1px solid var(--danger); }
    .overlay b { position: absolute; top: 12px; left: 4px; font-size: 11px; font-weight: 600; line-height: 1; white-space: nowrap; }
    .today b { color: var(--danger); }

    .group { height: 40px; align-items: end; }
    .group .name-col { padding-bottom: 8px; white-space: nowrap; overflow: visible; background: transparent; }
    .group .eyebrow { background: var(--bg); padding-right: 8px; }
    .row { height: 32px; align-items: center; position: relative; z-index: 1; }
    .row:hover .name .t { color: var(--ink); text-decoration: underline; text-underline-offset: 3px; }
    .name { height: 100%; border: 0; text-align: left; padding: 0 16px 0 0; display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--body); cursor: pointer; }
    .name .t { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0; }
    .is-done .name .t { color: var(--muted); }
    .row .track { height: 100%; }

    .bar, .ms { position: absolute; top: 50%; border: 0; padding: 0; cursor: pointer; }
    .bar { height: 10px; margin-top: -5px; border-radius: 2px; min-width: 6px; transition: opacity 0.15s; }
    .bar:hover, .ms:hover { opacity: 0.75; }
    .ms { width: 10px; height: 10px; margin: -5px 0 0 -5px; transform: rotate(45deg); }
    .todo, .sw.todo { background: var(--surface); box-shadow: inset 0 0 0 1px var(--ink); }
    .active, .sw.active { background: var(--ink); }
    .done, .sw.done { background: var(--line); }
    .late, .sw.late { background: var(--danger); }
    .nodate { position: absolute; left: 6px; top: 50%; transform: translateY(-50%); font-size: 12px; color: var(--soft); }
    .empty { margin: 0; padding: 48px 0; text-align: center; color: var(--muted); }
  `,
})
export class Gantt {
  readonly store = inject(Store);
  readonly tasks = input.required<Task[]>();
  readonly open = output<Task>();

  /** Escala de tiempo: de lunes a domingo cubriendo tareas y entregas. */
  readonly scale = computed(() => {
    const days: number[] = [];
    for (const t of this.tasks()) {
      if (t.start) days.push(dayNum(t.start));
      if (t.due) days.push(dayNum(t.due));
    }
    for (const p of PRODUCTS) if (p.deadline) days.push(dayNum(p.deadline));
    const today = dayNum(todayIso());
    days.push(today);
    let from = Math.min(...days);
    let to = Math.max(...days);
    // 1970-01-01 fue jueves: (n + 3) % 7 === 0 → lunes
    from -= (from + 3) % 7;
    to += 6 - ((to + 3) % 7) + 1;
    const x = (n: number) => (n - from) * DAY;

    const weeks: { left: number; label: string }[] = [];
    const months: { left: number; label: string }[] = [];
    for (let n = from; n <= to; n++) {
      const iso = isoFromDay(n);
      if ((n + 3) % 7 === 0) weeks.push({ left: x(n), label: String(Number(iso.slice(8, 10))) });
      if (iso.endsWith('-01') || n === from) months.push({ left: x(n), label: MONTHS[Number(iso.slice(5, 7)) - 1] });
    }
    // Evita que el primer mes se solape con el siguiente si empieza a final de mes.
    if (months.length > 1 && months[1].left - months[0].left < 70) months.shift();

    const deadlines = PRODUCTS.filter((p) => p.deadline).map((p) => ({ label: p.short, left: x(dayNum(p.deadline!)) + DAY }));
    return {
      from,
      width: (to - from) * DAY,
      weeks,
      months,
      deadlines,
      today: today >= from && today <= to ? x(today) + DAY / 2 : null,
    };
  });

  readonly groups = computed(() => {
    const { from } = this.scale();
    const today = dayNum(todayIso());
    const toRow = (t: Task): Row => {
      const s = t.start ? dayNum(t.start) : null;
      const d = t.due ? dayNum(t.due) : null;
      const late = t.status !== 'done' && d !== null && d < today;
      const state: Row['state'] = t.status === 'done' ? 'done' : late ? 'late' : t.status === 'todo' ? 'todo' : 'active';
      if (s !== null && d !== null)
        return { task: t, left: (s - from) * DAY, width: (d - s + 1) * DAY, kind: 'bar', state };
      if (d !== null || s !== null)
        return { task: t, left: ((d ?? s)! - from) * DAY + DAY / 2, width: 0, kind: 'milestone', state };
      return { task: t, left: 0, width: 0, kind: 'none', state };
    };
    const key = (t: Task) => t.start ?? t.due ?? '9999';
    return PRODUCTS.map((p) => {
      const rows = this.tasks()
        .filter((t) => t.product === p.id)
        .sort((a, b) => key(a).localeCompare(key(b)) || a.rank - b.rank)
        .map(toRow);
      const label = p.deadline ? `${p.short} · ${p.name} · ${shortDate(p.deadline)}` : p.name;
      return { id: p.id, label, rows };
    }).filter((g) => g.rows.length);
  });

  tip(t: Task) {
    const range = t.start && t.due ? `${shortDate(t.start)} → ${shortDate(t.due)}` : t.due ? shortDate(t.due) : t.start ? shortDate(t.start) : '';
    return `${t.title}${range ? ' · ' + range : ''}${t.estimate ? ' · ' + t.estimate + ' h' : ''}`;
  }
}
