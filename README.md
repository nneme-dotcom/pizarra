# Pizarra · EQUIPO BASKET

Tablero de tareas del equipo para el proyecto FP.451 (UOC). Sustituye a Trello:

- **Tablero:** kanban con arrastrar y soltar, responsable, estimación y fecha límite.
- **Cronograma:** diagrama de Gantt agrupado por producto, con las entregas P1–P4 y la línea de hoy.
- **Progreso:** avance por producto, horas pendientes y tareas atrasadas.

La primera vez, con la pizarra vacía, el botón **Cargar plan del proyecto** crea las
tareas de `src/app/plan.ts` (enunciados, rúbricas y calendario del aula).

- **Frontend:** Angular 21 (componentes standalone + signals) y Angular CDK para el drag & drop.
- **Datos:** Cloud Firestore, en tiempo real (`onSnapshot`).
- **Acceso:** Firebase Authentication con Google. Solo entran los correos listados en `firestore.rules`.
- **Publicación:** Firebase Hosting.

## Puesta en marcha (una sola vez)

1. **Crear el proyecto** en <https://console.firebase.google.com> → *Añadir proyecto*.
2. **Authentication** → *Comenzar* → *Método de acceso* → activar **Google**.
3. **Firestore Database** → *Crear base de datos* → modo **producción**, región `eur3 (europe-west)`.
4. **Configuración del proyecto** (rueda dentada) → *Tus apps* → icono **Web `</>`** → registrar la app
   (sin marcar Hosting) y copiar el objeto `firebaseConfig` en `src/app/firebase.config.ts`.
5. Poner el **ID del proyecto** en `.firebaserc`.
6. Poner los **correos del equipo** (cuentas de Google, en minúsculas) en `firestore.rules`.
7. Instalar y desplegar:

   ```bash
   npm install
   npx -y firebase-tools login
   npm run deploy
   ```

   La URL pública aparece al final del despliegue (`https://<id-proyecto>.web.app`).

## Uso diario

| Acción | Comando |
|---|---|
| Desarrollo local (`http://localhost:4200`) | `npm start` |
| Publicar cambios de la app y las reglas | `npm run deploy` |
| Publicar desde Cloud Shell | `cd ~/pizarra && git pull && npx ng build && firebase deploy --project fp451-9b6d0` |
| Añadir a un compañero (solo reglas) | editar `firestore.rules` → `npm run deploy:rules` |

> Para probar en local con login, `localhost` ya está autorizado por defecto en
> *Authentication → Configuración → Dominios autorizados*.

## Estructura

```
src/app/
  app.ts              Cabecera, pestañas, filtros, pantalla de login
  board.ts            Tablero kanban (4 columnas, arrastrar y soltar)
  gantt.ts            Cronograma (Gantt) por producto
  plan.ts             Plan inicial del proyecto (tareas con fechas)
  progress.ts         Resumen y avance por producto
  editor.ts           Panel lateral para crear/editar tareas
  avatar.ts           Foto de Google o iniciales
  store.ts            Servicio de datos: Auth + Firestore
  model.ts            Tipos, productos con fechas de entrega y utilidades
  firebase.config.ts  Configuración web de Firebase
firestore.rules       Seguridad: lista de correos y validación de tareas
firebase.json         Hosting (SPA) y Firestore
```

## Datos en Firestore

- `tasks/{id}`: `title`, `notes`, `product` (`ORG`·`P1`…`P4`), `status` (`todo`·`doing`·`review`·`done`),
  `assignee` (uid), `estimate` (h), `start` y `due` (`AAAA-MM-DD`), `rank`, `createdAt`, `createdBy`, `doneAt`.
- `members/{uid}`: `name`, `email`, `photo`, `lastSeen`. Cada persona se registra al entrar por primera vez.
