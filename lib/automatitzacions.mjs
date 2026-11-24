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
    funcio: "Quan valides una sol·licitud, demana a l'app que crei el compte del docent i li enviï el correu d'accés. De moment, només Ullada.",
    estat: "actiu",
    motiu: "Encès el 24/11/2026. Només fa res quan valides una sol·licitud.",
    pagina: "/panel/altes",
  },
  {
    clau: "consum-ia",
    nom: "Consum d'IA",
    funcio: "Recollirà el consum d'IA de les apps.",
    estat: "apagat",
    motiu: "Encara no s'ha fet.",
    pagina: null,
  },
];

export function estatFlux(clau) {
  return FLUXOS.find(f => f.clau === clau)?.estat ?? null;
}
