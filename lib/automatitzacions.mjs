/**
 * Fluxos d'n8n que el panell ensenya a «Automatitzacions».
 * La informació és fixa i es revisa a ma: el panell no llegeix l'estat en directe
 * d'n8n (no té la seva clau). Cada vegada que es canvia un flux, cal actualitzar-la aquí.
 */
export const ESTATS_FLUX = {
  actiu: { text: "Actiu", cls: "ok" },
  apagat: { text: "Apagat", cls: "off" },
};

export const FLUXOS = [
  {
    clau: "avisos",
    nom: "Avisos aulaia (esdeveniments)",
    funcio: "Rep els avisos de les apps (altes, canvis de rol i errors) i els guarda perquè es vegin a la pàgina d'Avisos.",
    estat: "apagat",
    motiu: "Encara no hi ha apps que enviïn avisos. S'activa quan s'hagi connectat la primera app.",
    pagina: "/panel/avisos",
  },
  {
    clau: "altes-lot",
    nom: "Altes en lot (panell → Pla Lector)",
    funcio: "Rep una llista d'usuaris des del panell, comprova la firma i la passa a El Pla Lector.",
    estat: "apagat",
    motiu: "S'activa només per enviar un lot que l'administració confirmi.",
    pagina: "/panel/altes-lot",
  },
  {
    clau: "consum-ia",
    nom: "Consum d'IA (desactivat)",
    funcio: "Rep el consum d'IA de les apps. De moment no guarda res.",
    estat: "apagat",
    motiu: "Encara no es guarda el consum d'IA. Es decidirà quan hi hagi dades reals.",
    pagina: null,
  },
];

export function estatFlux(clau) {
  return FLUXOS.find(f => f.clau === clau)?.estat ?? null;
}
