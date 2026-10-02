import { Product } from './model';

/**
 * Plan inicial del proyecto FP.451 (EQUIPO BASKET), sacado de los enunciados,
 * las rúbricas y el calendario del aula. Se importa una sola vez desde la app
 * cuando la pizarra está vacía; después todo se edita desde la propia pizarra.
 */
export interface PlanTask {
  product: Product;
  title: string;
  start: string;
  due: string;
  estimate: number;
  notes: string;
}

export const PLAN: PlanTask[] = [
  // ---------- Fases y organización ----------
  {
    product: 'ORG', title: 'Foro «Presentación de proyectos»', start: '2026-09-21', due: '2026-09-25', estimate: 1,
    notes: 'Compartir experiencia, inquietudes y disponibilidad en el foro de presentación (Fase 1).',
  },
  {
    product: 'ORG', title: 'Videoconferencia de análisis y valoración', start: '2026-10-01', due: '2026-10-03', estimate: 2,
    notes: 'Revisar con el consultor la planificación, los acuerdos grupales y la identidad de los participantes.',
  },
  {
    product: 'ORG', title: 'Acuerdos grupales', start: '2026-10-02', due: '2026-10-10', estimate: 3,
    notes: 'Documento de acuerdos del grupo con las disponibilidades de cada miembro como anexo. Consensuar nombre del grupo.',
  },
  {
    product: 'ORG', title: 'Google Site: crear, compartir, páginas personales e índice', start: '2026-10-05', due: '2026-10-24', estimate: 6,
    notes: 'Compartir con equipo y consultor. Página personal de cada miembro (presentación + 2 enlaces). Índice justificado, búsquedas compartidas (licencias CC) y planificación grupal.',
  },
  {
    product: 'ORG', title: 'Memoria digital: integrar los productos en el Google Site', start: '2026-10-26', due: '2026-12-23', estimate: 8,
    notes: 'Ir incorporando cada producto con capturas, justificación y bibliografía. Apartado de revisión y valoración grupal.',
  },
  {
    product: 'ORG', title: 'Valoración escrita del proyecto de otro grupo', start: '2026-12-21', due: '2026-12-26', estimate: 2,
    notes: 'Individual y asíncrona: interés, aplicabilidad y mejoras propuestas. Confirmar fecha en el aula.',
  },
  {
    product: 'ORG', title: 'Autoevaluación, coevaluación y entrega del Google Site', start: '2026-12-22', due: '2026-12-26', estimate: 2,
    notes: 'Tres entregas del aula con fecha 26 dic: Autoevaluación, Coevaluación y Compartir Google Sites del proyecto.',
  },
  {
    product: 'ORG', title: 'Preparar y hacer la defensa síncrona', start: '2026-12-19', due: '2026-12-26', estimate: 4,
    notes: 'Presentar proceso y resultado al consultor por videoconferencia y responder sus preguntas.',
  },

  // ---------- Producto 1 · FrontEnd con Angular (27 oct) ----------
  {
    product: 'P1', title: 'Entorno, repositorio P1 y planificación', start: '2026-10-03', due: '2026-10-06', estimate: 3,
    notes: 'Node, Git, Angular CLI. Repo GitHub propio del P1 compartido con equipo y consultor; node_modules en .gitignore. Etiquetas e hitos en GitHub.',
  },
  {
    product: 'P1', title: 'Mockup y ficha de arquetipo de usuario', start: '2026-10-05', due: '2026-10-10', estimate: 5,
    notes: 'Header, listado (≥5 jugadores), detalle, reproductor y buscador. Colores y tipografías. Rúbrica: 5 pts (mockup + planificación).',
  },
  {
    product: 'P1', title: 'PlayersComponent y datos locales', start: '2026-10-10', due: '2026-10-16', estimate: 6,
    notes: 'Array PLAYERS exportado como constante en fichero aparte. ngFor/ngIf, ≥5 campos y estilo de seleccionado. Rúbrica: 5 pts.',
  },
  {
    product: 'P1', title: 'DetailComponent y comunicación lista → detalle', start: '2026-10-14', due: '2026-10-20', estimate: 5,
    notes: '≥5 campos del jugador. @Input/@Output entre componentes. Botón para cerrar el detalle. Rúbrica: 5 pts.',
  },
  {
    product: 'P1', title: 'MediaComponent: reproductor con controles', start: '2026-10-17', due: '2026-10-23', estimate: 6,
    notes: 'Vídeo desde assets: play, pause, stop, barra de progreso y volumen. Rúbrica: 5 pts.',
  },
  {
    product: 'P1', title: 'Pipes de búsqueda y filtro', start: '2026-10-20', due: '2026-10-24', estimate: 4,
    notes: 'Pipe con ≥2 parámetros: texto de búsqueda + desplegable (posición/edad). Rúbrica: 5 pts.',
  },
  {
    product: 'P1', title: 'Documentación, CodeSandbox y entrega P1', start: '2026-10-23', due: '2026-10-27', estimate: 4,
    notes: 'PDF con enlaces GitHub y CodeSandbox (−2 pts si no compila). ZIP sin node_modules. producto1(FP067)_Apellido1Apellido2_Nombre.',
  },

  // ---------- Producto 2 · Firebase (17 nov) ----------
  {
    product: 'P2', title: 'Repo P2, correcciones del P1 y planificación', start: '2026-10-28', due: '2026-10-31', estimate: 3,
    notes: 'Nuevo repo para el P2. Aplicar feedback del consultor. Rotar Scrum Master. Planificar con responsable y estimación.',
  },
  {
    product: 'P2', title: 'Proyecto Firebase y colección de jugadores', start: '2026-10-30', due: '2026-11-04', estimate: 4,
    notes: '≥10 jugadores con todos los campos del P1. Permisos de lectura/escritura. Instalar @angular/fire. Rúbrica: 8 pts.',
  },
  {
    product: 'P2', title: 'Listado conectado a Firestore', start: '2026-11-03', due: '2026-11-09', estimate: 6,
    notes: 'Suscripción en tiempo real sustituyendo el array local. Icono de borrar en cada jugador. Rúbrica: 9 pts.',
  },
  {
    product: 'P2', title: 'Detalle editable y alta de jugadores con imagen y vídeo', start: '2026-11-07', due: '2026-11-14', estimate: 8,
    notes: 'Editar todos los campos; botón Nuevo con formulario y validación. Subir imagen y vídeo desde el ordenador (Storage). Rúbrica: 9 + 9 pts.',
  },
  {
    product: 'P2', title: 'Documentación, CodeSandbox y entrega P2', start: '2026-11-13', due: '2026-11-17', estimate: 4,
    notes: 'PDF con capturas, justificación y bibliografía + enlaces. ZIP sin node_modules. producto2(FP067)_Apellido1Apellido2_Nombre.',
  },

  // ---------- Producto 3 · React Native (8 dic) ----------
  {
    product: 'P3', title: 'Entorno React Native, repo P3 y mockup móvil', start: '2026-11-18', due: '2026-11-22', estimate: 4,
    notes: 'Nuevo repo. Mockup de 3 pantallas: listado, detalle y reproductor.',
  },
  {
    product: 'P3', title: 'Pantalla Inicio con FlatList conectada a Firebase', start: '2026-11-21', due: '2026-11-27', estimate: 6,
    notes: 'react-native-firebase, initializeApp y carga de todos los jugadores en un FlatList. Rúbrica: 6 pts.',
  },
  {
    product: 'P3', title: 'Detalle, multimedia y navegación Stack', start: '2026-11-26', due: '2026-12-04', estimate: 9,
    notes: 'Stack con 3 pantallas, botón atrás e inicio, menú con título y estilo. Detalle con zoom de imagen. Reproductor con ≥4 controles. Rúbrica: 6 + 6 + 7 pts.',
  },
  {
    product: 'P3', title: 'Documentación, CodeSandbox y entrega P3', start: '2026-12-03', due: '2026-12-08', estimate: 4,
    notes: 'PDF con capturas y bibliografía + enlaces. ZIP sin node_modules. producto3(FP067)_Apellido1Apellido2_Nombre.',
  },

  // ---------- Producto 4 · Notificaciones push (21 dic) ----------
  {
    product: 'P4', title: 'Push en la app móvil (Cloud Messaging)', start: '2026-12-09', due: '2026-12-14', estimate: 5,
    notes: 'Nuevo repo y correcciones del P3. App Android en Firebase, google-services.json, permisos y código en App.js. Rúbrica: 5 pts.',
  },
  {
    product: 'P4', title: 'Cloud Functions y push en la app Angular', start: '2026-12-13', due: '2026-12-18', estimate: 6,
    notes: 'Trigger onWrite/onUpdate que envía la notificación a Angular y React Native. Firebase Messaging en la web. Rúbrica: 5 + 5 pts.',
  },
  {
    product: 'P4', title: 'Documentación, CodeSandbox y entrega P4', start: '2026-12-17', due: '2026-12-21', estimate: 3,
    notes: 'PDF con capturas y bibliografía + enlaces. ZIP sin node_modules. producto4(FP067)_Apellido1Apellido2_Nombre.',
  },
];
