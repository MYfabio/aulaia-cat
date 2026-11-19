/**
 * Genera la clau amb que una app envia el seu informe d'activitat a aulaia.cat.
 *
 *   node scripts/activitat/nova-clau.mjs <slug>
 *
 * Escriu dues coses:
 *   - la CLAU, que va nomes a Railway, a les variables de l'APP (AULAIA_ACTIVITAT_CLAU);
 *   - l'EMPREMTA, que va a la variable ACTIVITAT_CLAUS d'aulaia.cat.
 * La clau no es desa enlloc mes: si es perd, se'n genera una altra i se
 * substitueixen les dues variables.
 */
import { randomBytes, createHash } from "node:crypto";
import { SLUG } from "../../lib/activitat.mjs";

const slug = process.argv[2];
if (!slug || !SLUG.test(slug)) {
  console.error("Cal l'slug de l'app, en minuscules i amb guions: node scripts/activitat/nova-clau.mjs dictats");
  process.exit(1);
}

const clau = randomBytes(32).toString("base64url");
const empremta = createHash("sha256").update(clau).digest("hex");

console.log(`
App: ${slug}

1. A Railway, a les variables del servei de l'APP:
   AULAIA_ACTIVITAT_CLAU=${clau}

2. A Railway, a les variables d'aulaia.cat, dins del JSON d'ACTIVITAT_CLAUS
   (si la variable no existeix, crea-la amb claus {} al voltant):
   "${slug}":"${empremta}"

La clau no es torna a mostrar. No la desis en cap fitxer del repositori.
`);
