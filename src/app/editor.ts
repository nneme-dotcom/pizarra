import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from './store';
import { PRODUCTS, Product, STATUSES, Status, Task } from './model';

interface Draft {
  title: string;
  notes: string;
  product: Product;
  status: Status;
  assignee: string | null;
  estimate: number | null;
  due: string;
}

@Component({
  selector: 'app-editor',
  imports: [FormsModule],
  template: `
    <div class="scrim" (click)="close.emit()"></div>
    <form class="panel" role="dialog" aria-modal="true" [attr.aria-label]="task() ? 'Editar tarea' : 'Nueva tarea'" (submit)="submit($event)" (keydown.escape)="close.emit()">
      <div class="head">
        <h2>{{ task() ? 'Editar tarea' : 'Nueva tarea' }}</h2>
        <button type="button" class="btn ghost x" (click)="close.emit()" aria-label="Cerrar">✕</button>
      </div>

      <label class="f">
        <span class="sr">Título</span>
        <input id="f-title" name="title" [(ngModel)]="d.title" placeholder="Título de la tarea" autocomplete="off" />
        @if (titleError()) { <em class="err">Escribe un título para la tarea.</em> }
      </label>

      <div class="row">
        <label class="f">
          <span>Producto</span>
          <select id="f-product" name="product" [(ngModel)]="d.product">
            @for (p of products; track p.id) { <option [value]="p.id">{{ p.id === 'ORG' ? 'Fases / organización' : p.short + ' · ' + p.name }}</option> }
          </select>
        </label>
        <label class="f">
          <span>Estado</span>
          <select id="f-status" name="status" [(ngModel)]="d.status">
            @for (s of statuses; track s.id) { <option [value]="s.id">{{ s.label }}</option> }
          </select>
        </label>
      </div>

      <label class="f">
        <span>Responsable</span>
        <select id="f-assignee" name="assignee" [(ngModel)]="d.assignee">
          <option [ngValue]="null">Sin asignar</option>
          @for (id of store.memberIds(); track id) { <option [ngValue]="id">{{ store.displayName(id) }}</option> }
        </select>
      </label>

      <div class="row">
        <label class="f">
          <span>Estimación (h)</span>
          <input id="f-estimate" name="estimate" type="number" min="0" step="0.5" inputmode="decimal" [(ngModel)]="d.estimate" placeholder="0" />
        </label>
        <label class="f">
          <span>Fecha límite</span>
          <input id="f-due" name="due" type="date" [(ngModel)]="d.due" />
        </label>
      </div>

      <label class="f">
        <span>Notas</span>
        <textarea id="f-notes" name="notes" rows="4" [(ngModel)]="d.notes" placeholder="Criterio de la rúbrica, enlace al PR…"></textarea>
      </label>

      <div class="actions">
        @if (task()) {
          @if (confirmDelete()) {
            <span class="confirm">¿Borrar esta tarea?</span>
            <button type="button" class="btn danger solid" (click)="del()">Borrar</button>
            <button type="button" class="btn" (click)="confirmDelete.set(false)">No</button>
          } @else {
            <button type="button" class="btn danger" (click)="confirmDelete.set(true)">Borrar</button>
          }
        }
        <span class="sp"></span>
        <button type="button" class="btn" (click)="close.emit()">Cancelar</button>
        <button type="submit" class="btn primary">{{ task() ? 'Guardar' : 'Crear tarea' }}</button>
      </div>
    </form>
  `,
  styles: `
    :host { position: fixed; inset: 0; z-index: 20; display: flex; justify-content: flex-end; }
    .scrim { position: absolute; inset: 0; background: rgba(8, 8, 8, 0.24); animation: fade 0.15s ease-out; }
    .panel {
      position: relative; width: min(440px, 100%); height: 100%; overflow-y: auto; background: var(--surface);
      border-left: 1px solid var(--line); box-shadow: var(--shadow-modal);
      padding: calc(28px + env(safe-area-inset-top, 0px)) 32px calc(28px + env(safe-area-inset-bottom, 0px));
      display: flex; flex-direction: column; gap: 20px; animation: slide 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    @media (max-width: 480px) { .panel { padding-inline: 20px; } }
    @keyframes slide { from { transform: translateX(16px); opacity: 0; } }
    @keyframes fade { from { opacity: 0; } }
    @media (prefers-reduced-motion: reduce) { .panel, .scrim { animation: none; } }
    .head { display: flex; align-items: center; }
    h2 { margin: 0; font-size: 12px; font-weight: 500; letter-spacing: 0.05em; text-transform: uppercase; color: var(--muted); }
    .x { margin-left: auto; width: 32px; height: 32px; padding: 0; color: var(--muted); }
    .f { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    .f > span, #lbl-assignee { font-size: 13px; font-weight: 500; color: var(--body); }
    input, select, textarea {
      width: 100%; min-width: 0; border: 1px solid var(--line); background: var(--surface);
      border-radius: var(--r-sm); padding: 9px 12px; transition: border-color 0.15s;
    }
    input:focus, select:focus, textarea:focus { outline: none; border-color: var(--ink); }
    input::placeholder, textarea::placeholder { color: var(--soft); }
    textarea { resize: vertical; }
    #f-title { font-size: 22px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.3; border: 0; border-bottom: 1px solid var(--line); border-radius: 0; padding: 4px 0 12px; }
    #f-title:focus { border-bottom-color: var(--ink); }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .search { position: relative; }
    .search ul { list-style: none; margin: 4px 0 0; padding: 4px; border: 1px solid var(--line); border-radius: var(--r-sm); background: var(--surface); }
    .search li button { width: 100%; display: flex; align-items: center; gap: 8px; border: 0; background: transparent; padding: 6px 8px; border-radius: var(--r-sm); text-align: left; }
    .search li button:hover { background: var(--fill); }
    .err { color: var(--danger); font-style: normal; font-size: 13px; }
    .hint { margin: 0; font-size: 13px; color: var(--muted); }
    .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    .actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: auto; padding-top: 20px; }
    .sp { flex: 1; }
    .confirm { font-size: 13px; }
  `,
})
export class Editor implements OnInit {
  readonly store = inject(Store);
  readonly task = input<Task | null>(null);
  readonly status = input<Status>('todo');
  readonly close = output<void>();

  readonly products = PRODUCTS;
  readonly statuses = STATUSES;
  readonly titleError = signal(false);
  readonly confirmDelete = signal(false);

  d: Draft = { title: '', notes: '', product: 'P1', status: 'todo', assignee: null, estimate: null, due: '' };

  ngOnInit() {
    const t = this.task();
    if (t) {
      this.d = {
        title: t.title,
        notes: t.notes,
        product: t.product,
        status: t.status,
        assignee: t.assignee,
        estimate: t.estimate || null,
        due: t.due ?? '',
      };
    } else {
      this.d.status = this.status();
    }
    queueMicrotask(() => (document.getElementById('f-title') as HTMLInputElement | null)?.focus());
  }

  async submit(e: Event) {
    e.preventDefault();
    const title = this.d.title.trim();
    if (!title) {
      this.titleError.set(true);
      (document.getElementById('f-title') as HTMLInputElement | null)?.focus();
      return;
    }
    const n = this.d.estimate;
    const data = {
      title,
      notes: this.d.notes.trim(),
      product: this.d.product,
      status: this.d.status,
      assignee: this.d.assignee,
      estimate: typeof n === 'number' && isFinite(n) && n > 0 ? Math.round(n * 10) / 10 : 0,
      due: this.d.due || null,
    };
    const t = this.task();
    this.close.emit();
    if (t) await this.store.save(t, data);
    else await this.store.create(data);
  }

  async del() {
    const t = this.task();
    if (!t) return;
    this.close.emit();
    await this.store.remove(t);
  }
}
