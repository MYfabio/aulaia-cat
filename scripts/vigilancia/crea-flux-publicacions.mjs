/**
 * Crea (apagat) el flux d'n8n «Comprovació de publicacions».
 *   N8N_URL=https://... N8N_API_KEY=... node scripts/vigilancia/crea-flux-publicacions.mjs
 * Fa servir la mateixa credencial de Postgres que «Vigilància de les apps».
 * Encendre'l és un pas a part, amb permís del propietari.
 */
import fs from "node:fs";

const base = process.env.N8N_URL;
const clau = process.env.N8N_API_KEY;
if (!base || !clau) throw new Error("Calen N8N_URL i N8N_API_KEY");

const codi = fs.readFileSync(new URL("./flux-publicacions.js", import.meta.url), "utf8");
const flux = {
  name: "Comprovació de publicacions",
  nodes: [
    { name: "Cada 5 minuts", type: "n8n-nodes-base.scheduleTrigger", typeVersion: 1.2, position: [0, 0],
      parameters: { rule: { interval: [{ field: "minutes", minutesInterval: 5 }] } } },
    { name: "Comprova les publicacions", type: "n8n-nodes-base.code", typeVersion: 2, position: [240, 0],
      parameters: { jsCode: codi } },
    { name: "Guarda a Avisos", type: "n8n-nodes-base.postgres", typeVersion: 2.6, position: [480, 0],
      credentials: { postgres: { id: "kvuUtVSAGCEb1eci", name: "Postgres aulaia_estat (n8n)" } },
      parameters: {
        operation: "executeQuery",
        query: "insert into esdeveniments (app, tipus, centre, dades, data, prova) values ($1, 'error', null, $2::jsonb, now(), false)",
        options: { queryReplacement: "={{ [$json.app, JSON.stringify({ on: 'publicacions', estat: $json.estat, codi: $json.codi || 0, versio: $json.versio || null, correu: $json.correu })] }}" },
      } },
  ],
  connections: {
    "Cada 5 minuts": { main: [[{ node: "Comprova les publicacions", type: "main", index: 0 }]] },
    "Comprova les publicacions": { main: [[{ node: "Guarda a Avisos", type: "main", index: 0 }]] },
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
