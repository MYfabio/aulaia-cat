import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { enviarCorreu } from "./correu";
import { query, registrarEventContacte, comptarContactes } from "./db";

/** Maxim de correus per enviament. Es fa complir aqui, no a la pantalla. */
export const TANDA = 5;

const BASE = "https://www.aulaia.cat";

export const TEXT_PER_DEFECTE = [
  "Hola,",
  "",
  "Soc en Fabio Martínez, docent de l'Institut Escola Industrial de Sabadell. Estem creant aplicacions gratuïtes per a l'aula, fetes a partir del que passa de debò a classe, i voldria presentar-les a {{nom}}.",
  "",
  "Les trobareu totes a https://www.aulaia.cat. Si us interessa provar-ne alguna, o teniu dubtes, respongueu aquest correu.",
  "",
  "Gràcies pel vostre temps.",
  "",
  "Fabio Martínez",
  "aulaia.cat",
].join("\n");

export const ASSUMPTE_PER_DEFECTE = "Aplicacions gratuïtes per a l'aula · aulaia.cat";

function secret() {
  const s = process.env.PANEL_SECRET;
  if (!s || s.length < 16) throw new Error("Falta PANEL_SECRET");
  return s;
}

/** Signatura de l'enllaç de baixa: qui el tingui nomes pot donar de baixa aquell contacte. */
export function signaturaBaixa(id) {
  return createHmac("sha256", secret()).update("baixa:" + id).digest("base64url").slice(0, 24);
}

export function signaturaValida(id, sig) {
  try {
    const a = Buffer.from(signaturaBaixa(id));
    const b = Buffer.from(String(sig || ""));
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function enllacBaixa(id) {
  return `${BASE}/api/baixa?c=${id}&s=${signaturaBaixa(id)}`;
}

/** Substitueix {{nom}} i treu salts de linia del que va a l'assumpte. */
function personalitzar(plantilla, contacte) {
  return plantilla.replaceAll("{{nom}}", contacte.nom);
}

export function cosComplet(plantilla, contacte) {
  return [
    personalitzar(plantilla, contacte),
    "",
    "—",
    "Si no voleu rebre més correus d'aulaia.cat, podeu donar-vos de baixa aquí:",
    enllacBaixa(contacte.id),
  ].join("\n");
}

/** Els propers pendents, en ordre estable. Nomes els que no han rebut res ni s'han donat de baixa. */
export async function properPendents({ comarca, tipus } = {}) {
  await comptarContactes(); // assegura que la taula existeix
  const params = [];
  const where = ["estat = 'pendent'"];
  if (comarca) { params.push(comarca); where.push(`comarca = $${params.length}`); }
  if (tipus) { params.push(tipus); where.push(`tipus = $${params.length}`); }
  params.push(TANDA);
  return query(
    `SELECT * FROM contactes WHERE ${where.join(" AND ")} ORDER BY comarca NULLS LAST, municipi NULLS LAST, id LIMIT $${params.length}`,
    params
  );
}

export function remitentConfigurat() {
  return process.env.RESEND_FROM_CONTACTES || null;
}

/**
 * Envia a un maxim de TANDA contactes, tornant a comprovar a la base de dades
 * que segueixen pendents. Un per un: si un falla, la resta segueix.
 */
export async function enviarTanda(ids, { assumpte, plantilla }) {
  const from = remitentConfigurat();
  if (!from) throw new Error("Falta RESEND_FROM_CONTACTES");
  const nets = [...new Set(ids.filter(Number.isInteger))].slice(0, TANDA);
  if (!nets.length) return [];

  const files = await query(`SELECT * FROM contactes WHERE id = ANY($1::int[]) AND estat = 'pendent'`, [nets]);
  const assumpteNet = String(assumpte).replace(/[\r\n]+/g, " ").trim().slice(0, 150);
  const resultats = [];

  for (const c of files) {
    try {
      const baixa = enllacBaixa(c.id);
      await enviarCorreu({
        to: c.correu,
        subject: assumpteNet,
        text: cosComplet(plantilla, c),
        from,
        replyTo: process.env.REPLY_TO_CONTACTES || undefined,
        headers: { "List-Unsubscribe": `<${baixa}>` },
      });
      await registrarEventContacte(c.id, "enviat", "Presentació enviada des del panell", "enviat");
      resultats.push({ id: c.id, nom: c.nom, ok: true });
    } catch (e) {
      console.error("Tanda: " + c.correu + " " + e.message);
      resultats.push({ id: c.id, nom: c.nom, ok: false });
    }
  }
  return resultats;
}
