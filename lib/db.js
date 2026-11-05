import "server-only";
import { Pool } from "pg";
import { randomBytes } from "node:crypto";

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
let taulaPromesa = null;
export function assegurarEsquema() {
  if (!taulaPromesa) {
    taulaPromesa = crearEsquema().catch(e => {
      taulaPromesa = null;
      throw e;
    });
  }
  return taulaPromesa;
}

async function crearEsquema() {
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
  // Primer les columnes noves i despres els index que les fan servir: en una
  // taula que ja existia d abans, CREATE TABLE IF NOT EXISTS no hi afegeix
  // columnes, i crear l index abans feia fallar cada peticio.
  await query(`ALTER TABLE solicituds ADD COLUMN IF NOT EXISTS token_verif VARCHAR(32)`);
  await query(`ALTER TABLE solicituds ADD COLUMN IF NOT EXISTS verif_email BOOLEAN DEFAULT false`);
  await query(`ALTER TABLE solicituds ADD COLUMN IF NOT EXISTS fecha_verif TIMESTAMPTZ`);

  await query(`CREATE INDEX IF NOT EXISTS solicituds_estat_idx ON solicituds (estat, creada_el DESC)`);
  await query(`CREATE INDEX IF NOT EXISTS solicituds_token_idx ON solicituds (token_verif) WHERE token_verif IS NOT NULL`);
  await query(`CREATE INDEX IF NOT EXISTS solicituds_email_idx ON solicituds (contacte_email, creada_el DESC)`);
}

export async function crearSolicitud(dades) {
  await assegurarEsquema();

  // Generar token de verificación (32 chars hexadecimales)
  const tokenVerif = randomBytes(16).toString("hex");

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

/**
 * Centres diferents que han demanat acces (els rebutjats no compten). Es compta
 * pel nom, sense majuscules ni espais, perque un centre que demana dues apps
 * es un sol centre. Nomes surt el nombre: cap nom de centre es public.
 */
export async function comptarCentres() {
  await assegurarEsquema();
  const rows = await query(
    `SELECT COUNT(DISTINCT lower(btrim(centre)))::int AS n FROM solicituds WHERE estat <> 'rebutjada' AND btrim(centre) <> ''`
  );
  return rows[0]?.n ?? 0;
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

/* ---------- Contactes: CRP, serveis educatius i centres als quals presentem el projecte ---------- */

// Es guarda la promesa, no un booleà: si tres consultes arriben alhora, les tres
// esperen la mateixa creació. Dues CREATE TABLE simultànies fan fallar Postgres.
let contactesPromesa = null;
function assegurarContactes() {
  if (!contactesPromesa) {
    contactesPromesa = crearContactes().catch(e => {
      contactesPromesa = null;
      throw e;
    });
  }
  return contactesPromesa;
}

async function crearContactes() {
  await query(`
    CREATE TABLE IF NOT EXISTS contactes (
      id          SERIAL PRIMARY KEY,
      tipus       TEXT NOT NULL DEFAULT 'centre',
      nom         TEXT NOT NULL,
      municipi    TEXT,
      comarca     TEXT,
      codi_centre TEXT,
      correu      TEXT NOT NULL,
      font        TEXT,
      estat       TEXT NOT NULL DEFAULT 'pendent',
      creat_el    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await query(`CREATE UNIQUE INDEX IF NOT EXISTS contactes_correu_idx ON contactes (lower(correu))`);
  await query(`CREATE INDEX IF NOT EXISTS contactes_estat_idx ON contactes (estat, comarca)`);
  await query(`
    CREATE TABLE IF NOT EXISTS contacte_events (
      id          SERIAL PRIMARY KEY,
      contacte_id INTEGER NOT NULL REFERENCES contactes(id) ON DELETE CASCADE,
      tipus       TEXT NOT NULL,
      text        TEXT,
      quan        TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS contacte_events_idx ON contacte_events (contacte_id, quan DESC)`);
}

/** Retorna la fila creada, o null si aquest correu ja hi era. */
export async function afegirContacte(c) {
  await assegurarContactes();
  const rows = await query(
    `INSERT INTO contactes (tipus, nom, municipi, comarca, codi_centre, correu, font)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (lower(correu)) DO NOTHING
     RETURNING *`,
    [c.tipus || "centre", c.nom, c.municipi || null, c.comarca || null, c.codiCentre || null, c.correu, c.font || null]
  );
  return rows[0] || null;
}

export async function llistarContactes({ estat, tipus, comarca, q } = {}) {
  await assegurarContactes();
  const where = [];
  const params = [];
  if (estat) { params.push(estat); where.push(`estat = $${params.length}`); }
  if (tipus) { params.push(tipus); where.push(`tipus = $${params.length}`); }
  if (comarca) { params.push(comarca); where.push(`comarca = $${params.length}`); }
  if (q) { params.push("%" + q + "%"); where.push(`(nom ILIKE $${params.length} OR municipi ILIKE $${params.length} OR correu ILIKE $${params.length})`); }
  const clausula = where.length ? " WHERE " + where.join(" AND ") : "";
  return query(`SELECT * FROM contactes${clausula} ORDER BY comarca NULLS LAST, municipi NULLS LAST, nom LIMIT 400`, params);
}

export async function comptarContactes() {
  await assegurarContactes();
  const rows = await query(`SELECT estat, COUNT(*)::int AS n FROM contactes GROUP BY estat`);
  const out = { pendent: 0, enviat: 0, respost: 0, interessat: 0, baixa: 0 };
  for (const r of rows) out[r.estat] = r.n;
  return out;
}

export async function comarquesDeContactes() {
  await assegurarContactes();
  const rows = await query(`SELECT DISTINCT comarca FROM contactes WHERE comarca IS NOT NULL ORDER BY comarca`);
  return rows.map(r => r.comarca);
}

export async function registrarEventContacte(id, tipus, text, estat) {
  await assegurarContactes();
  await query(`INSERT INTO contacte_events (contacte_id, tipus, text) VALUES ($1,$2,$3)`, [id, tipus, text || null]);
  if (estat) await query(`UPDATE contactes SET estat = $2 WHERE id = $1`, [id, estat]);
}

export async function eventsDeContactes(ids) {
  await assegurarContactes();
  if (!ids.length) return [];
  return query(`SELECT * FROM contacte_events WHERE contacte_id = ANY($1::int[]) ORDER BY quan DESC`, [ids]);
}

export async function esborrarContacte(id) {
  await assegurarContactes();
  const rows = await query(`DELETE FROM contactes WHERE id = $1 RETURNING id`, [id]);
  return rows.length > 0;
}

/* ---------- Missatges: dubtes, incidencies i col·laboracions que arriben de l assistent ---------- */

// Taula a part de `solicituds` perque una dubte no es un centre: aquella taula
// exigeix app, centre i rol, i `comptarCentres` compta centres. Barrejar-hi
// missatges faria mentir les xifres del panell.
let missatgesPromesa = null;
function assegurarMissatges() {
  if (!missatgesPromesa) {
    missatgesPromesa = crearMissatges().catch(e => {
      missatgesPromesa = null;
      throw e;
    });
  }
  return missatgesPromesa;
}

async function crearMissatges() {
  await query(`
    CREATE TABLE IF NOT EXISTS missatges (
      id        SERIAL PRIMARY KEY,
      tipus     TEXT NOT NULL,
      perfil    TEXT,
      apps      TEXT[] NOT NULL DEFAULT '{}',
      via       TEXT,
      nom       TEXT NOT NULL,
      centre    TEXT,
      correu    TEXT NOT NULL,
      text      TEXT,
      idioma    TEXT NOT NULL DEFAULT 'ca',
      estat     TEXT NOT NULL DEFAULT 'pendent',
      creat_el  TIMESTAMPTZ NOT NULL DEFAULT now(),
      resolt_el TIMESTAMPTZ
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS missatges_estat_idx ON missatges (estat, creat_el DESC)`);
  await query(`CREATE INDEX IF NOT EXISTS missatges_correu_idx ON missatges (lower(correu), creat_el DESC)`);
}

export async function crearMissatge(m) {
  await assegurarMissatges();
  const rows = await query(
    `INSERT INTO missatges (tipus, perfil, apps, via, nom, centre, correu, text, idioma)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING id`,
    [m.tipus, m.perfil || null, m.apps || [], m.via || null, m.nom, m.centre || null, m.correu, m.text || null, m.idioma || "ca"]
  );
  return { id: rows[0].id };
}

export async function llistarMissatges({ estat, tipus } = {}) {
  await assegurarMissatges();
  const where = [];
  const params = [];
  if (estat) { params.push(estat); where.push(`estat = $${params.length}`); }
  if (tipus) { params.push(tipus); where.push(`tipus = $${params.length}`); }
  const clausula = where.length ? " WHERE " + where.join(" AND ") : "";
  return query(`SELECT * FROM missatges${clausula} ORDER BY creat_el DESC LIMIT 200`, params);
}

export async function comptarMissatges() {
  await assegurarMissatges();
  const rows = await query(`SELECT estat, COUNT(*)::int AS n FROM missatges GROUP BY estat`);
  const out = { pendent: 0, respost: 0, arxivat: 0 };
  for (const r of rows) out[r.estat] = r.n;
  return out;
}

export async function canviarEstatMissatge(id, estat) {
  await assegurarMissatges();
  const rows = await query(
    `UPDATE missatges SET estat = $2, resolt_el = CASE WHEN $2 = 'pendent' THEN NULL ELSE now() END
     WHERE id = $1 RETURNING id`,
    [id, estat]
  );
  return rows.length > 0;
}

export async function esborrarMissatge(id) {
  await assegurarMissatges();
  const rows = await query(`DELETE FROM missatges WHERE id = $1 RETURNING id`, [id]);
  return rows.length > 0;
}

/** Topall per correu: quants missatges ha enviat aquesta adreça en l ultima hora. */
export async function contarMissatgesPerEmail(correu) {
  await assegurarMissatges();
  const rows = await query(
    `SELECT COUNT(*)::int AS n FROM missatges
     WHERE lower(correu) = lower($1) AND creat_el > now() - interval '1 hour'`,
    [correu]
  );
  return rows[0]?.n || 0;
}
