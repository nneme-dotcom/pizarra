import { Product, Status } from './model';

/**
 * Plan inicial del proyecto FP.451 (VBE Eagles Echternach, proyecto individual),
 * sacado de los enunciados de las fases, de los productos y de sus rúbricas.
 * Se carga una sola vez desde la app (botón «Cargar plan del proyecto») cuando la
 * colección está vacía; a partir de ahí todo se edita desde la propia Pizarra.
 *
 * Estados iniciales: las tareas de código del P1 ya terminadas van como «Hecho»;
 * el resto empieza en «Por hacer» y se actualiza desde la app.
 */
export interface PlanTask {
  product: Product;
  title: string;
  start: string;
  due: string;
  estimate: number;
  status?: Status;
  milestone?: boolean;
  rubric?: string;
  notes: string;
}

export const PLAN: PlanTask[] = [
  // ---------- Fases del aula y memoria digital ----------
  {
    product: 'ORG', title: 'Fase 1 · Planteamiento, requisitos y presentación', start: '2026-09-21', due: '2026-10-03', estimate: 4,
    notes: 'Foro de presentación con experiencia y disponibilidad. Proyecto individual: el rol de coordinador lo asume el único integrante.',
  },
  {
    product: 'ORG', title: 'Acuerdos de trabajo (adaptados a proyecto individual)', start: '2026-10-01', due: '2026-10-10', estimate: 2,
    notes: 'Documento de acuerdos con la disponibilidad (15 h/semana, horario rotativo) como anexo.',
  },
  {
    product: 'ORG', title: 'Google Site: presentación, índice, búsquedas y planificación', start: '2026-10-05', due: '2026-10-24', estimate: 6,
    notes: 'Fase 2: los cinco apartados mínimos (presentación, índice justificado, búsquedas compartidas con licencias, planificación y revisión). Compartir con el consultor.',
  },
  {
    product: 'ORG', title: 'Pizarra: línea temporal, tablero y acceso del consultor', start: '2026-10-15', due: '2026-10-25', estimate: 5, status: 'doing',
    rubric: 'P1 · Mockup y planificación (5 pts)',
    notes: 'Herramienta propia que sustituye a Trello: Angular + Bootstrap + Firestore, login de Google y lectura para el consultor. Desplegada en Firebase Hosting.',
  },
  {
    product: 'ORG', title: 'Videoconferencia de revisión de la planificación', start: '2026-10-26', due: '2026-10-31', estimate: 2,
    notes: 'Cierre de la fase 2: revisar planificación y estructura con el consultor. Los acuerdos se reflejan en la memoria.',
  },
  {
    product: 'ORG', title: 'Revisión y valoración de la planificación', start: '2026-10-26', due: '2026-11-07', estimate: 2,
    notes: 'Grado de cumplimiento de la planificación (estimado frente a real) y reajustes justificados. Página en el Google Site.',
  },
  {
    product: 'ORG', title: 'Fase 3 · Memoria digital: integrar los productos', start: '2026-10-28', due: '2026-12-23', estimate: 10,
    notes: 'Versión casi definitiva del Google Site: introducción, índice, productos con capturas, bibliografía, webgrafía y anexos de propiedad intelectual.',
  },
  {
    product: 'ORG', title: 'Defensa, autoevaluación y entrega del Google Site', start: '2026-12-19', due: '2026-12-26', estimate: 5, milestone: true,
    notes: 'Defensa síncrona con el consultor, autoevaluación y entrega final del Google Site. Confirmar fechas en el aula.',
  },

  // ---------- Producto 1 · Front-end con Angular (27 oct) ----------
  {
    product: 'P1', title: 'Entorno y proyecto Angular 22 con Bootstrap', start: '2026-10-06', due: '2026-10-10', estimate: 3, status: 'done',
    notes: 'Node, Git, Angular CLI. Proyecto standalone y zoneless con Bootstrap 5 e identidad visual del club.',
  },
  {
    product: 'P1', title: 'Repositorio GitHub con etiquetas e hitos', start: '2026-10-20', due: '2026-10-24', estimate: 2,
    rubric: 'P1 · Mockup y planificación (5 pts)',
    notes: 'Repo propio del P1 compartido con el consultor, .gitignore con node_modules, commits frecuentes, etiquetas e hitos (milestones).',
  },
  {
    product: 'P1', title: 'Mockup de las 3 zonas y ficha de arquetipo', start: '2026-10-19', due: '2026-10-24', estimate: 4,
    rubric: 'P1 · Mockup y planificación (5 pts)',
    notes: 'Esqueleto de listado, detalle y reproducción con colores y tipografías del producto final. Capturas y justificación en el documento.',
  },
  {
    product: 'P1', title: 'PlayersComponent: listado y datos en fichero aparte', start: '2026-10-10', due: '2026-10-14', estimate: 5, status: 'done',
    rubric: 'P1 · Componente listado (5 pts)',
    notes: 'Constante exportada con 6 jugadores, ≥5 campos visibles y estilo de seleccionado.',
  },
  {
    product: 'P1', title: 'DetailComponent y comunicación entre componentes', start: '2026-10-12', due: '2026-10-16', estimate: 4, status: 'done',
    rubric: 'P1 · Componente detalle (5 pts)',
    notes: 'input()/output() de Angular, ≥5 campos y botón para cerrar el detalle.',
  },
  {
    product: 'P1', title: 'MediaComponent: reproductor con controles', start: '2026-10-13', due: '2026-10-16', estimate: 5, status: 'done',
    rubric: 'P1 · Reproductor (5 pts)',
    notes: 'Play, pause, stop, barra de progreso y volumen sobre el vídeo del jugador seleccionado.',
  },
  {
    product: 'P1', title: 'Pipe de filtrado: nombre, posición y edad', start: '2026-10-14', due: '2026-10-16', estimate: 3, status: 'done',
    rubric: 'P1 · Pipes de búsqueda (5 pts)',
    notes: 'Pipe propio con ≥2 parámetros: texto y desplegable de posición (además, edad).',
  },
  {
    product: 'P1', title: 'Comprobar que compila en CodeSandbox', start: '2026-10-22', due: '2026-10-25', estimate: 1,
    rubric: 'Requisito de entrega (−2 pts si falla)',
    notes: 'Importar el repo en CodeSandbox y verificar que arranca.',
  },
  {
    product: 'P1', title: 'Documento PDF y entrega del P1', start: '2026-10-23', due: '2026-10-27', estimate: 4, milestone: true,
    notes: 'Explicación de cada apartado con capturas, justificación y bibliografía + enlaces GitHub y CodeSandbox. ZIP sin node_modules. producto1(FP067)_Apellido1Apellido2_Nombre.',
  },

  // ---------- Producto 2 · Persistencia en Firebase (17 nov) ----------
  {
    product: 'P2', title: 'Repo P2, feedback del P1 y planificación', start: '2026-10-28', due: '2026-10-31', estimate: 2,
    notes: 'Nuevo repositorio para el P2. Aplicar las correcciones del consultor. Planificar tareas y estimaciones en Pizarra.',
  },
  {
    product: 'P2', title: 'Proyecto Firebase y colección de 10 jugadores', start: '2026-10-30', due: '2026-11-04', estimate: 4,
    rubric: 'P2 · Base de datos Firebase',
    notes: '≥10 jugadores con todos los campos del P1, reglas de lectura/escritura y SDK de Firebase en Angular.',
  },
  {
    product: 'P2', title: 'Listado en tiempo real y borrado', start: '2026-11-03', due: '2026-11-08', estimate: 6,
    rubric: 'P2 · Listado conectado',
    notes: 'onSnapshot de Firestore en lugar del array local. Icono de borrar en cada jugador.',
  },
  {
    product: 'P2', title: 'Detalle editable y alta de jugadores', start: '2026-11-06', due: '2026-11-12', estimate: 7,
    rubric: 'P2 · Edición y alta',
    notes: 'Editar todos los campos; botón Nuevo con formulario reactivo y validación.',
  },
  {
    product: 'P2', title: 'Subida de imagen y vídeo (Storage)', start: '2026-11-09', due: '2026-11-14', estimate: 6,
    rubric: 'P2 · Multimedia',
    notes: 'Subir foto y vídeo desde el ordenador. Ojo: Storage puede requerir el plan Blaze de Firebase.',
  },
  {
    product: 'P2', title: 'Documento PDF y entrega del P2', start: '2026-11-13', due: '2026-11-17', estimate: 4, milestone: true,
    notes: 'PDF con capturas, justificación y bibliografía + enlaces. ZIP sin node_modules. producto2(FP067)_Apellido1Apellido2_Nombre.',
  },

  // ---------- Producto 3 · Interfaz móvil React Native (8 dic) ----------
  {
    product: 'P3', title: 'Entorno React Native, repo P3 y mockup móvil', start: '2026-11-18', due: '2026-11-22', estimate: 4,
    notes: 'Nuevo repositorio. Mockup de 3 pantallas: listado, detalle y reproductor.',
  },
  {
    product: 'P3', title: 'Pantalla Inicio con FlatList y Firebase', start: '2026-11-21', due: '2026-11-27', estimate: 6,
    rubric: 'P3 · Listado (6 pts)',
    notes: 'Inicializar Firebase y cargar todos los jugadores en un FlatList.',
  },
  {
    product: 'P3', title: 'Navegación Stack y pantalla de detalle', start: '2026-11-26', due: '2026-12-01', estimate: 6,
    rubric: 'P3 · Navegación y detalle (6 + 6 pts)',
    notes: 'Stack con 3 pantallas, botón atrás e inicio, cabecera con título. Detalle con zoom de imagen.',
  },
  {
    product: 'P3', title: 'Reproductor móvil con 4 controles', start: '2026-11-30', due: '2026-12-04', estimate: 5,
    rubric: 'P3 · Reproductor (7 pts)',
    notes: 'Vídeo del jugador con al menos 4 controles.',
  },
  {
    product: 'P3', title: 'Pizarra: vista móvil en React Native', start: '2026-11-25', due: '2026-12-06', estimate: 4,
    notes: 'Mejora opcional: versión móvil de la Pizarra (roadmap y tareas pendientes) con el mismo stack del P3.',
  },
  {
    product: 'P3', title: 'Documento PDF y entrega del P3', start: '2026-12-03', due: '2026-12-08', estimate: 4, milestone: true,
    notes: 'PDF con capturas y bibliografía + enlaces. ZIP sin node_modules. producto3(FP067)_Apellido1Apellido2_Nombre.',
  },

  // ---------- Producto 4 · Notificaciones push (21 dic) ----------
  {
    product: 'P4', title: 'Push en la app móvil (Cloud Messaging)', start: '2026-12-09', due: '2026-12-14', estimate: 5,
    rubric: 'P4 · Push en React Native (5 pts)',
    notes: 'App Android en Firebase, google-services.json y permisos de notificación.',
  },
  {
    product: 'P4', title: 'Cloud Functions y push en Angular', start: '2026-12-12', due: '2026-12-17', estimate: 6,
    rubric: 'P4 · Function + push web (5 + 5 pts)',
    notes: 'Trigger de Firestore (v2: onDocumentWritten) que envía la notificación. Requiere plan Blaze.',
  },
  {
    product: 'P4', title: 'Pizarra: aviso push al consultor al cerrar un hito', start: '2026-12-14', due: '2026-12-18', estimate: 3,
    notes: 'Mejora opcional: reutilizar la Function del P4 para notificar cuando un hito pase a «Hecho».',
  },
  {
    product: 'P4', title: 'Documento PDF y entrega del P4', start: '2026-12-17', due: '2026-12-21', estimate: 3, milestone: true,
    notes: 'PDF con capturas y bibliografía + enlaces. ZIP sin node_modules. producto4(FP067)_Apellido1Apellido2_Nombre.',
  },
];
