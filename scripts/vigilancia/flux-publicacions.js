// Codi del node «Comprova les publicacions» del flux d'n8n «Comprovació de publicacions».
// Còpia de referència: el que s'executa és el que hi ha a n8n. Es crea amb
// scripts/vigilancia/crea-flux-publicacions.mjs.
//
// Cada 5 minuts demana a aulaia.cat l'última publicació de cada app a Railway.
// Per a cada publicació nova: si ha fallat → avís; si porta més de 25 minuts a
// mig fer → avís; si ha anat bé, comprova que la web respon (dues proves
// seguides abans d'avisar). Les publicacions que van bé no generen res.
const crypto = require('crypto');
const signa = cos => crypto.createHmac('sha256', $env.AULAIA_WEBHOOK_SECRET || '').update(cos).digest('hex');
const envia = (url, cos) => this.helpers.httpRequest({ method: 'POST', url, body: cos, json: false, timeout: 55000, returnFullResponse: true, ignoreHttpStatusErrors: true, headers: { 'content-type': 'application/json', 'x-aulaia-signature': signa(cos) } });

const r = await envia('https://www.aulaia.cat/api/vigilancia/publicacions', JSON.stringify({ data: new Date().toISOString() }));
if (r.statusCode !== 200) throw new Error('aulaia.cat ha respost ' + r.statusCode);
const { apps } = typeof r.body === 'string' ? JSON.parse(r.body) : r.body;

const estat = $getWorkflowStaticData('global');
const primeraVegada = !estat.apps;
estat.apps = estat.apps || {};
const FALLADA = ['FAILED', 'CRASHED'];
const EN_CURS = ['INITIALIZING', 'QUEUED', 'WAITING', 'BUILDING', 'DEPLOYING'];
const ara = Date.now();
const canvis = [];

for (const a of apps) {
  if (!a.id) continue;
  // La primera vegada només s'apunta el que hi ha, sense avisar de res.
  if (primeraVegada) { estat.apps[a.app] = { id: a.id, fet: true }; continue; }
  if (!estat.apps[a.app] || estat.apps[a.app].id !== a.id) estat.apps[a.app] = { id: a.id, fet: false, intents: 0, encallada: false };
  const s = estat.apps[a.app];
  if (s.fet) continue;

  if (FALLADA.includes(a.estat)) {
    canvis.push({ app: a.app, estat: 'publicacio-fallida', versio: a.versio });
    s.fet = true;
  } else if (EN_CURS.includes(a.estat)) {
    if (!s.encallada && a.creat && ara - Date.parse(a.creat) > 25 * 60 * 1000) {
      s.encallada = true;
      canvis.push({ app: a.app, estat: 'publicacio-encallada', versio: a.versio });
    }
  } else if (a.estat === 'SUCCESS') {
    const inici = Date.now();
    let codi = 0;
    try {
      const w = await this.helpers.httpRequest({ method: 'GET', url: a.url, timeout: 15000, returnFullResponse: true, ignoreHttpStatusErrors: true, headers: { 'user-agent': 'aulaia-vigilancia/1' } });
      codi = w.statusCode;
    } catch (e) { codi = 0; }
    if (codi >= 200 && codi < 500) {
      s.fet = true;
    } else {
      s.intents += 1;
      if (s.intents >= 2) {
        canvis.push({ app: a.app, estat: 'publicacio-no-respon', codi, segons: (Date.now() - inici) / 1000, versio: a.versio });
        s.fet = true;
      }
    }
  } else {
    s.fet = true; // REMOVED, SKIPPED, SLEEPING...: res a dir
  }
}

if (!canvis.length) return [];
let correu = 'no';
try {
  const c = await envia('https://www.aulaia.cat/api/vigilancia', JSON.stringify({ data: new Date().toISOString(), canvis }));
  correu = String(c.statusCode);
} catch (e) { correu = 'error'; }
return canvis.map(c => ({ json: { ...c, correu } }));
