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
      token_verif    VARCHAR(32),
      verif_email    BOOLEAN DEFAULT false,
      fecha_verif    TIMESTAMPTZ,
      creada_el      TIMESTAMPTZ NOT NULL DEFAULT now(),
      resolta_el     TIMESTAMPTZ,
      nota_interna   TEXT
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS solicituds_estat_idx ON solicituds (estat, creada_el DESC)`);
  await query(`CREATE INDEX IF NOT EXISTS solicituds_token_idx ON solicituds (token_verif) WHERE token_verif IS NOT NULL`);
  await query(`CREATE INDEX IF NOT EXISTS solicituds_email_idx ON solicituds (contacte_email, creada_el DESC)`);

  // Afegir columnes si no existeixen (backward compatibility)
  try {
    await query(`ALTER TABLE solicituds ADD COLUMN token_verif VARCHAR(32)`);
  } catch {
    // Columna ja existeix
  }
  try {
    await query(`ALTER TABLE solicituds ADD COLUMN verif_email BOOLEAN DEFAULT false`);
  } catch {}
  try {
    await query(`ALTER TABLE solicituds ADD COLUMN fecha_verif TIMESTAMPTZ`);
  } catch {}

  taulaLlesta = true;
}

export async function crearSolicitud(dades) {
  await assegurarEsquema();

  // Generar token de verificación (32 chars hexadecimales)
  const tokenVerif = require("crypto").randomBytes(16).toString("hex");

  const rows = await query(
    `INSERT INTO solicituds
       (app, centre, codi_centre, localitat, contacte_nom, contacte_rol, contacte_email, missatge, token_verif)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
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
      tokenVerif,
    ]
  );
  return { id: rows[0].id, tokenVerif };
}

export async function llistarSolicituds(estat = null, app = null) {
  await assegurarEsquema();
  let where = [];
  let params = [];
  if (estat) {
    where.push(`estat = $${where.length + 1}`);
    params.push(estat);
  }
  if (app) {
    where.push(`app = $${where.length + 1}`);
    params.push(app);
  }
  const whereClause = where.length ? ` WHERE ${where.join(" AND ")}` : "";
  return query(`SELECT * FROM solicituds${whereClause} ORDER BY creada_el DESC LIMIT 200`, params);
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

/** Verificar email con token */
export async function verificarEmail(token) {
  await assegurarEsquema();
  const rows = await query(
    `UPDATE solicituds
     SET verif_email = true, fecha_verif = now()
     WHERE token_verif = $1 AND verif_email = false
     RETURNING id, centre, contacte_email`,
    [token]
  );
  return rows[0] || null;
}

/** Obtener solicitud por token */
export async function obtenerSolicitudPorToken(token) {
  await assegurarEsquema();
  const rows = await query(
    `SELECT id, centre, contacte_email, verif_email FROM solicituds WHERE token_verif = $1`,
    [token]
  );
  return rows[0] || null;
}

/** Rate limiting: contar solicitudes por IP en última hora */
export async function contarSolicitudesPorIp(ip) {
  // Crear tabla de logs si no existe
  await query(`
    CREATE TABLE IF NOT EXISTS rate_limit_logs (
      id SERIAL PRIMARY KEY,
      ip TEXT NOT NULL,
      creada_el TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  // Registrar esta solicitud
  await query(
    `INSERT INTO rate_limit_logs (ip) VALUES ($1)`,
    [ip]
  );

  // Contar en última hora
  const rows = await query(
    `SELECT COUNT(*)::int AS n FROM rate_limit_logs
     WHERE ip = $1 AND creada_el > now() - interval '1 hour'`,
    [ip]
  );

  // Limpiar registros antiguos (>24h)
  await query(`DELETE FROM rate_limit_logs WHERE creada_el < now() - interval '1 day'`);

  return rows[0]?.n || 0;
}

/** Rate limiting: contar solicitudes por email en última hora */
export async function contarSolicitudesPorEmail(email) {
  await assegurarEsquema();
  const rows = await query(
    `SELECT COUNT(*)::int AS n FROM solicituds
     WHERE contacte_email = $1 AND creada_el > now() - interval '1 hour'`,
    [email]
  );
  return rows[0]?.n || 0;
}
