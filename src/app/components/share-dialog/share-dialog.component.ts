import { Component, HostListener, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '../../store';

/** Gestiona quién puede ver la Pizarra (solo lectura). La lista se guarda en config/access. */
@Component({
  selector: 'app-share-dialog',
  imports: [FormsModule],
  template: `
    <div class="sheet-backdrop" (click)="close()">
      <div class="card sheet" role="dialog" aria-modal="true" aria-labelledby="share-title" (click)="$event.stopPropagation()">
        <header class="head">
          <h2 id="share-title" class="section-title flex-grow-1">Compartir</h2>
          <button type="button" class="btn btn-ghost btn-touch rounded-circle" (click)="close()" aria-label="Cerrar">
            <i class="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </header>
        <div class="body d-grid gap-3">
          <p class="text-body-secondary small mb-0">
            Las personas invitadas entran con su cuenta de Google (las cuentas <strong>@uoc.edu</strong> lo son)
            y ven la línea temporal, el tablero y los detalles, sin poder modificar nada.
          </p>

          <div>
            <span class="form-label d-block">Enlace de la Pizarra</span>
            <div class="input-group">
              <input class="form-control" [value]="url" readonly aria-label="Enlace de la Pizarra" />
              <button type="button" class="btn btn-outline-eagles" (click)="copy()">
                <i class="bi" [class.bi-clipboard]="!copied()" [class.bi-check2]="copied()" aria-hidden="true"></i>
                {{ copied() ? 'Copiado' : 'Copiar' }}
              </button>
            </div>
          </div>

          <form (ngSubmit)="add()" novalidate>
            <label class="form-label" for="share-email">Invitar con solo lectura</label>
            <div class="input-group">
              <input id="share-email" class="form-control" type="email" name="email" [(ngModel)]="email" placeholder="consultor@uoc.edu" autocomplete="off" />
              <button type="submit" class="btn btn-eagles" [disabled]="busy()">Invitar</button>
            </div>
            @if (msg(); as m) { <p class="text-danger small mt-2 mb-0" role="alert">{{ m }}</p> }
          </form>

          <div>
            <span class="form-label d-block">Con acceso</span>
            <ul class="list-unstyled d-grid gap-2 mb-0">
              <li class="person"><i class="bi bi-person-fill-gear text-lime" aria-hidden="true"></i><span class="flex-grow-1 text-truncate">{{ store.user()?.email }}</span><span class="role">Propietaria</span></li>
              @for (v of store.viewers(); track v) {
                <li class="person">
                  <i class="bi bi-eye" aria-hidden="true"></i>
                  <span class="flex-grow-1 text-truncate">{{ v }}</span>
                  <span class="role">Lectura</span>
                  <button type="button" class="btn btn-ghost btn-sm btn-touch" (click)="remove(v)" [attr.aria-label]="'Quitar acceso a ' + v">
                    <i class="bi bi-x-lg" aria-hidden="true"></i>
                  </button>
                </li>
              }
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .head { display: flex; align-items: center; gap: .75rem; padding: .9rem .9rem .6rem 1.25rem; border-bottom: 1px solid var(--eagles-line); }
    .body { padding: 1.25rem; }
    .person { display: flex; align-items: center; gap: .6rem; min-height: var(--eagles-touch); padding: 0 .4rem 0 .8rem;
      border-radius: var(--eagles-radius); background: var(--eagles-surface-alt); font-size: .875rem; }
    .role { font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--eagles-text-muted); }
  `,
})
export class ShareDialogComponent {
  protected readonly store = inject(Store);
  readonly closed = output<void>();

  protected email = '';
  protected readonly url = location.origin;
  protected readonly copied = signal(false);
  protected readonly busy = signal(false);
  protected readonly msg = signal<string | null>(null);

  protected async add(): Promise<void> {
    const e = this.email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return this.msg.set('Escribe un correo válido.');
    if (this.store.viewers().includes(e)) return this.msg.set('Ese correo ya tiene acceso.');
    this.msg.set(null);
    this.busy.set(true);
    try {
      await this.store.setViewers([...this.store.viewers(), e]);
      this.email = '';
    } catch {
      this.msg.set('No se pudo guardar. Inténtalo de nuevo.');
    } finally {
      this.busy.set(false);
    }
  }

  protected remove(e: string): void {
    void this.store.setViewers(this.store.viewers().filter((v) => v !== e)).catch(() => undefined);
  }

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.url);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      /* el portapapeles puede no estar disponible */
    }
  }

  @HostListener('document:keydown.escape')
  protected close(): void {
    this.closed.emit();
  }
}
