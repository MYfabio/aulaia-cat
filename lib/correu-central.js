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

/** Adreça de treball de qui respon: les respostes a aquests correus li arriben a ell. */
const REPLY_FABIO = "fabio.martinez@escolaindustrial.org";

/**
 * Plantilles tancades. El servei no accepta assumpte ni cos lliures: si els
 * acceptes, qui et robi la clau te un rele per enviar el que vulgui des dels
 * teus dominis, i el domini acaba a les llistes negres. Afegir un tipus nou
 * obliga a tocar aquest fitxer, que es exactament el control que volem.
 */
const PLANTILLES = {
  "alta-verif": {
    replyTo: REPLY_FABIO,
    assumpte: c => c.es ? `Verifica tu dirección · ${c.nomApp}` : `Verifica la teva adreça · ${c.nomApp}`,
    text: c => c.es ? [
      `Hola${c.nom ? " " + c.nom : ""},`,
      "",
      `Hemos recibido la solicitud de acceso de ${c.centre || "tu centro"} a ${c.nomApp}.`,
      "Para confirmar que esta es tu dirección, pulsa el enlace de abajo:",
      "",
      c.enllac,
      "",
      "El enlace caduca en 48 horas. Si no habéis solicitado esta verificación, podéis ignorar este correo.",
      ...presentacio(c),
    ] : [
      `Hola${c.nom ? " " + c.nom : ""},`,
      "",
      `Hem rebut la sol·licitud d'accés de ${c.centre || "el teu centre"} a ${c.nomApp}.`,
      "Per confirmar que aquesta és la teva adreça, clica l'enllaç de sota:",
      "",
      c.enllac,
      "",
      "L'enllaç caduca en 48 hores. Si no heu sol·licitat aquesta verificació, podeu ignorar aquest correu.",
      ...presentacio(c),
    ],
  },
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
    replyTo: REPLY_FABIO,
    assumpte: c => c.es ? `Hemos recibido tu solicitud · ${c.nomApp}` : `Hem rebut la teva sol·licitud · ${c.nomApp}`,
    text: c => c.es ? [
      `Hola${c.nom ? " " + c.nom : ""},`,
      "",
      `Hemos recibido la solicitud de acceso de ${c.centre || "tu centro"} a ${c.nomApp}.`,
      "La revisamos y te respondemos a esta misma dirección. No hace falta que hagas nada más.",
      ...presentacio(c),
    ] : [
      `Hola${c.nom ? " " + c.nom : ""},`,
      "",
      `Hem rebut la sol·licitud d'accés de ${c.centre || "el teu centre"} a ${c.nomApp}.`,
      "La revisem i et responem a aquesta mateixa adreça. No cal que facis res més.",
      ...presentacio(c),
    ],
  },
  "alta-avis-intern": {
    // Respondre l'avis arriba a qui ha demanat l'alta, no a la bústia general.
    replyTo: c => /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(c.correu) ? c.correu : undefined,
    assumpte: c => `🔔 Alta nova: ${c.centre || "sense centre"} · ${c.nomApp}`,
    text: c => [
      `⚡ Sol·licitud nova per validar a ${c.nomApp}`,
      "",
      `Centre: ${c.centre || "—"}`,
      `Contacte: ${c.nom || "—"}`,
      `Email: ${c.correu || "—"}`,
      "",
      "🔗 Validar directament:",
      "https://www.aulaia.cat/panel/altes?estat=pendent",
      "",
      "Respon a aquest email o valida des del panel.",
    ],
  },
};

/**
 * Presentacio que tanca els correus d'alta: qui som, que fem i per que ens
 * interessa que el centre ens digui el que li falla o li falta.
 */
function presentacio(c) {
  return c.es ? [
    "",
    "—",
    "",
    "Quién soy y por qué te escribo",
    "",
    "Soy Fabio Martínez y trabajo en el Institut Escola Industrial de Sabadell, donde estamos desarrollando estas aplicaciones para el aula. Queremos crear aplicaciones funcionales y gratuitas para las escuelas públicas, hechas a partir de lo que pasa de verdad en clase.",
    "",
    "Por eso tu colaboración es importante: cualquier ayuda para mejorarlas o para detectar fallos nos sirve muchísimo. Si algo no funciona, si te falta algo o si se te ocurre una mejora, avísanos respondiendo a este correo o escribiéndome directamente:",
    "",
    REPLY_FABIO,
    "",
    "Gracias por probarlo.",
    "",
    "Fabio Martínez",
    "aulaia.cat",
  ] : [
    "",
    "—",
    "",
    "Qui soc i per què t'escric",
    "",
    "Soc en Fabio Martínez i treballo a l'Institut Escola Industrial de Sabadell, on estem desenvolupant aquestes aplicacions per a l'aula. Volem crear aplicacions funcionals i gratuïtes per a les escoles públiques, fetes a partir del que passa de debò a classe.",
    "",
    "Per això la teva col·laboració és important: qualsevol ajuda per millorar-les o per detectar errors ens va molt bé. Si alguna cosa no funciona, si et falta res o si se't acut una millora, avisa'ns responent aquest correu o escrivint-me directament:",
    "",
    REPLY_FABIO,
    "",
    "Gràcies per provar-ho.",
    "",
    "Fabio Martínez",
    "aulaia.cat",
  ];
}

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
    es: dades.idioma === "es",
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
      replyTo: typeof plantilla.replyTo === "function" ? plantilla.replyTo(context) : plantilla.replyTo,
    });
    return { ok: true };
  } catch (e) {
    // El detall va al registre i no a qui ha cridat: pot portar informacio del
    // compte de Resend.
    console.error("Correu central: " + e.message);
    return { ok: false, motiu: "proveidor" };
  }
}
