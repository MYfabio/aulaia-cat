import "server-only";
import apps from "../data/apps.json";
import { enviarCorreu } from "./correu";

/**
 * Correu transaccional per a la resta d apps del cataleg.
 *
 * Per que centralitzat: Resend nomes verifica 3 dominis al pla gratuit i
 * nosaltres en tenim vuit. Amb un sol domini verificat aqui, i totes les apps
 * cridant aquest servei, el limit deixa de ser un problema i hi ha un sol lloc
 * on arreglar l entregabilitat (SPF, DKIM, DMARC i reputacio). Reaprofita
 * `enviarCorreu`, que ja es el que fa servir la safata d altes.
 *
 * Que NO es: un servei d avisos. Nomes correu d identitat — enllaç d acces,
 * confirmacio d alta, avis al coordinador. Els recordatoris d aula van per
 * Classroom o dins de l app, i mai a l alumnat: sovint son menors i el
 * responsable de les seves dades es el centre, no nosaltres. Barrejar-hi
 * avisos massius tambe posaria en risc la reputacio del domini del qual depen
 * poder entrar a les apps.
 */

export function potEnviar() {
  return !!process.env.RESEND_API_KEY;
}

/**
 * Plantilles tancades. El servei no accepta assumpte ni cos lliures: si els
 * acceptes, qui et robi la clau te un rele per enviar el que vulgui des dels
 * teus dominis, i el domini acaba a les llistes negres. Afegir un tipus nou
 * obliga a tocar aquest fitxer, que es exactament el control que volem.
 */
const PLANTILLES = {
  "enllac-acces": {
    assumpte: c => `El teu enllaç d'accés a ${c.nomApp}`,
    text: c => [
      "Hola,",
      "",
      `Aquest és l'enllaç per entrar a ${c.nomApp}. Caduca aviat i només es pot fer servir una vegada.`,
      "",
      c.enllac,
      "",
      "Si no has demanat entrar, no cal que facis res: sense obrir l'enllaç no passa res.",
    ],
  },
  "alta-rebuda": {
    assumpte: c => `Hem rebut la teva sol·licitud · ${c.nomApp}`,
    text: c => [
      `Hola${c.nom ? " " + c.nom : ""},`,
      "",
      `Hem rebut la sol·licitud d'accés de ${c.centre || "el teu centre"} a ${c.nomApp}.`,
      "La revisem i et responem a aquesta mateixa adreça. No cal que facis res més.",
      "",
      "Fabio Martínez",
      "aulaia.cat",
    ],
  },
  "alta-avis-intern": {
    assumpte: c => `Alta nova: ${c.centre || "sense centre"} · ${c.nomApp}`,
    text: c => [
      `Sol·licitud nova des de ${c.nomApp}.`,
      "",
      `Centre: ${c.centre || "—"}`,
      `Contacte: ${c.nom || "—"} <${c.correu || "—"}>`,
      "",
      "Safata d'altes: https://www.aulaia.cat/panel/altes",
    ],
  },
};

export const TIPUS_VALIDS = Object.keys(PLANTILLES);

/** Nom public de l app, tret del cataleg: aixi el correu no menteix mai. */
function nomApp(slug) {
  return apps.find(a => a.slug === slug)?.nom || "aulaia.cat";
}

/**
 * Els valors venen d altres apps. Van dins d un correu de text pla, aixi que
 * el risc no es HTML sino injectar linies que semblin capçaleres o allargar
 * el missatge sense limit.
 */
function net(valor, maxim = 120) {
  return String(valor ?? "")
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, maxim);
}

/**
 * @param {{tipus: string, per: string, app?: string, dades?: object}} peticio
 * @returns {Promise<{ok: boolean, motiu?: string}>}
 */
export async function enviarTransaccional({ tipus, per, app, dades = {} }) {
  if (!potEnviar()) return { ok: false, motiu: "sense-configurar" };

  const plantilla = PLANTILLES[tipus];
  if (!plantilla) return { ok: false, motiu: "tipus-desconegut" };

  if (typeof per !== "string" || !/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(per)) {
    return { ok: false, motiu: "adreca-invalida" };
  }

  const context = {
    nomApp: nomApp(app),
    nom: net(dades.nom),
    centre: net(dades.centre),
    correu: net(dades.correu),
    // L enllaç d acces es llarg per naturalesa i ha d arribar sencer.
    enllac: net(dades.enllac, 500),
  };

  try {
    await enviarCorreu({
      to: per,
      subject: plantilla.assumpte(context),
      text: plantilla.text(context).join("\n"),
    });
    return { ok: true };
  } catch (e) {
    // El detall va al registre i no a qui ha cridat: pot portar informacio del
    // compte de Resend.
    console.error("Correu central: " + e.message);
    return { ok: false, motiu: "proveidor" };
  }
}
