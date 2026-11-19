/**
 * Sessio del panell: cookie signada amb HMAC-SHA256.
 * Fem servir Web Crypto perque el middleware corre a l Edge runtime.
 *
 * Hi ha dos rols:
 *   - "admin": qui entra amb PANEL_PASSWORD. Veu les dades reals.
 *   - "demo":  qui entra amb PANEL_DEMO_PASSWORD. Veu el mateix panell amb dades
 *              inventades (lib/demo) i no pot desar ni enviar res.
 * El rol va dins del text signat, aixi que una sessio de demo no es pot
 * convertir en una d administrador.
 */

const COOKIE = "panel_session";
const MAX_AGE = 60 * 60 * 12; // 12 hores

/** Una contrasenya de demo mes curta que aixo no s accepta. */
const MINIM_CLAU_DEMO = 8;

function b64url(bytes) {
  let s = "";
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(payload, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return b64url(mac);
}

/** Comparacio en temps constant, per no filtrar informacio pel temps de resposta. */
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * La contrasenya de la demo, o null si la demo esta apagada. Sense la variable
 * no hi ha demo. Tampoc si es massa curta o si es la mateixa que la de
 * l administrador: en aquest cas mana l administrador i la demo no existeix.
 */
export function clauDemoConfigurada(env = process.env) {
  const clau = env.PANEL_DEMO_PASSWORD;
  if (typeof clau !== "string" || clau.length < MINIM_CLAU_DEMO) return null;
  if (clau === env.PANEL_PASSWORD) return null;
  return clau;
}

/**
 * Empremta de la contrasenya de demo que viatja dins de la sessio: si es canvia
 * o es treu PANEL_DEMO_PASSWORD, totes les sessions de demo obertes deixen de
 * valer a l instant, sense esperar que caduquin.
 */
async function empremtaDemo(clauDemo, secret) {
  return (await sign("clau-demo:" + clauDemo, secret)).slice(0, 16);
}

export async function createSessionValue(secret, rol = "admin", clauDemo = null) {
  const exp = Date.now() + MAX_AGE * 1000;
  let payload = String(exp);
  if (rol === "demo") {
    if (!clauDemo) throw new Error("La demo no esta configurada");
    payload = `demo.${exp}.${await empremtaDemo(clauDemo, secret)}`;
  }
  return `${payload}.${await sign(payload, secret)}`;
}

const viu = text => Number(text) > Date.now();

/**
 * Qui hi ha darrere d una cookie: "admin", "demo" o null.
 * @param {string|undefined} value     valor de la cookie
 * @param {string|undefined} secret    PANEL_SECRET
 * @param {string|null} [clauDemo]     el que torna clauDemoConfigurada()
 */
export async function rolDeSessio(value, secret, clauDemo = null) {
  if (!value || !secret) return null;
  const dot = value.lastIndexOf(".");
  if (dot < 1) return null;
  const payload = value.slice(0, dot);
  const mac = value.slice(dot + 1);
  const expected = await sign(payload, secret);
  if (!safeEqual(mac, expected)) return null;

  // Administrador: el text signat es nomes la data de caducitat.
  if (/^\d{1,16}$/.test(payload)) return viu(payload) ? "admin" : null;

  const m = payload.match(/^demo\.(\d{1,16})\.([A-Za-z0-9_-]{16})$/);
  if (!m || !viu(m[1]) || !clauDemo) return null;
  return safeEqual(m[2], await empremtaDemo(clauDemo, secret)) ? "demo" : null;
}

/** Nomes es certa per a l administrador: una sessio de demo no la passa. */
export async function isValidSession(value, secret) {
  return (await rolDeSessio(value, secret)) === "admin";
}

export const COOKIE_NAME = COOKIE;
export const COOKIE_MAX_AGE = MAX_AGE;
