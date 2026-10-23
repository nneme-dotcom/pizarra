# Pizarra · VBE Eagles Echternach

Herramienta de planificación del proyecto **FP.451 (UOC)**. Sustituye a Trello y la comparto con el consultor
para que vea el progreso y las tareas pendientes en tiempo real.

- **Roadmap:** cifras clave (avance ponderado por horas, próxima entrega, tareas, horas reales),
  progreso por producto, *project planning timeline* (diagrama de Gantt con entregas, hitos y línea de hoy),
  lista de pendientes ordenada por fecha y línea de hitos.
- **Tablero:** kanban de tres estados (Por hacer · En curso · Hecho) con arrastrar y soltar.
- **Detalle de tarea:** producto, estado, fechas, horas estimadas y reales, criterio de rúbrica, enlace
  al commit/tag/PR que lo demuestra y notas.
- **Acceso:** login con Google. La propietaria edita; el consultor entra con su cuenta de la UOC y solo lee.

Misma estética y stack que el Producto 1: **Angular 22** (standalone, signals, zoneless), **Bootstrap 5**,
Bebas Neue + Inter y la identidad visual del club. Datos en **Cloud Firestore** y publicación en **Firebase Hosting**.

## Puesta en marcha

Usa el proyecto de Firebase `fp451-9b6d0` (ya configurado en `.firebaserc` y `src/app/firebase.config.ts`).
Requiere Node `22.22.3+` o `24.15+`.

```bash
npm install
npx -y firebase-tools login      # solo la primera vez
npm run deploy                   # compila y publica la app y las reglas
```

1. Abre `https://fp451-9b6d0.web.app` y entra con tu cuenta.
2. Con la pizarra vacía, pulsa **Cargar plan del proyecto** (crea las tareas de `src/app/plan.ts`).
3. **Compartir** → añade el correo del consultor. Ya puede entrar con su cuenta de Google (UOC) en modo lectura.

| Acción | Comando |
|---|---|
| Desarrollo local (`http://localhost:4200`) | `npm start` |
| Vista previa sin login (datos de ejemplo) | `http://localhost:4200/?demo` · como consultor: `?demo=tutor` |
| Publicar app + reglas | `npm run deploy` |
| Publicar solo reglas | `npm run deploy:rules` |

## Seguridad

La interfaz oculta los botones de edición al consultor, pero quien lo garantiza es `firestore.rules`:

- `roadmap/*`: leen la propietaria y los correos de `config/access.viewers`; solo la propietaria escribe,
  y cada tarea se valida (estado, producto, horas y fechas).
- `config/access`: solo la propietaria lo modifica (desde el botón *Compartir*).
- Todo lo demás, incluidas las colecciones de la versión anterior (`tasks`, `members`), queda cerrado.

Los correos con permiso de edición están en `src/app/access.ts` y en `isOwner()` de las reglas (deben coincidir).

## Estructura

```
src/app/
  app.ts / app.html            Cabecera, login, vistas y filtro por producto
  store.ts                     Auth + Firestore en tiempo real (signals) y modo demo
  model.ts                     Tipos, productos con fechas y puntos, cálculo de progreso
  plan.ts                      Plan inicial (fases, P1–P4, estimaciones y criterios de rúbrica)
  access.ts                    Correos con permiso de edición
  components/
    summary/                   Cifras clave y tarjetas por producto
    timeline/                  Project planning timeline (Gantt)
    pending/                   Tareas abiertas por fecha límite
    milestones/                Hitos y entregas
    board/                     Kanban de 3 columnas (Angular CDK drag & drop)
    task-editor/               Detalle y edición de una tarea
    share-dialog/              Invitar al consultor (solo lectura)
firestore.rules                Reglas de seguridad
firebase.json                  Hosting (SPA, caché) y Firestore
```

## Datos (`roadmap/{id}`)

`title`, `notes`, `product` (`ORG`·`P1`…`P4`), `status` (`todo`·`doing`·`done`), `estimate` y `spent` (h),
`start` y `due` (`AAAA-MM-DD`), `milestone`, `link`, `rubric`, `rank`, `updatedAt`.

## Evolución prevista

- **P3:** vista móvil en React Native (roadmap y pendientes).
- **P4:** aviso push al consultor cuando un hito pase a «Hecho» (Cloud Functions + FCM).
