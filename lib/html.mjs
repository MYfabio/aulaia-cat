/**
 * Escapa un valor per posar-lo dins d'HTML escrit a ma (text o atribut entre
 * cometes). Les pagines de React ja ho fan soles; aixo es per a les respostes
 * que es munten amb una cadena, com la confirmacio de /api/verif.
 *
 * Sense "server-only" perque es pugui provar amb node tot sol.
 */
export function escaparHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
