import { Injectable, computed, signal } from '@angular/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, GoogleAuthProvider, User, getAuth, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  Firestore,
  Unsubscribe,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { firebaseConfig } from './firebase.config';
import { OWNER_EMAILS } from './access';
import { Status, Task, TaskData, todayIso, toTask } from './model';
import { PLAN } from './plan';

export type Session = 'loading' | 'out' | 'denied' | 'in';
/** owner: edita todo · viewer: el consultor, solo lectura */
export type Role = 'owner' | 'viewer';

const TASKS = 'roadmap';
const ACCESS = 'config/access';

/**
 * Servicio de datos: autenticación con Google y Firestore en tiempo real.
 * El estado se expone como signals, así los componentes se actualizan solos.
 *
 * Con «?demo» en la URL funciona sin Firebase, con el plan inicial en memoria
 * (útil para enseñar la app o hacer capturas sin iniciar sesión).
 */
@Injectable({ providedIn: 'root' })
export class Store {
  readonly demo = typeof location !== 'undefined' && new URLSearchParams(location.search).has('demo');

  readonly session = signal<Session>('loading');
  readonly role = signal<Role>('viewer');
  readonly user = signal<{ name: string; email: string; photo: string | null } | null>(null);
  readonly tasks = signal<Task[]>([]);
  readonly loaded = signal(false);
  readonly viewers = signal<string[]>([]);
  readonly error = signal<string | null>(null);

  readonly canEdit = computed(() => this.session() === 'in' && this.role() === 'owner');

  private app?: FirebaseApp;
  private auth?: Auth;
  private db?: Firestore;
  private unsubs: Unsubscribe[] = [];

  constructor() {
    if (this.demo) {
      this.startDemo();
      return;
    }
    this.app = initializeApp(firebaseConfig);
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
    onAuthStateChanged(this.auth, (u) => void this.onUser(u));
  }

  /* ---------- Sesión ---------- */

  async signIn(): Promise<void> {
    if (!this.auth) return;
    this.error.set(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(this.auth, provider);
    } catch (e) {
      const code = (e as { code?: string }).code ?? '';
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        this.error.set('No se pudo iniciar sesión. Si el navegador bloquea la ventana emergente, permítela e inténtalo de nuevo.');
      }
    }
  }

  async signOut(): Promise<void> {
    if (this.demo) return;
    if (this.auth) await signOut(this.auth);
  }

  private async onUser(u: User | null): Promise<void> {
    this.stop();
    this.tasks.set([]);
    this.loaded.set(false);
    if (!u || !this.db) {
      this.user.set(null);
      this.session.set('out');
      return;
    }
    const email = (u.email ?? '').toLowerCase();
    this.user.set({ name: u.displayName ?? email, email, photo: u.photoURL });
    this.session.set('loading');

    const isOwner = OWNER_EMAILS.includes(email);
    let viewers: string[] = [];
    try {
      // Las reglas solo dejan leer este documento a la propietaria y a los correos invitados:
      // si la lectura falla, la cuenta no tiene acceso.
      const snap = await getDoc(doc(this.db, ACCESS));
      viewers = cleanEmails(snap.data()?.['viewers']);
    } catch {
      if (!isOwner) {
        this.session.set('denied');
        return;
      }
    }
    if (!isOwner && !viewers.includes(email)) {
      this.session.set('denied');
      return;
    }
    this.role.set(isOwner ? 'owner' : 'viewer');
    this.viewers.set(viewers);
    this.session.set('in');
    this.listen();
  }

  private listen(): void {
    const db = this.db!;
    this.unsubs.push(
      onSnapshot(
        collection(db, TASKS),
        (snap) => {
          this.tasks.set(snap.docs.map((d) => toTask(d.id, d.data())));
          this.loaded.set(true);
        },
        () => this.error.set('Se ha perdido la conexión con la base de datos. Recarga la página.'),
      ),
    );
    if (this.role() === 'owner') {
      this.unsubs.push(onSnapshot(doc(db, ACCESS), (s) => this.viewers.set(cleanEmails(s.data()?.['viewers']))));
    }
  }

  private stop(): void {
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
  }

  /* ---------- Escritura (solo propietaria; las reglas lo garantizan en el servidor) ---------- */

  async save(id: string | null, data: TaskData): Promise<void> {
    const clean: TaskData = { ...data, title: data.title.trim(), updatedAt: Date.now() };
    if (this.demo) {
      const newId = id ?? crypto.randomUUID();
      this.tasks.update((ts) => [...ts.filter((t) => t.id !== newId), { id: newId, ...clean }]);
      return;
    }
    await this.run(() => (id ? setDoc(doc(this.db!, TASKS, id), clean) : setDoc(doc(collection(this.db!, TASKS)), clean)));
  }

  async move(id: string, status: Status, rank: number): Promise<void> {
    const patch = { status, rank, updatedAt: Date.now() };
    // Actualización optimista: se ve al instante y Firestore la confirma después
    this.tasks.update((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    if (this.demo) return;
    await this.run(() => updateDoc(doc(this.db!, TASKS, id), patch));
  }

  async remove(id: string): Promise<void> {
    if (this.demo) {
      this.tasks.update((ts) => ts.filter((t) => t.id !== id));
      return;
    }
    await this.run(() => deleteDoc(doc(this.db!, TASKS, id)));
  }

  async seed(): Promise<void> {
    const rows = planRows();
    if (this.demo) {
      this.tasks.set(rows.map((r, i) => ({ id: `demo-${i}`, ...r })));
      return;
    }
    await this.run(async () => {
      const batch = writeBatch(this.db!);
      rows.forEach((r) => batch.set(doc(collection(this.db!, TASKS)), r));
      await batch.commit();
    });
  }

  async setViewers(list: string[]): Promise<void> {
    const viewers = cleanEmails(list);
    if (this.demo) {
      this.viewers.set(viewers);
      return;
    }
    await this.run(() => setDoc(doc(this.db!, ACCESS), { viewers }, { merge: true }));
  }

  private async run(fn: () => Promise<unknown>): Promise<void> {
    this.error.set(null);
    try {
      await fn();
    } catch (e) {
      console.error(e);
      this.error.set('No se pudo guardar el cambio. Comprueba la conexión o los permisos.');
      throw e;
    }
  }

  private startDemo(): void {
    this.user.set({ name: 'Modo demo', email: 'demo', photo: null });
    this.role.set(new URLSearchParams(location.search).get('demo') === 'tutor' ? 'viewer' : 'owner');
    this.tasks.set(planRows().map((r, i) => ({ id: `demo-${i}`, ...r })));
    this.viewers.set(['consultor@uoc.edu']);
    this.loaded.set(true);
    this.session.set('in');
  }
}

function planRows(): TaskData[] {
  const now = Date.now();
  const today = todayIso();
  return PLAN.map((p, i) => ({
    title: p.title,
    notes: p.notes,
    product: p.product,
    status: p.status ?? 'todo',
    estimate: p.estimate,
    spent: 0,
    start: p.start,
    due: p.due,
    milestone: p.milestone ?? false,
    link: '',
    rubric: p.rubric ?? '',
    rank: (i + 1) * 1000,
    updatedAt: now,
  })).map((r) => (r.status === 'done' && !r.due ? { ...r, due: today } : r));
}

function cleanEmails(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out = v
    .filter((e): e is string => typeof e === 'string')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
  return [...new Set(out)].slice(0, 20);
}
