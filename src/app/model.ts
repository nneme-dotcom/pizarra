/** Tres estados, como un kanban mínimo. */
export type Status = 'todo' | 'doing' | 'done';
/** ORG agrupa las fases del aula (Google Sites, foros, defensa…); P1–P4 son los productos evaluables. */
export type Product = 'ORG' | 'P1' | 'P2' | 'P3' | 'P4';

export interface Task {
  id: string;
  title: string;
  notes: string;
  product: Product;
  status: Status;
  /** Horas estimadas */
  estimate: number;
  /** Horas reales dedicadas */
  spent: number;
  /** Inicio y fin previstos, AAAA-MM-DD */
  start: string | null;
  due: string | null;
  /** Un hito se dibuja como rombo en la línea temporal (p. ej. una entrega o un tag de GitHub). */
  milestone: boolean;
  /** Enlace a commit, tag, PR o documento que demuestra la tarea */
  link: string;
  /** Criterio de la rúbrica que cubre (texto libre) */
  rubric: string;
  rank: number;
  updatedAt: number;
}

export type TaskData = Omit<Task, 'id'>;

export const STATUSES: { id: Status; label: string; icon: string }[] = [
  { id: 'todo', label: 'Por hacer', icon: 'bi-circle' },
  { id: 'doing', label: 'En curso', icon: 'bi-play-circle-fill' },
  { id: 'done', label: 'Hecho', icon: 'bi-check-circle-fill' },
];
export const STATUS_LABEL: Record<Status, string> = { todo: 'Por hacer', doing: 'En curso', done: 'Hecho' };

export interface ProductInfo {
  id: Product;
  short: string;
  name: string;
  deadline: string | null;
  points: number | null;
  min: number | null;
}

/** Fechas y puntos de los enunciados de FP.451 */
export const PRODUCTS: ProductInfo[] = [
  { id: 'ORG', short: 'Fases', name: 'Fases del aula y memoria', deadline: '2026-12-26', points: null, min: null },
  { id: 'P1', short: 'P1', name: 'Front-end con Angular', deadline: '2026-10-27', points: 25, min: 7.5 },
  { id: 'P2', short: 'P2', name: 'Persistencia en Firebase', deadline: '2026-11-17', points: 35, min: 17.5 },
  { id: 'P3', short: 'P3', name: 'Interfaz móvil React Native', deadline: '2026-12-08', points: 35, min: 17.5 },
  { id: 'P4', short: 'P4', name: 'Notificaciones push', deadline: '2026-12-21', points: 15, min: 7.5 },
];
export const PRODUCT_IDS = PRODUCTS.map((p) => p.id);
export const PRODUCT_BY_ID = Object.fromEntries(PRODUCTS.map((p) => [p.id, p])) as Record<Product, ProductInfo>;

/* ---------- Fechas (todo en días UTC para evitar líos de husos horarios) ---------- */

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** AAAA-MM-DD → días desde 1970 */
export function dayNum(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}

export function isoFromDay(n: number): string {
  return new Date(n * 86400000).toISOString().slice(0, 10);
}

export function daysUntil(iso: string): number {
  return dayNum(iso) - dayNum(todayIso());
}

export function shortDate(iso: string | null): string {
  if (!iso) return '—';
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

export function monthName(iso: string): string {
  return MONTHS[Number(iso.slice(5, 7)) - 1];
}

/** Una tarea está atrasada si no está hecha y su fecha límite ya pasó. */
export function isLate(t: Task): boolean {
  return t.status !== 'done' && !!t.due && daysUntil(t.due) < 0;
}

/* ---------- Progreso ---------- */

export interface Stats {
  total: number;
  done: number;
  doing: number;
  late: number;
  estimate: number;
  estimateDone: number;
  spent: number;
  /** Avance ponderado por horas estimadas (0–100) */
  pct: number;
}

export function stats(tasks: Task[]): Stats {
  const s: Stats = { total: tasks.length, done: 0, doing: 0, late: 0, estimate: 0, estimateDone: 0, spent: 0, pct: 0 };
  for (const t of tasks) {
    s.estimate += t.estimate;
    s.spent += t.spent;
    if (t.status === 'done') {
      s.done++;
      s.estimateDone += t.estimate;
    }
    if (t.status === 'doing') s.doing++;
    if (isLate(t)) s.late++;
  }
  // Si no hay estimaciones, cuenta tareas en vez de horas
  s.pct = s.estimate > 0 ? Math.round((s.estimateDone / s.estimate) * 100) : s.total ? Math.round((s.done / s.total) * 100) : 0;
  return s;
}

export function byDue(a: Task, b: Task): number {
  return (a.due ?? '9999').localeCompare(b.due ?? '9999') || a.rank - b.rank;
}

/* ---------- Lectura segura de Firestore (los documentos pueden venir incompletos) ---------- */

export function toTask(id: string, d: Record<string, unknown>): Task {
  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  const num = (v: unknown) => (typeof v === 'number' && isFinite(v) && v >= 0 ? v : 0);
  const iso = (v: unknown) => (typeof v === 'string' && ISO.test(v) ? v : null);
  const st = d['status'];
  const pr = d['product'];
  return {
    id,
    title: str(d['title']) || '(sin título)',
    notes: str(d['notes']),
    product: PRODUCT_IDS.includes(pr as Product) ? (pr as Product) : 'ORG',
    status: st === 'doing' || st === 'done' ? st : 'todo',
    estimate: num(d['estimate']),
    spent: num(d['spent']),
    start: iso(d['start']),
    due: iso(d['due']),
    milestone: d['milestone'] === true,
    link: str(d['link']),
    rubric: str(d['rubric']),
    rank: typeof d['rank'] === 'number' ? (d['rank'] as number) : 0,
    updatedAt: num(d['updatedAt']),
  };
}

export function emptyTask(product: Product = 'P1', status: Status = 'todo'): TaskData {
  const today = todayIso();
  return {
    title: '',
    notes: '',
    product,
    status,
    estimate: 1,
    spent: 0,
    start: today,
    due: PRODUCT_BY_ID[product].deadline ?? today,
    milestone: false,
    link: '',
    rubric: '',
    rank: Date.now(),
    updatedAt: Date.now(),
  };
}
