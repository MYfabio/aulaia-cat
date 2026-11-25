/**
 * Fluxos d'n8n que el panell ensenya a «Automatitzacions».
 * La informació és fixa i es revisa a mà: el panell no llegeix l'estat en directe
 * d'n8n (no té la seva clau). Cada vegada que es canvia un flux, cal actualitzar-la aquí.
 */
export const ESTATS_FLUX = {
  actiu: { text: "Encès", cls: "ok" },
  apagat: { text: "Apagat", cls: "off" },
};

export const FLUXOS = [
  {
    clau: "avisos",
    nom: "Avisos de les apps",
    funcio: "Quan una app dona d'alta algú, ho apunta a la pàgina d'Avisos.",
    estat: "actiu",
    motiu: "Encès el 23/11/2026.",
    pagina: "/panel/avisos",
  },
  {
    clau: "altes-lot",
    nom: "Altes en lot",
    funcio: "Passa a El Pla Lector la llista d'usuaris que confirmes al panell.",
    estat: "actiu",
    motiu: "Encès el 23/11/2026. Només fa res quan confirmes un lot.",
    pagina: "/panel/altes-lot",
  },
  {
    clau: "alta-compte",
    nom: "Alta de compte en validar",
    funcio: "Quan valides una sol·licitud, demana a l'app que crei el compte del docent i li enviï el correu d'accés. Funciona a Ullada, Enfonsar la Flota, AulaAcull, FPSegura i La Claqueta (aquesta, només amb correus del domini de Google del centre).",
    estat: "actiu",
    motiu: "Encès el 24/11/2026. Només fa res quan valides una sol·licitud.",
    pagina: "/panel/altes",
  },
  {
    clau: "vigilancia",
    nom: "Vigilància de les apps",
    funcio: "Cada 5 minuts mira si aulaia.cat i les apps en producció responen. Si una cau o torna, envia un correu i ho apunta a Avisos.",
    estat: "actiu",
    motiu: "Encès el 24/11/2026. Avisa després de dues fallades seguides.",
    pagina: "/panel/avisos?origen=sense",
  },
  {
    clau: "publicacions",
    nom: "Comprovació de publicacions",
    funcio: "Cada 5 minuts mira l'última publicació de cada app a Railway. Si ha fallat, s'ha encallat o la web nova no respon, envia un correu i ho apunta a Avisos.",
    estat: "actiu",
    motiu: "Encès el 24/11/2026. No avisa de les publicacions que van bé.",
    pagina: "/panel/avisos?origen=sense",
  },
  {
    clau: "fallades-ia",
    nom: "Fallades d'IA",
    funcio: "Cada 10 minuts compta els avisos d'error de la IA de les apps. Si una app en té 3 o més en una hora, envia un correu que diu si és la quota del dia, la del minut, el model o un altre problema.",
    estat: "actiu",
    motiu: "Encès el 24/11/2026. Com a molt un correu cada 6 hores per app i motiu.",
    pagina: "/panel/avisos?origen=sense",
  },
  {
    clau: "resum-setmanal",
    nom: "Resum setmanal",
    funcio: "Cada dilluns a les 8:00 envia un correu amb la setmana anterior: caigudes, publicacions amb problemes, altes, errors i despesa.",
    estat: "actiu",
    motiu: "Encès el 25/11/2026. Mai porta noms ni correus de persones.",
    pagina: null,
  },
  {
    clau: "consum-ia",
    nom: "Consum d'IA",
    funcio: "Retirat: el consum d'IA de cada app arriba amb l'informe d'activitat (/panel/activitat).",
    estat: "apagat",
    motiu: "Substituït per l'informe d'activitat el 24/11/2026.",
    pagina: "/panel/activitat",
  },
];

export function estatFlux(clau) {
  return FLUXOS.find(f => f.clau === clau)?.estat ?? null;
}
