import "server-only";
import { Pool } from "pg";

/**
 * Connexio a Postgres. Reutilitzem el pool entre invocacions perque en
 * desenvolupament Next recarrega els moduls a cada canvi i acabariem
 * obrint connexions sense parar.
 */
const globalForDb = globalThis;

function crearPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Falta DATABASE_URL");
  return new Pool({
    connectionString,
    max: 3,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: connectionString.includes("railway.internal") ? false : { rejectUnauthorized: false },
  });
}

export function pool() {
  if (!globalForDb.__aulaiaPool) globalForDb.__aulaiaPool = crearPool();
  return globalForDb.__aulaiaPool;
}

export async function query(text, params) {
  const res = await pool().query(text, params);
  return res.rows;
}

/**
 * Crea la taula si no existeix. La cridem abans de cada operacio:
 * es una comprovacio barata i evita haver de mantenir migracions
 * per a un esquema d una sola taula.
 */
let taulaLlesta = false;
export async function assegurarEsquema() {
  if (taulaLlesta) return;
  await query(`
    CREATE TABLE IF NOT EXISTS solicituds (
      id             SERIAL PRIMARY KEY,
      app            TEXT NOT NULL,
      centre         TEXT NOT NULL,
      codi_centre    TEXT,
      localitat      TEXT,
      contacte_nom   TEXT NOT NULL,
      contacte_rol   TEXT NOT NULL,
      contacte_email TEXT NOT NULL,
      missatge       TEXT,
      estat          TEXT NOT NULL DEFAULT 'pendent',
      creada_el      TIMESTAMPTZ NOT NULL DEFAULT now(),
      resolta_el     TIMESTAMPTZ,
      nota_interna   TEXT
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS solicituds_estat_idx ON solicituds (estat, creada_el DESC)`);
  taulaLlesta = true;
}

export async function crearSolicitud(dades) {
  await assegurarEsquema();
  const rows = await query(
    `INSERT INTO solicituds
       (app, centre, codi_centre, localitat, contacte_nom, contacte_rol, contacte_email, missatge)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING id`,
    [
      dades.app,
      dades.centre,
      dades.codiCentre || null,
      dades.localitat || null,
      dades.contacteNom,
      dades.contacteRol,
      dades.contacteEmail,
      dades.missatge || null,
    ]
  );
  return rows[0].id;
}

export async function llistarSolicituds(estat = null) {
  await assegurarEsquema();
  if (estat) {
    return query(`SELECT * FROM solicituds WHERE estat = $1 ORDER BY creada_el DESC LIMIT 200`, [estat]);
  }
  return query(`SELECT * FROM solicituds ORDER BY creada_el DESC LIMIT 200`);
}

export async function comptarPerEstat() {
  await assegurarEsquema();
  const rows = await query(`SELECT estat, COUNT(*)::int AS n FROM solicituds GROUP BY estat`);
  const out = { pendent: 0, validada: 0, rebutjada: 0 };
  for (const r of rows) out[r.estat] = r.n;
  return out;
}

export async function canviarEstat(id, estat, nota) {
  await assegurarEsquema();
  const rows = await query(
    `UPDATE solicituds SET estat = $2, resolta_el = now(), nota_interna = COALESCE($3, nota_interna)
     WHERE id = $1 RETURNING *`,
    [id, estat, nota || null]
  );
  return rows[0] || null;
}

/** Per treure de la safata les proves i el que arribi per error. */
export async function esborrarSolicitud(id) {
  await assegurarEsquema();
  const rows = await query(`DELETE FROM solicituds WHERE id = $1 RETURNING id`, [id]);
  return rows[0] || null;
}
