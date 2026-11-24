// Demo dels avisos del panell: dades inventades, sense base de dades ni serveis.
import { resumAvisos } from "../avisos.mjs";

const MINUT = 60 * 1000;
const HORA = 60 * MINUT;

/** Avisos d'exemple, en minuts enrere respecte d'ara. */
const EXEMPLES = [
  // Dominis inventats: la demo no ha d'ensenyar el domini real de cap centre.
  { app: "fpsegura", tipus: "alta.validada", centre: "institut-demo.cat", fa: 14 },
  { app: "la-claqueta", tipus: "alta.validada", centre: "institut-demo.cat", fa: 95 },
  { app: "poetes-vives", tipus: "rol.canvi", centre: "escola-demo.cat", fa: 180 },
  { app: "dictats", tipus: "alta.solicitud", centre: "escola-demo.cat", fa: 7 * 60 },
  { app: "poetes-vives", tipus: "error", centre: null, fa: 26 * HORA },
  { app: "fpsegura", tipus: "rol.canvi", centre: "institut-demo.cat", fa: 2 * 24 * HORA },
  { app: "dictats", tipus: "alta.validada", centre: "escola-demo.cat", fa: 3 * 24 * HORA },
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
