export type Status = 'todo' | 'doing' | 'review' | 'done';
export type Product = 'ORG' | 'P1' | 'P2' | 'P3' | 'P4';

export interface Task {
  id: string;
  title: string;
  notes: string;
  product: Product;
  status: Status;
  assignee: string | null;
  estimate: number; // horas
  due: string | null; // YYYY-MM-DD
  rank: number;
  createdAt: number;
  createdBy: string | null;
  doneAt: number | null;
}

export const STATUSES: { id: Status; label: string }[] = [
  { id: 'todo', label: 'Por hacer' },
  { id: 'doing', label: 'En curso' },
  { id: 'review', label: 'En revisión' },
  { id: 'done', label: 'Hecho' },
];

export interface ProductInfo {
  id: Product;
  short: string;
  name: string;
  deadline: string | null;
  points: number | null;
}

// Fechas y puntos de los enunciados del proyecto FP.451
export const PRODUCTS: ProductInfo[] = [
  { id: 'ORG', short: 'Fases', name: 'Fases y organización', deadline: null, points: null },
  { id: 'P1', short: 'P1', name: 'FrontEnd con Angular', deadline: '2026-10-27', points: 25 },
  { id: 'P2', short: 'P2', name: 'Datos en Firebase', deadline: '2026-11-17', points: 35 },
  { id: 'P3', short: 'P3', name: 'App móvil React Native', deadline: '2026-12-08', points: 35 },
  { id: 'P4', short: 'P4', name: 'Notificaciones push', deadline: '2026-12-21', points: 15 },
];

export const PRODUCT_BY_ID: Record<Product, ProductInfo> = Object.fromEntries(
  PRODUCTS.map((p) => [p.id, p]),
) as Record<Product, ProductInfo>;

/** Días entre hoy y una fecha ISO (negativo si ya pasó). */
export function daysUntil(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date();
  const a = Date.UTC(t.getFullYear(), t.getMonth(), t.getDate());
  const b = Date.UTC(y, m - 1, d);
  return Math.round((b - a) / 86400000);
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export function shortDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

/** Normaliza un documento de Firestore (puede venir incompleto). */
export function toTask(id: string, d: Record<string, unknown>): Task {
  const st = d['status'];
  const pr = d['product'];
  const num = (v: unknown) => (typeof v === 'number' && isFinite(v) && v >= 0 ? v : 0);
  return {
    id,
    title: typeof d['title'] === 'string' ? (d['title'] as string) : '(sin título)',
    notes: typeof d['notes'] === 'string' ? (d['notes'] as string) : '',
    product: (['ORG', 'P1', 'P2', 'P3', 'P4'] as string[]).includes(pr as string) ? (pr as Product) : 'ORG',
    status: (['todo', 'doing', 'review', 'done'] as string[]).includes(st as string) ? (st as Status) : 'todo',
    assignee: typeof d['assignee'] === 'string' ? (d['assignee'] as string) : null,
    estimate: num(d['estimate']),
    due: typeof d['due'] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d['due'] as string) ? (d['due'] as string) : null,
    rank: typeof d['rank'] === 'number' ? (d['rank'] as number) : 0,
    createdAt: num(d['createdAt']),
    createdBy: typeof d['createdBy'] === 'string' ? (d['createdBy'] as string) : null,
    doneAt: typeof d['doneAt'] === 'number' ? (d['doneAt'] as number) : null,
  };
}
