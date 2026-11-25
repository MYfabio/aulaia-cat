// Codi del node «Demana el resum» del flux d'n8n «Resum setmanal» (dilluns 8:00, Europe/Madrid).
// Còpia de referència: el que s'executa és el que hi ha a n8n.
// Envia una petició signada a aulaia.cat, que llegeix la setmana i envia el correu.
const crypto = require('crypto');
const cos = JSON.stringify({ data: new Date().toISOString() });
const sig = crypto.createHmac('sha256', $env.AULAIA_WEBHOOK_SECRET || '').update(cos).digest('hex');
const r = await this.helpers.httpRequest({ method: 'POST', url: 'https://www.aulaia.cat/api/resum-setmanal', body: cos, json: false, timeout: 90000, returnFullResponse: true, ignoreHttpStatusErrors: true, headers: { 'content-type': 'application/json', 'x-aulaia-signature': sig } });
// Si no ha anat bé, l'execució queda com a error a n8n (es guarden les execucions amb error).
if (r.statusCode !== 200) throw new Error('aulaia.cat ha respost ' + r.statusCode);
return [{ json: typeof r.body === 'string' ? JSON.parse(r.body) : r.body }];
