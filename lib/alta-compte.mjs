/**
 * Alta de compte automàtica: quan es valida una sol·licitud al panell, l'app
 * crea el compte del docent i li envia el correu «ja tens compte»
 * (docs/alta-compte-automatica.md). Lògica pura: ni base de dades ni xarxa.
 *
 * El panell no escriu a la base de dades de cap app: envia una ordre signada
 * a n8n, i n8n la passa a l'app, que és qui decideix.
 */

/**
 * Apps que saben rebre l'ordre. Una app només hi pot entrar quan un docent
 * d'un altre centre hi pot entrar de debò (enllaç per correu, no només el
 * Google del centre de la instal·lació): si no, es crearia un compte inútil.
 * L'adreça de cada app viu al flux d'n8n, no aquí.
 */
export const APPS_ALTA_COMPTE = {
  ullada: { nom: "Ullada" },
  "enfonsar-la-flota": { nom: "Enfonsar la Flota" },
};

export function appAltaCompte(slug) {
  return Object.prototype.hasOwnProperty.call(APPS_ALTA_COMPTE, slug) ? APPS_ALTA_COMPTE[slug] : null;
}

const net = (v, max) => String(v ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, max);

/** Ordre que el panell envia a n8n a partir d'una sol·licitud validada. */
export function construirOrdreAlta(solicitud, ara = new Date()) {
  return {
    app: solicitud.app,
    id_alta: `alta-${solicitud.id}-${ara.getTime()}`,
    data: ara.toISOString(),
    centre: net(solicitud.centre, 120),
    idioma: solicitud.idioma === "es" ? "es" : "ca",
    usuari: { nom: net(solicitud.contacte_nom, 120), email: net(solicitud.contacte_email, 200).toLowerCase() },
  };
}

/**
 * Resum del que ha respost l'app, per al panell i per a la nota de la
 * sol·licitud. Sense correus ni noms.
 *   estat: "creat" | "ja-existia" | "sense-correu" | "error"
 */
export function resumResultat(nomApp, enviat) {
  if (!enviat?.ok) return { estat: "error", nota: `Compte a ${nomApp}: no s'ha pogut crear (${net(enviat?.error, 120) || "error"}).` };
  const r = enviat.resultat || {};
  if (r.resultat === "ja-existia") return { estat: "ja-existia", nota: `Compte a ${nomApp}: ja existia.` };
  if (r.resultat === "creat" || r.resultat === "reactivat") {
    return r.correu
      ? { estat: "creat", nota: `Compte a ${nomApp}: creat i correu d'accés enviat.` }
      : { estat: "sense-correu", nota: `Compte a ${nomApp}: creat, però el correu d'accés no ha sortit.` };
  }
  return { estat: "error", nota: `Compte a ${nomApp}: resposta no esperada de l'app.` };
}
