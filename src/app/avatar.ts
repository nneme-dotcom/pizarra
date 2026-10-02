import { Component, computed, inject, input } from '@angular/core';
import { Store } from './store';

@Component({
  selector: 'app-avatar',
  template: `
    @if (p(); as person) {
      @if (person.photo) {
        <img [src]="person.photo" alt="" referrerpolicy="no-referrer" [style.width.px]="size()" [style.height.px]="size()" />
      } @else {
        <span class="ini" [style.width.px]="size()" [style.height.px]="size()" [style.font-size.px]="size() * 0.42">{{ initials() }}</span>
      }
    } @else {
      <span class="empty" [style.width.px]="size()" [style.height.px]="size()"></span>
    }
  `,
  styles: `
    :host { display: inline-flex; flex: none; }
    img, span { border-radius: 50%; display: block; object-fit: cover; }
    .ini { display: grid; place-items: center; background: var(--fill); color: var(--body); font-weight: 600; border: 1px solid var(--line); }
    .empty { border: 1px dashed var(--line); }
  `,
})
export class Avatar {
  private store = inject(Store);
  readonly id = input<string | null>(null);
  readonly size = input(20);
  readonly p = computed(() => this.store.person(this.id()));
  readonly initials = computed(() =>
    (this.p()?.name || '?')
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join(''),
  );
}
