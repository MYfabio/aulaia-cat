/**
 * Avisos que n8n guarda a aulaia_estat i que el panell ensenya a «Avisos».
 * Lògica pura, sense base de dades: la fan servir la font real i la demo.
 */

/** Quins tipus d'esdeveniment són un aviso del panell, i com es diu cada grup. */
export const GRUPS = [
  { clau: "altes", titol: "Altes de centres", tipus: ["alta.solicitud", "alta.validada"] },
  { clau: "rols", titol: "Canvis de rol", tipus: ["rol.canvi"] },
  { clau: "errors", titol: "Errors", tipus: ["error"] },
];

const TEXT_TIPUS = {
  "alta.solicitud": "Nova alta",
  "alta.validada": "Alta validada",
  "rol.canvi": "Canvi de rol",
  error: "Error",
};

/** Grup d'un tipus, o null si el tipus no és dels que mostra el panell. */
export function grupDe(tipus) {
  return GRUPS.find(g => g.tipus.includes(tipus))?.clau ?? null;
}

export function textTipus(tipus) {
  return TEXT_TIPUS[tipus] || tipus;
}

/**
 * D'una llista d'esdeveniments, deixa només els avisos del panell i en fa els
 * comptadors per grup. Ni el detall ni les dades personals surten del servidor:
 * només app, centre, tipus i moment.
 */
export function resumAvisos(esdeveniments) {
  const avisos = esdeveniments
    .filter(e => grupDe(e.tipus))
    .map(e => ({
      id: e.id,
      quan: e.quan instanceof Date ? e.quan.toISOString() : e.quan,
      app: e.app,
      tipus: e.tipus,
      tipusText: textTipus(e.tipus),
      grup: grupDe(e.tipus),
      centre: e.centre || null,
    }));
  const perGrup = Object.fromEntries(GRUPS.map(g => [g.clau, avisos.filter(a => a.grup === g.clau).length]));
  return { total: avisos.length, perGrup, avisos };
}
