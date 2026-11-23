import "server-only";
import { createHmac } from "node:crypto";

/**
 * Envia l'ordre d'altes en lot a n8n, signada amb el mateix secret que la
 * resta d'esdeveniments (AULAIA_WEBHOOK_SECRET). No toca cap base de dades
 * d'una app: n8n és qui la passa a l'app.
 */
const TEMPS_MAXIM_MS = 20000;

export function teConfiguracio() {
  return Boolean(process.env.N8N_ALTES_LOT_URL && process.env.AULAIA_WEBHOOK_SECRET);
}

export async function enviarOrdre(ordre) {
  const url = process.env.N8N_ALTES_LOT_URL;
  const secret = process.env.AULAIA_WEBHOOK_SECRET;
  if (!url || !secret) {
    return { ok: false, error: "L'enviament a n8n no està configurat encara." };
  }

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
    if (!resposta.ok) {
      return { ok: false, error: dades?.error || `n8n ha respost amb error ${resposta.status}` };
    }
    return { ok: true, resultat: dades };
  } catch {
    return { ok: false, error: "No s'ha pogut contactar amb n8n. No s'ha donat d'alta ningú." };
  }
}
