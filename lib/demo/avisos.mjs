// Demo dels avisos del panell: dades inventades, sense base de dades ni serveis.
import { resumAvisos } from "../avisos.mjs";

const MINUT = 60 * 1000;
const HORA = 60 * MINUT;

/** Avisos d'exemple, en minuts enrere respecte d'ara. */
const EXEMPLES = [
  { app: "fpsegura", tipus: "alta.solicitud", centre: "CENTRE-DEMO-01", fa: 14 },
  { app: "la-claqueta", tipus: "alta.validada", centre: "CENTRE-DEMO-02", fa: 95 },
  { app: "poetes-vives", tipus: "rol.canvi", centre: "CENTRE-DEMO-01", fa: 180 },
  { app: "dictats", tipus: "alta.solicitud", centre: "CENTRE-DEMO-03", fa: 7 * 60 },
  { app: "poetes-vives", tipus: "error", centre: null, fa: 26 * HORA },
  { app: "fpsegura", tipus: "rol.canvi", centre: "CENTRE-DEMO-02", fa: 2 * 24 * HORA },
  { app: "dictats", tipus: "alta.validada", centre: "CENTRE-DEMO-03", fa: 3 * 24 * HORA },
  { app: "la-claqueta", tipus: "error", centre: null, fa: 5 * 24 * HORA },
];

export function llegirAvisos(_opcions = {}, ara = new Date()) {
  const esdeveniments = EXEMPLES.map((e, i) => ({
    id: i + 1,
    app: e.app,
    tipus: e.tipus,
    centre: e.centre,
    quan: new Date(ara.getTime() - e.fa * MINUT),
  }));
  return { disponible: true, llegit: ara, ...resumAvisos(esdeveniments) };
}
