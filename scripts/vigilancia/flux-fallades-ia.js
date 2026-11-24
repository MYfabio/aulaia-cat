// Codi del node «Decideix i avisa» del flux d'n8n «Fallades d'IA».
// Còpia de referència: el que s'executa és el que hi ha a n8n. Es crea amb
// scripts/vigilancia/crea-flux-fallades-ia.mjs.
//
// Rep del node anterior una fila per app i motiu amb 3 o més avisos d'error de
// la IA a l'última hora ({ app, motiu, model, vegades }). Envia un correu per
// aulaia.cat i no torna a avisar del mateix (app + motiu) fins al cap de 6 hores.
const crypto = require('crypto');
const SIS_HORES = 6 * 60 * 60 * 1000;
const estat = $getWorkflowStaticData('global');
estat.enviats = estat.enviats || {};
const ara = Date.now();
for (const k of Object.keys(estat.enviats)) if (ara - estat.enviats[k] > SIS_HORES) delete estat.enviats[k];

const canvis = [];
for (const item of $input.all()) {
  const r = item.json || {};
  if (!r.app || !r.motiu) continue;
  if (estat.enviats[r.app + '|' + r.motiu]) continue;
  canvis.push({ app: r.app, estat: 'ia-falla', motiu: r.motiu, model: r.model || null, vegades: Number(r.vegades) || null });
}
if (!canvis.length) return [];

const cos = JSON.stringify({ data: new Date().toISOString(), canvis });
const sig = crypto.createHmac('sha256', $env.AULAIA_WEBHOOK_SECRET || '').update(cos).digest('hex');
let correu = 'error';
try {
  const r = await this.helpers.httpRequest({ method: 'POST', url: 'https://www.aulaia.cat/api/vigilancia', body: cos, json: false, timeout: 20000, returnFullResponse: true, ignoreHttpStatusErrors: true, headers: { 'content-type': 'application/json', 'x-aulaia-signature': sig } });
  correu = String(r.statusCode);
} catch (e) { correu = 'error'; }
// Si aulaia.cat ha contestat (bé o rebutjant-ho), no s'insisteix; si no ha contestat, es torna a provar d'aquí 10 minuts.
if (correu !== 'error' && !correu.startsWith('5')) for (const c of canvis) estat.enviats[c.app + '|' + c.motiu] = ara;
return canvis.map(c => ({ json: { ...c, correu } }));
