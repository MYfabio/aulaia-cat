import "server-only";
import crypto from "node:crypto";
import apps from "../data/apps.json";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://searchconsole.googleapis.com/webmasters/v3";
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

/**
 * Autenticacio amb un compte de servei, no amb OAuth d usuari.
 * Un compte de servei no caduca ni obre finestres de consentiment: el panell
 * consulta pel seu compte i no depen de qui hi hagi assegut al navegador.
 */
export function teClaus() {
  return !!(process.env.GOOGLE_SA_EMAIL && process.env.GOOGLE_SA_PRIVATE_KEY);
}

function clauPrivada() {
  // Segons com s hagi enganxat la variable, els salts de linia poden arribar
  // escapats (una barra i una ena, dos caracters) o com a salts de veritat.
  // Acceptem les dues formes: si no en troba cap d escapat, el valor ja es bo.
  const escapat = String.fromCharCode(92) + "n";
  return process.env.GOOGLE_SA_PRIVATE_KEY.split(escapat).join("\n");
}

/**
 * Base64url. Ha d acceptar tres coses: l objecte de la capçalera i el del cos,
 * que van a JSON, i el buffer cru de la firma. Si el buffer passa per
 * JSON.stringify surt {"type":"Buffer","data":[...]} i Google respon
 * "Invalid JWT Signature", que no diu enlloc que el problema sigui aquest.
 */
const b64 = v => {
  const buf = Buffer.isBuffer(v)
    ? v
    : Buffer.from(typeof v === "string" ? v : JSON.stringify(v));
  return buf.toString("base64url");
};

let cacheToken = null;

async function token() {
  if (cacheToken && cacheToken.expira > Date.now() + 60_000) return cacheToken.valor;

  const ara = Math.floor(Date.now() / 1000);
  const cap = b64({ alg: "RS256", typ: "JWT" });
  const cos = b64({
    iss: process.env.GOOGLE_SA_EMAIL,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: ara,
    exp: ara + 3600,
  });
  const firma = crypto.createSign("RSA-SHA256").update(`${cap}.${cos}`).sign(clauPrivada());
  const jwt = `${cap}.${cos}.${b64(firma)}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Google no ha donat el testimoni (${res.status}): ${t.slice(0, 180)}`);
  }
  const dades = await res.json();
  cacheToken = { valor: dades.access_token, expira: Date.now() + dades.expires_in * 1000 };
  return cacheToken.valor;
}

async function api(ruta, cos) {
  const res = await fetch(`${API}${ruta}`, {
    method: cos ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${await token()}`,
      ...(cos ? { "Content-Type": "application/json" } : {}),
    },
    body: cos ? JSON.stringify(cos) : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Search Console ha respost ${res.status}: ${t.slice(0, 180)}`);
  }
  return res.json();
}

const dia = d => new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);

/** Nom bonic per a una propietat, si la reconeixem al cataleg. */
function nomDe(siteUrl) {
  const host = siteUrl.replace(/^sc-domain:/, "").replace(/^https?:\/\//, "").replace(/\/$/, "").replace(/^www\./, "");
  const app = apps.find(a => a.domini === host);
  return { nom: app?.nom || host, host, slug: app?.slug || null };
}

/**
 * Els dos ultims dies solen venir incomplets perque Google encara els processa,
 * i comparar-los amb dies tancats fa pensar que el trafic ha caigut.
 */
const DESFASAMENT = 3;

export async function getSeoData(dies = 28) {
  const inici = dia(dies + DESFASAMENT);
  const fi = dia(DESFASAMENT);
  const anteriorInici = dia(dies * 2 + DESFASAMENT);
  const anteriorFi = dia(dies + DESFASAMENT + 1);

  const llista = await api("/sites");
  const propietats = (llista.siteEntry || [])
    .filter(s => s.permissionLevel !== "siteUnverifiedUser")
    .map(s => s.siteUrl);

  const consulta = (siteUrl, cos) =>
    api(`/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, cos);

  const llocs = await Promise.all(
    propietats.map(async siteUrl => {
      const base = { startDate: inici, endDate: fi };
      try {
        const [total, previ, consultes, pagines, serie] = await Promise.all([
          consulta(siteUrl, { ...base, dimensions: [] }),
          consulta(siteUrl, { startDate: anteriorInici, endDate: anteriorFi, dimensions: [] }),
          consulta(siteUrl, { ...base, dimensions: ["query"], rowLimit: 10 }),
          consulta(siteUrl, { ...base, dimensions: ["page"], rowLimit: 8 }),
          consulta(siteUrl, { ...base, dimensions: ["date"], rowLimit: 400 }),
        ]);
        const t = total.rows?.[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
        const p = previ.rows?.[0] || null;
        return {
          siteUrl,
          ...nomDe(siteUrl),
          error: null,
          clicks: t.clicks || 0,
          impressions: t.impressions || 0,
          ctr: t.ctr || 0,
          position: t.position || 0,
          abans: p ? { clicks: p.clicks || 0, impressions: p.impressions || 0 } : null,
          consultes: (consultes.rows || []).map(r => ({
            text: r.keys[0], clicks: r.clicks, impressions: r.impressions, position: r.position,
          })),
          pagines: (pagines.rows || []).map(r => ({
            url: r.keys[0], clicks: r.clicks, impressions: r.impressions,
          })),
          serie: (serie.rows || []).map(r => ({ data: r.keys[0], clicks: r.clicks, impressions: r.impressions })),
        };
      } catch (e) {
        return { siteUrl, ...nomDe(siteUrl), error: e.message };
      }
    })
  );

  llocs.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
  return { llocs, inici, fi, dies, generatAt: new Date().toISOString() };
}
