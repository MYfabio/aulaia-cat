import "server-only";
import { createHmac } from "node:crypto";

/**
 * Envia l'ordre d'alta de compte a n8n, signada amb AULAIA_WEBHOOK_SECRET
 * (com la resta d'ordres i avisos). Mai llança: retorna { ok, resultat | error }.
 * L'adreça surt de N8N_ALTA_COMPTE_URL o, si no hi és, de la mateixa n8n de
 * N8N_ALTES_LOT_URL canviant-ne el camí.
 */
const TEMPS_MAXIM_MS = 20000;

function adreca() {
  if (process.env.N8N_ALTA_COMPTE_URL) return process.env.N8N_ALTA_COMPTE_URL;
  const lot = process.env.N8N_ALTES_LOT_URL || "";
  return /\/altes-lot$/.test(lot) ? lot.replace(/\/altes-lot$/, "/alta-compte") : "";
}

export function teConfiguracio() {
  return Boolean(adreca() && process.env.AULAIA_WEBHOOK_SECRET);
}

export async function enviarOrdreAlta(ordre) {
  const url = adreca();
  const secret = process.env.AULAIA_WEBHOOK_SECRET;
  if (!url || !secret) return { ok: false, error: "n8n no està configurat" };

  const cos = JSON.stringify(ordre);
  const signatura = createHmac("sha256", secret).update(cos).digest("hex");
  try {
    const resposta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Aulaia-Signature": signatura },
      body: cos,
      signal: AbortSignal.timeout(TEMPS_MAXIM_MS),
    });
    const dades = await resposta.json().catch(() => null);
    if (!resposta.ok) return { ok: false, error: dades?.error || `error ${resposta.status}` };
    return { ok: true, resultat: dades };
  } catch {
    return { ok: false, error: "n8n no respon" };
  }
}
