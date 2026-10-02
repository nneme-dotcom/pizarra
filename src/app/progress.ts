import { Component, computed, input } from '@angular/core';
import { PRODUCTS, ProductInfo, Task, daysUntil, shortDate } from './model';

interface Stat {
  total: number;
  done: number;
  est: number;
  doneEst: number;
  pct: number;
  late: number;
}

function stats(ts: Task[]): Stat {
  let done = 0, est = 0, doneEst = 0, late = 0;
  for (const t of ts) {
    est += t.estimate;
    if (t.status === 'done') {
      done++;
      doneEst += t.estimate;
    } else if (t.due && daysUntil(t.due) < 0) late++;
  }
  // Avance por horas estimadas si hay; si no, por número de tareas.
  const pct = !ts.length ? 0 : est > 0 ? Math.round((doneEst / est) * 100) : Math.round((done / ts.length) * 100);
  return { total: ts.length, done, est, doneEst, pct, late };
}

@Component({
  selector: 'app-progress',
  template: `
    <section class="summary">
      <div class="stat">
        <span class="eyebrow">Completado</span>
        <span class="v num">{{ overall().pct }}%</span>
        <span class="sub num">{{ overall().done }} de {{ overall().total }} tareas</span>
      </div>
      @if (next(); as n) {
        <div class="stat">
          <span class="eyebrow">Próxima entrega</span>
          <span class="v num">{{ n.days }} {{ n.days === 1 ? 'día' : 'días' }}</span>
          <span class="sub">{{ n.info.short }} · {{ date(n.info.deadline!) }}</span>
        </div>
      }
      <div class="stat">
        <span class="eyebrow">Horas pendientes</span>
        <span class="v num">{{ fmt(overall().est - overall().doneEst) }} h</span>
        <span class="sub num">de {{ fmt(overall().est) }} h estimadas</span>
      </div>
      <div class="stat">
        <span class="eyebrow">Atrasadas</span>
        <span class="v num" [class.late]="overall().late > 0">{{ overall().late }}</span>
        <span class="sub">sin terminar a tiempo</span>
      </div>
    </section>

    <section>
      <h2 class="eyebrow">Por producto</h2>
      <ul class="rows">
        @for (p of products(); track p.info.id) {
          <li>
            <span class="code">{{ p.info.short }}</span>
            <span class="name">
              {{ p.info.name }}
              <small class="num">
                @if (p.info.deadline) { {{ date(p.info.deadline) }} · {{ p.info.points }} pts } @else { Foros, Sites, defensa }
                @if (p.late) { · <em>{{ p.late }} atrasada{{ p.late > 1 ? 's' : '' }}</em> }
              </small>
            </span>
            <span class="track" role="img" [attr.aria-label]="p.pct + '% completado'"><i [style.width.%]="p.pct"></i></span>
            <span class="pct num">{{ p.pct }}%</span>
            <span class="count num">{{ p.done }}/{{ p.total }}</span>
          </li>
        }
      </ul>
    </section>
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: 48px; }
    section { display: flex; flex-direction: column; gap: 16px; }
    h2 { margin: 0; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; }
    .stat { display: flex; flex-direction: column; gap: 10px; padding: 4px 24px; min-width: 0; }
    .stat:first-child { padding-left: 0; }
    .stat + .stat { border-left: 1px solid var(--line); }
    .v { font-size: 32px; font-weight: 600; line-height: 1.1; letter-spacing: -0.02em; }
    .v.late { color: var(--danger); }
    .sub { font-size: 13px; color: var(--muted); margin-top: -4px; }
    @media (max-width: 760px) {
      .summary { grid-template-columns: 1fr 1fr; row-gap: 28px; }
      .stat:nth-child(odd) { padding-left: 0; border-left: 0; }
    }
    .rows { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--line); }
    li { display: grid; grid-template-columns: 52px minmax(0, 1fr) minmax(80px, 200px) 44px 40px; align-items: center; gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--line); }
    .code { font-size: 13px; font-weight: 500; color: var(--muted); }
    .name { font-weight: 500; display: flex; flex-direction: column; min-width: 0; }
    .name small { font-size: 12px; font-weight: 400; color: var(--muted); }
    .name em { font-style: normal; color: var(--danger); }
    .track { height: 2px; background: var(--line); overflow: hidden; }
    .track i { display: block; height: 100%; background: var(--ink); }
    .pct { text-align: right; font-weight: 500; }
    .count { text-align: right; font-size: 12px; color: var(--muted); }
    @media (max-width: 560px) {
      li { grid-template-columns: 36px minmax(0, 1fr) 44px; row-gap: 10px; }
      .track { grid-column: 2 / -1; grid-row: 2; }
      .count { display: none; }
    }
  `,
})
export class Progress {
  readonly tasks = input.required<Task[]>();

  readonly products = computed(() =>
    PRODUCTS.map((info: ProductInfo) => ({
      info,
      ...stats(this.tasks().filter((t) => t.product === info.id)),
      days: info.deadline ? daysUntil(info.deadline) : null,
    })),
  );

  readonly overall = computed(() => stats(this.tasks()));

  readonly next = computed(() => {
    const up = this.products().filter((p) => p.days !== null && p.days >= 0);
    return up.length ? up.reduce((a, b) => (a.days! <= b.days! ? a : b)) : null;
  });

  fmt(n: number) {
    return Math.round(n * 10) / 10;
  }
  date(iso: string) {
    return shortDate(iso);
  }
}
