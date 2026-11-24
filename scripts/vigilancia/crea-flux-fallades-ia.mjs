/**
 * Crea (apagat) el flux d'n8n «Fallades d'IA».
 *   N8N_URL=https://... N8N_API_KEY=... node scripts/vigilancia/crea-flux-fallades-ia.mjs
 * Llegeix els avisos de la taula `esdeveniments` (base aulaia_estat) amb la
 * mateixa credencial de Postgres que la resta de fluxos de vigilància.
 */
import fs from "node:fs";

const base = process.env.N8N_URL;
const clau = process.env.N8N_API_KEY;
if (!base || !clau) throw new Error("Calen N8N_URL i N8N_API_KEY");

const codi = fs.readFileSync(new URL("./flux-fallades-ia.js", import.meta.url), "utf8");
const CONSULTA = `select app, dades->>'motiu' as motiu, max(dades->>'model') as model, count(*)::int as vegades
from esdeveniments
where tipus = 'error' and dades->>'on' = 'ia' and not prova and data > now() - interval '60 minutes'
group by 1, 2
having count(*) >= 3`;

const flux = {
  name: "Fallades d'IA",
  nodes: [
    { name: "Cada 10 minuts", type: "n8n-nodes-base.scheduleTrigger", typeVersion: 1.2, position: [0, 0],
      parameters: { rule: { interval: [{ field: "minutes", minutesInterval: 10 }] } } },
    { name: "Compta fallades", type: "n8n-nodes-base.postgres", typeVersion: 2.6, position: [240, 0],
      credentials: { postgres: { id: "kvuUtVSAGCEb1eci", name: "Postgres aulaia_estat (n8n)" } },
      parameters: { operation: "executeQuery", query: CONSULTA, options: {} } },
    { name: "Decideix i avisa", type: "n8n-nodes-base.code", typeVersion: 2, position: [480, 0],
      parameters: { jsCode: codi } },
  ],
  connections: {
    "Cada 10 minuts": { main: [[{ node: "Compta fallades", type: "main", index: 0 }]] },
    "Compta fallades": { main: [[{ node: "Decideix i avisa", type: "main", index: 0 }]] },
  },
  settings: { saveDataErrorExecution: "all", saveDataSuccessExecution: "none", executionOrder: "v1", timezone: "Europe/Madrid" },
};

const r = await fetch(`${base}/api/v1/workflows`, {
  method: "POST",
  headers: { "X-N8N-API-KEY": clau, "Content-Type": "application/json" },
  body: JSON.stringify(flux),
});
const j = await r.json();
if (!r.ok) throw new Error(`n8n ha respost ${r.status}: ${JSON.stringify(j)}`);
console.log("Creat (apagat):", j.id, j.name, "actiu:", j.active);
