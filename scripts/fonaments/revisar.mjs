#!/usr/bin/env node
/**
 * Agent de fonaments: revisa en local la carpeta de cada app i envia el
 * resultat al panell d'aulaia.cat (/panel/fonaments).
 *
 * NOMES LLEGEIX. No fa commits, no desplega i no toca cap fitxer de les apps.
 * L'unic que escriu es scripts/fonaments/sortida/ (ignorada per git).
 *
 * Us, des de la carpeta aulaia-cat:
 *   node scripts/fonaments/revisar.mjs                 revisa i mostra el resum
 *   node scripts/fonaments/revisar.mjs --enviar        a mes, l'envia al panell
 *   node scripts/fonaments/revisar.mjs --app dictats   nomes una app
 *
 * Variables (de l'entorn o de %USERPROFILE%\.aulaia\fonaments.env):
 *   FONAMENTS_TOKEN  el mateix valor que te el servei aulaia-cat a Railway
 *   FONAMENTS_URL    per defecte https://www.aulaia.cat/api/fonaments
 *                    (amb www: sense, la redireccio 301 converteix el POST en
 *                    GET sense token i el panell respon 405)
 *   APPS_DIR         per defecte, la carpeta que conte aulaia-cat
 *
 * El token viu FORA de la carpeta del projecte a proposit: `railway up` puja
 * la carpeta sencera i aixi no hi ha manera que hi viatgi.
 *
 * Quines apps i on son: scripts/fonaments/apps.json.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync, copyFileSync } from "node:fs";
import { join, dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { veredictes, prioritats, PREGUNTES } from "../../lib/fonaments.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
const ARREL_AULAIA = resolve(AQUI, "..", "..");
const SORTIDA = join(AQUI, "sortida");

/* ---------- Entorn ---------- */

function carregarEnvLocal() {
  const f = process.env.FONAMENTS_ENV || join(homedir(), ".aulaia", "fonaments.env");
  if (!existsSync(f)) return;
  for (const linia of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = linia.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}

// Cap ordre de git ha de quedar esperant una contrasenya: l'agent corre sol.
const ENV_ORDRES = { ...process.env, GIT_TERMINAL_PROMPT: "0", GCM_INTERACTIVE: "never" };

/** Executa una ordre i torna la sortida, o null si falla. Mai llança. */
function run(cmd, args, cwd, timeout = 30000) {
  try {
    return execFileSync(cmd, args, {
      cwd,
      env: ENV_ORDRES,
      encoding: "utf8",
      timeout,
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
      windowsHide: true,
    }).trim();
  } catch {
    return null;
  }
}

function llegir(dir, rel, max = 1024 * 1024) {
  try {
    const p = join(dir, rel);
    const st = statSync(p);
    if (!st.isFile() || st.size > max) return null;
    return readFileSync(p, "utf8");
  } catch {
    return null;
  }
}

/* ---------- Git ---------- */

function infoGit(dir) {
  const top = run("git", ["rev-parse", "--show-toplevel"], dir);
  if (!top) return { hiHa: false };

  const url = run("git", ["remote", "get-url", "origin"], dir);
  let remot = null;
  let remotAmbToken = false;
  if (url) {
    // https://usuari:token@github.com/... o https://ghp_xxx@github.com/...
    const credencials = url.match(/^https?:\/\/([^/@\s]+)@/i)?.[1] || "";
    remotAmbToken = credencials.includes(":") || /^(gh[pousr]_|github_pat_)/.test(credencials);
    const m = url.match(/github\.com[/:]([^/\s]+)\/([^/\s]+?)(?:\.git)?\/?$/i);
    remot = m ? `${m[1]}/${m[2]}` : "(remot que no és GitHub)";
  }

  const branca = run("git", ["branch", "--show-current"], dir) || null;
  const head = run("git", ["rev-parse", "HEAD"], dir);
  const porcelain = run("git", ["status", "--porcelain"], dir);
  const brutes = porcelain ? porcelain.split("\n").filter(Boolean).length : 0;
  const ultimCommit = run("git", ["log", "-1", "--format=%cI"], dir);

  // ls-remote nomes llegeix: no canvia res de la carpeta, ni tan sols les referencies.
  const caps = {};
  let consultat = false;
  if (url) {
    const ls = run("git", ["ls-remote", "--heads", "origin"], dir, 30000);
    if (ls != null) {
      consultat = true;
      for (const l of ls.split("\n")) {
        const m = l.match(/^([0-9a-f]{40})\s+refs\/heads\/(.+)$/);
        if (m) caps[m[2]] = m[1];
      }
    }
  }

  let perPujar = null;
  let brancaRemota = null;
  if (consultat && branca) {
    const capRemot = caps[branca];
    brancaRemota = Boolean(capRemot);
    if (capRemot && head) {
      if (capRemot === head) perPujar = 0;
      else if (run("git", ["cat-file", "-e", `${capRemot}^{commit}`], dir) !== null) {
        const n = run("git", ["rev-list", "--count", `${capRemot}..HEAD`], dir);
        perPujar = n == null ? null : Number(n);
      }
    }
  }

  return { hiHa: true, remot, remotAmbToken, branca, head, brutes, perPujar, brancaRemota, ultimCommit, caps };
}

function fitxersGit(dir) {
  const out = run("git", ["-c", "core.quotepath=off", "ls-files", "-z"], dir);
  return out == null ? null : out.split("\0").filter(Boolean);
}

const CARPETES_FORA = new Set([
  "node_modules", ".next", "dist", "build", "out", "coverage", ".git", ".turbo",
  ".vercel", "tmp", ".cache", "backup", "backups", ".output",
]);

/** Per a les carpetes sense git: tots els fitxers menys dependencies i compilats. */
function fitxersCarpeta(dir, max = 8000) {
  const out = [];
  const pila = [""];
  while (pila.length && out.length < max) {
    const rel = pila.pop();
    let entrades;
    try {
      entrades = readdirSync(join(dir, rel), { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entrades) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) {
        if (!CARPETES_FORA.has(e.name)) pila.push(r);
      } else if (e.isFile()) {
        out.push(r);
      }
    }
  }
  return out;
}

const fora = f => /(^|\/)(node_modules|\.next|dist|build|coverage)\//.test(f);

/* ---------- Proves ---------- */

const RE_PROVA = /(^|\/)(__tests__|tests?|e2e|spec)\/|\.(test|spec)\.[cm]?[jt]sx?$/i;
const RE_WORKFLOW = /^\.github\/workflows\/[^/]+\.ya?ml$/;

function infoProves(dir, fitxers) {
  const font = fitxers.filter(f => !fora(f));
  const fitxersProva = font.filter(f => RE_PROVA.test(f) && /\.([cm]?[jt]sx?|py)$/.test(f));

  let script = false;
  for (const pj of font.filter(f => basename(f) === "package.json")) {
    try {
      const j = JSON.parse(llegir(dir, pj) || "{}");
      for (const [nom, ordre] of Object.entries(j.scripts || {})) {
        if (/^test(:|$)/.test(nom) && typeof ordre === "string" && !/no test specified/.test(ordre)) script = true;
      }
    } catch {
      // Un package.json trencat no ha d'aturar la revisio.
    }
  }

  const ciFitxers = font.filter(f => RE_WORKFLOW.test(f)).filter(w => {
    const t = llegir(dir, w) || "";
    return /\b(?:npm|pnpm|yarn|bun|npx)\b[^\n]*\b(?:test|vitest|jest|playwright)\b|\bnode\s+--test\b|\bpytest\b/.test(t);
  });

  return { script, fitxers: fitxersProva.length, ci: ciFitxers.length > 0, ciFitxers };
}

/* ---------- Copies de seguretat ---------- */

function ultimaExecucio(remot, fitxerWorkflow) {
  if (!remot || remot.startsWith("(")) return null;
  const sortida = run(
    "gh",
    ["run", "list", "-R", remot, "--workflow", fitxerWorkflow, "-L", "1", "--json", "conclusion,status,createdAt"],
    ARREL_AULAIA,
    30000
  );
  if (!sortida) return null;
  try {
    const [r] = JSON.parse(sortida);
    if (!r) return { conclusio: null, estat: "mai", data: null };
    return { conclusio: r.conclusion || null, estat: r.status || null, data: r.createdAt || null };
  } catch {
    return null;
  }
}

function infoCopies(dir, fitxers, remot) {
  const workflows = [];
  for (const w of fitxers.filter(f => RE_WORKFLOW.test(f))) {
    const t = llegir(dir, w) || "";
    if (!/\bpg_dump\b/.test(t)) continue;
    workflows.push({
      fitxer: w,
      restaura: /\bpg_restore\b|\brestaur|\brestore\b/i.test(t),
      xifra: /\bopenssl\b|\bgpg\b|\bage\s+-|aes-?256/i.test(t),
      ultima: ultimaExecucio(remot, basename(w)),
    });
  }
  const scripts = fitxers.filter(
    f => !f.startsWith(".github/") && !fora(f) && /backup|copia/i.test(basename(f)) &&
      /\.(sh|mjs|cjs|js|ts|py)$/.test(f) && /\bpg_dump\b/.test(llegir(dir, f) || "")
  );
  return { workflows, scripts };
}

/* ---------- Secrets ---------- */

const EXT_NO_TEXT = /\.(png|jpe?g|gif|webp|avif|ico|svg|pdf|zip|gz|tgz|rar|7z|woff2?|ttf|otf|eot|mp3|mp4|m4a|wav|ogg|webm|mov|glb|bin|wasm|exe|dll|so|dylib|psd|ai|docx?|xlsx?|pptx?|sqlite|db|lock|map)$/i;
const LOCKFILES = new Set(["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb"]);

const esPlaceholder = p =>
  p.length < 6 || /^(\$|<|\[|%|\{\{|password|contrasenya|secret|changeme|xx+|\*+|pass|postgres|user|example|exemple|test|dev|local)/i.test(p);

/**
 * Nomes es guarda el tipus, el fitxer i la linia: mai el valor.
 * L'agent no ha d'escampar una clau que ha trobat.
 */
const PATRONS = [
  { tipus: "Clau d'Anthropic", re: /sk-ant-[A-Za-z0-9_-]{20,}/ },
  { tipus: "Clau d'OpenAI", re: /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}/ },
  { tipus: "Token de GitHub", re: /\b(?:gh[pousr]_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{40,})/ },
  { tipus: "Clau de Resend", re: /\bre_[A-Za-z0-9]{6,}_[A-Za-z0-9]{12,}/ },
  { tipus: "Clau de Stripe en viu", re: /\b(?:sk|rk)_live_[A-Za-z0-9]{16,}/ },
  { tipus: "Clau privada", re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----/ },
  { tipus: "Token de Slack", re: /\bxox[abprs]-[A-Za-z0-9-]{10,}/ },
  {
    tipus: "Clau de Google",
    re: /\bAIza[0-9A-Za-z_-]{35}/,
    // La configuracio web de Firebase porta una clau que es publica per disseny.
    exceptuaFitxer: text => /authDomain|firebaseConfig|FIREBASE_API_KEY/.test(text),
  },
  {
    tipus: "Contrasenya en una URL de base de dades",
    re: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|rediss?):\/\/([^:@\s/'"`]+):([^@\s'"`]+)@([^/\s'"`:?]+)/,
    valida: m => !esPlaceholder(m[2]) && !/^(localhost|127\.0\.0\.1|0\.0\.0\.0|db|postgres|database|host|\[::1\])$/i.test(m[3]),
  },
  {
    tipus: "Clau service_role de Supabase",
    re: /\beyJ[A-Za-z0-9_-]{10,}\.(eyJ[A-Za-z0-9_-]{10,})\.[A-Za-z0-9_-]{10,}/,
    valida: m => {
      try {
        return JSON.parse(Buffer.from(m[1], "base64url").toString("utf8")).role === "service_role";
      } catch {
        return false;
      }
    },
  },
];

function infoSecrets(dir, fitxers, escanejat) {
  const envSeguit = escanejat === "git"
    ? fitxers.filter(f => /^\.env(\..+)?$/.test(basename(f)) && !/\.(example|sample|template|dist)$/i.test(f))
    : [];

  const trobades = [];
  let revisats = 0;
  for (const f of fitxers) {
    if (trobades.length >= 30) break;
    if (fora(f) || EXT_NO_TEXT.test(f) || LOCKFILES.has(basename(f))) continue;
    if (f.startsWith("scripts/fonaments/")) continue; // els patrons d'aquest mateix agent
    if (escanejat === "carpeta" && /^\.env/.test(basename(f))) continue; // sense git, el .env local es normal
    const text = llegir(dir, f);
    if (text == null || text.includes("\0")) continue;
    revisats++;

    const linies = text.split(/\r?\n/);
    for (let i = 0; i < linies.length && trobades.length < 30; i++) {
      for (const p of PATRONS) {
        const m = linies[i].match(p.re);
        if (!m) continue;
        if (p.valida && !p.valida(m)) continue;
        if (p.exceptuaFitxer && p.exceptuaFitxer(text)) continue;
        trobades.push({ tipus: p.tipus, fitxer: f, linia: i + 1 });
        break;
      }
    }
  }
  return { escanejat, fitxers: revisats, envSeguit, trobades };
}

/* ---------- Dades de menors ---------- */

const EXT_CODI = /\.([cm]?[jt]sx?|sql|py)$/i;

function teEsborratProgramat(text) {
  const re = /(DELETE\s+FROM|deleteMany|\.delete\(|SET\s+[^;\n]{0,80}\b(?:nom|name|email|correu)\s*=\s*NULL)[\s\S]{0,300}?(interval\s*'\s*\d+\s*(?:day|days|month|months|year|years)|RETENTION|retention|_DAYS\b|\bdies\b)/gi;
  let m;
  while ((m = re.exec(text))) {
    const finestra = text.slice(Math.max(0, m.index - 150), m.index + m[0].length);
    // Purgar sessions, tokens o el topall de peticions no es esborrar dades de l'alumnat.
    if (!/session|sessio|token|rate.?limit|verif|otp|magic|nonce|cache|lock/i.test(finestra)) return true;
  }
  return false;
}

function infoMenors(dir, fitxers) {
  const font = fitxers.filter(f => !fora(f) && !/(^|\/)docs?\//.test(f));
  const privacitat = font
    .filter(f => /(privacitat|privacidad|privacy|proteccio-?dades|proteccion-?datos)/i.test(f) &&
      /\.([cm]?[jt]sx?|html?|astro|vue|svelte|md|mdx)$/i.test(f) && !RE_PROVA.test(f))
    .slice(0, 10);

  const retencio = [];
  for (const f of font) {
    if (retencio.length >= 10) break;
    if (!EXT_CODI.test(f) || RE_PROVA.test(f)) continue;
    if (/(retenci|retention|purg|anonimitz|anonymi[sz])/i.test(f)) {
      retencio.push(f);
      continue;
    }
    const text = llegir(dir, f, 300 * 1024);
    if (text && teEsborratProgramat(text)) retencio.push(f);
  }
  return { privacitat, retencio };
}

/* ---------- Una app ---------- */

function revisarApp(c, appsDir) {
  const base = {
    slug: c.slug,
    nom: c.nom,
    carpeta: c.carpeta || null,
    bd: c.bd || null,
    menors: c.menors ?? null,
    nota: c.nota || null,
    railway: c.railway || [],
  };
  if (!c.carpeta) return base;

  const dir = join(appsDir, ...c.carpeta.split("/"));
  if (!existsSync(dir)) return { ...base, error: `La carpeta ${c.carpeta} no existeix` };

  try {
    const git = infoGit(dir);
    let fitxers = git.hiHa ? fitxersGit(dir) : null;
    const escanejat = fitxers ? "git" : "carpeta";
    if (!fitxers) fitxers = fitxersCarpeta(dir);

    return {
      ...base,
      git,
      proves: infoProves(dir, fitxers),
      copies: c.bd === "postgres" ? infoCopies(dir, fitxers, git.remot) : null,
      secrets: infoSecrets(dir, fitxers, escanejat),
      indicisMenors: c.menors ? infoMenors(dir, fitxers) : null,
    };
  } catch (e) {
    return { ...base, error: String(e.message || e).slice(0, 300) };
  }
}

/* ---------- Resum per terminal ---------- */

const CURT = { ok: "posat", mig: "a mitges", falta: "FALTA", nocal: "no cal", nd: "s/d" };

function imprimirResum(revisio) {
  const files = revisio.apps.map(app => ({ app, v: veredictes(app, null) }));
  const ample = Math.max(...files.map(f => f.app.nom.length), 3) + 2;
  const col = 12;
  console.log("\n" + "App".padEnd(ample) + PREGUNTES.map(p => p.titol.slice(0, col - 1).padEnd(col)).join(""));
  for (const f of files) {
    console.log(f.app.nom.padEnd(ample) + PREGUNTES.map(p => CURT[f.v[p.id].estat].padEnd(col)).join(""));
  }
  console.log("\n(«Producció = git» aquí només mira la carpeta; el panell la compara amb Railway.)");
  const primer = prioritats(files, 8);
  if (primer.length) {
    console.log("\nQuè arreglar primer:");
    // prioritats() torna grups (pregunta + estat) amb la llista d'apps.
    primer.forEach((p, i) => {
      const quantes = p.apps.length === 1 ? "1 app" : `${p.apps.length} apps`;
      console.log(`  ${i + 1}. ${p.pregunta} · ${CURT[p.estat]} a ${quantes}: ${p.apps.map(a => a.nom).join(", ")}`);
    });
  }
}

/* ---------- Principal ---------- */

async function principal() {
  const args = process.argv.slice(2);
  const enviar = args.includes("--enviar");
  const iApp = args.indexOf("--app");
  const nomesApp = iApp >= 0 ? args[iApp + 1] : null;

  carregarEnvLocal();
  const appsDir = process.env.APPS_DIR || resolve(ARREL_AULAIA, "..");
  const config = JSON.parse(readFileSync(join(AQUI, "apps.json"), "utf8"));

  const apps = [];
  for (const c of config) {
    if (nomesApp && c.slug !== nomesApp) continue;
    const t0 = Date.now();
    process.stderr.write(`· ${c.nom}… `);
    apps.push(revisarApp(c, appsDir));
    process.stderr.write(`${((Date.now() - t0) / 1000).toFixed(1)} s\n`);
  }
  if (!apps.length) {
    console.error(nomesApp ? `No hi ha cap app «${nomesApp}» a apps.json` : "apps.json és buit");
    process.exitCode = 1;
    return;
  }

  const revisio = { generada: new Date().toISOString(), origen: "agent local", apps };

  mkdirSync(SORTIDA, { recursive: true });
  const ultima = join(SORTIDA, "ultima.json");
  if (!nomesApp && existsSync(ultima)) copyFileSync(ultima, join(SORTIDA, "anterior.json"));
  writeFileSync(nomesApp ? join(SORTIDA, `app-${nomesApp}.json`) : ultima, JSON.stringify(revisio, null, 2));

  imprimirResum(revisio);

  if (!enviar) return;
  if (nomesApp) {
    console.error("\nNo s'envia una revisió d'una sola app: el panell la prendria per la revisió sencera.");
    return;
  }
  const url = process.env.FONAMENTS_URL || "https://www.aulaia.cat/api/fonaments";
  const token = process.env.FONAMENTS_TOKEN;
  if (!token) {
    console.error("\nNo s'ha enviat: falta FONAMENTS_TOKEN (a l'entorn o a %USERPROFILE%\\.aulaia\\fonaments.env).");
    process.exitCode = 2;
    return;
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(revisio),
      signal: AbortSignal.timeout(30000),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error(`\nNo s'ha enviat: el panell ha respost ${res.status} ${j.error || ""}`.trim());
      process.exitCode = 3;
    } else {
      console.log(`\nEnviada al panell: revisió ${j.id}, ${j.apps} apps (${url}).`);
    }
  } catch (e) {
    console.error(`\nNo s'ha enviat: ${e.message}`);
    process.exitCode = 3;
  }
}

principal();
