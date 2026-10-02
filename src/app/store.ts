import { Injectable, computed, signal } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, User, getAuth, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  Unsubscribe,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { firebaseConfig } from './firebase.config';
import { Status, Task, toTask } from './model';

export interface Person {
  id: string;
  name: string;
  email: string;
  photo: string;
}

/** loading: comprobando sesión · out: sin sesión · in: dentro · denied: correo no autorizado */
export type Session = 'loading' | 'out' | 'in' | 'denied';

export type NewTask = Omit<Task, 'id' | 'rank' | 'createdAt' | 'createdBy' | 'doneAt'>;

@Injectable({ providedIn: 'root' })
export class Store {
  private readonly app = initializeApp(firebaseConfig);
  private readonly auth = getAuth(this.app);
  private readonly db = getFirestore(this.app);
  private subs: Unsubscribe[] = [];

  readonly session = signal<Session>('loading');
  readonly user = signal<User | null>(null);
  readonly tasks = signal<Task[]>([]);
  readonly members = signal<Person[]>([]);
  readonly loaded = signal(false);
  readonly error = signal<string | null>(null);

  readonly me = computed(() => this.user()?.uid ?? null);
  readonly memberIds = computed(() => this.members().map((m) => m.id));
  readonly people = computed(() => Object.fromEntries(this.members().map((m) => [m.id, m])) as Record<string, Person>);

  constructor() {
    onAuthStateChanged(this.auth, (u) => this.onUser(u));
  }

  // ---------- sesión ----------

  async signIn() {
    this.error.set(null);
    try {
      await signInWithPopup(this.auth, new GoogleAuthProvider());
    } catch (e: any) {
      if (e?.code !== 'auth/popup-closed-by-user' && e?.code !== 'auth/cancelled-popup-request') {
        this.error.set('No se pudo iniciar sesión. Inténtalo de nuevo.');
      }
    }
  }

  signOut() {
    return signOut(this.auth);
  }

  private async onUser(u: User | null) {
    this.subs.forEach((off) => off());
    this.subs = [];
    this.tasks.set([]);
    this.members.set([]);
    this.loaded.set(false);
    this.user.set(u);
    if (!u) {
      this.session.set('out');
      return;
    }
    // Registrarse como miembro. Si las reglas rechazan el correo, no tiene acceso.
    try {
      await setDoc(
        doc(this.db, 'members', u.uid),
        { name: u.displayName || u.email || 'Sin nombre', email: u.email ?? '', photo: u.photoURL ?? '', lastSeen: Date.now() },
        { merge: true },
      );
    } catch (e: any) {
      this.session.set(e?.code === 'permission-denied' ? 'denied' : 'out');
      if (e?.code !== 'permission-denied') this.error.set('No se pudo conectar con la base de datos.');
      return;
    }
    this.session.set('in');
    this.subs.push(
      onSnapshot(
        collection(this.db, 'tasks'),
        (s) => {
          this.tasks.set(s.docs.map((d) => toTask(d.id, d.data())));
          this.loaded.set(true);
        },
        (e) => this.fail(e),
      ),
      onSnapshot(
        collection(this.db, 'members'),
        (s) =>
          this.members.set(
            s.docs
              .map((d) => {
                const v = d.data();
                return {
                  id: d.id,
                  name: typeof v['name'] === 'string' ? v['name'] : '',
                  email: typeof v['email'] === 'string' ? v['email'] : '',
                  photo: typeof v['photo'] === 'string' ? v['photo'] : '',
                };
              })
              .sort((a, b) => a.name.localeCompare(b.name)),
          ),
        (e) => this.fail(e),
      ),
    );
  }

  // ---------- personas ----------

  person(id: string | null): Person | null {
    return id ? (this.people()[id] ?? null) : null;
  }

  displayName(id: string | null): string {
    if (!id) return 'Sin asignar';
    const name = this.people()[id]?.name || 'Compañero';
    return id === this.me() ? `${name} (tú)` : name;
  }

  // ---------- tareas ----------

  async create(data: NewTask) {
    await this.run(() =>
      addDoc(collection(this.db, 'tasks'), {
        ...data,
        rank: this.nextRank(data.status),
        createdAt: Date.now(),
        createdBy: this.me(),
        doneAt: data.status === 'done' ? Date.now() : null,
      }),
    );
  }

  async save(prev: Task, patch: Partial<NewTask>) {
    const changes: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patch)) if ((prev as any)[k] !== v) changes[k] = v;
    if (patch.status && patch.status !== prev.status) {
      changes['doneAt'] = patch.status === 'done' ? Date.now() : null;
      changes['rank'] = this.nextRank(patch.status, prev.id);
    }
    if (Object.keys(changes).length) await this.run(() => updateDoc(doc(this.db, 'tasks', prev.id), changes));
  }

  async move(task: Task, status: Status, rank: number) {
    if (task.status === status && task.rank === rank) return;
    const changes: Record<string, unknown> = { status, rank };
    if (status !== task.status) changes['doneAt'] = status === 'done' ? Date.now() : null;
    // Actualización local inmediata para que la tarjeta no "salte" al soltarla.
    this.tasks.update((ts) => ts.map((t) => (t.id === task.id ? ({ ...t, ...changes } as Task) : t)));
    await this.run(() => updateDoc(doc(this.db, 'tasks', task.id), changes));
  }

  async remove(task: Task) {
    await this.run(() => deleteDoc(doc(this.db, 'tasks', task.id)));
  }

  private nextRank(status: Status, exclude?: string) {
    const col = this.tasks().filter((t) => t.status === status && t.id !== exclude);
    return col.length ? Math.max(...col.map((t) => t.rank)) + 1 : 1;
  }

  private async run(fn: () => Promise<unknown>) {
    try {
      this.error.set(null);
      await fn();
    } catch (e) {
      this.fail(e);
    }
  }

  private fail(e: any) {
    this.error.set(
      e?.code === 'permission-denied'
        ? 'No tienes permiso para este cambio.'
        : 'No se pudo guardar el último cambio. Comprueba tu conexión.',
    );
  }
}
