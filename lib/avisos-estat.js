import "server-only";
import { Pool } from "pg";
import { resumAvisos } from "./avisos.mjs";

/**
 * Llegeix els avisos que n8n ha guardat a la base de dades d'estat
 * (taula esdeveniments). Només llegeix: el panell no escriu mai aquí.
 * Necessita ESTAT_DATABASE_URL; sense ella retorna «no disponible» i no falla.
 */
let piscina = null;

function connexio() {
  const url = process.env.ESTAT_DATABASE_URL;
  if (!url) return null;
  if (!piscina) {
    piscina = new Pool({
      connectionString: url,
      ssl: url.includes("railway.internal") ? false : { rejectUnauthorized: false },
      max: 2,
    });
  }
  return piscina;
}

export async function llegirAvisos({ limit = 200 } = {}) {
  const pool = connexio();
  if (!pool) return { disponible: false, total: 0, perGrup: {}, avisos: [], llegit: new Date() };
  const r = await pool.query(
    "select id, app, tipus, centre, data as quan from esdeveniments where prova = false order by data desc limit $1",
    [limit]
  );
  return { disponible: true, llegit: new Date(), ...resumAvisos(r.rows) };
}
