// Demo de les altes en lot: res s'envia de debo. Dades inventades, sense xarxa.

/** A la demo, l'enviament simula un lot correcte amb el recompte de les files bones. */
export async function enviarOrdre(ordre) {
  const total = ordre.usuaris.length;
  return {
    ok: true,
    resultat: {
      id_lot: ordre.id_lot,
      total,
      altes: total,
      ja_existents: 0,
      errors: [],
    },
  };
}

export function teConfiguracio() {
  return true;
}
