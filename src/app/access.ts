/**
 * Cuentas de Google con permiso de edición. Debe coincidir con isOwner() de firestore.rules.
 * El consultor no va aquí: se invita desde la app (botón «Compartir»), con acceso de solo lectura.
 */
export const OWNER_EMAILS = ['nneme@uoc.edu', 'nadirneme@gmail.com'];
