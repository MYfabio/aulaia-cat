/**
 * Fonaments: cinc preguntes que diuen si una app te pilots a sota o chatarra.
 *
 * Funcions pures, sense "server-only": les fa servir el panell (que hi afegeix
 * les dades de Railway) i tambe l'script local que fa la revisio
 * (scripts/fonaments/revisar.mjs), que no te acces a Railway.
 *
 * Cada veredicte es { estat, resum, detall[] }. L'estat es un d'ESTATS.
 */

export const PREGUNTES = [
  {
    id: "produccio",
    titol: "Producció = git",
    pregunta: "El que corre a Railway és l'últim commit de GitHub, i a la carpeta no hi ha feina sense pujar?",
  },
  {
    id: "copies",
    titol: "Còpies",
    pregunta: "Hi ha còpia diària de la base de dades, xifrada, i s'ha provat de restaurar?",
  },
  {
    id: "secrets",
    titol: "Secrets",
    pregunta: "Cap clau ni contrasenya dins del codi?",
  },
  {
    id: "proves",
    titol: "Proves",
    pregunta: "Hi ha proves automàtiques i corren soles abans de desplegar?",
  },
  {
    id: "menors",
    titol: "Dades de menors",
    pregunta: "Si guarda dades d'alumnat, hi ha pàgina de privacitat i un esborrat programat?",
  },
];

export const ESTATS = {
  ok:    { text: "Posat",       cls: "ok",   pes: 0 },
  mig:   { text: "A mitges",    cls: "wait", pes: 1 },
  falta: { text: "Falta",       cls: "bad",  pes: 2 },
  nocal: { text: "No cal",      cls: "off",  pes: -1 },
  nd:    { text: "Sense dades", cls: "off",  pes: -1 },
};

function v(estat, resum, detall = []) {
  return { estat, resum, detall };
}

/** «1 fitxer», «3 fitxers». */
function n(quants, singular, plural) {
  return `${quants} ${quants === 1 ? singular : plural}`;
}

/** De diverses parts [estat, text], la pitjor mana. "info" no compta. */
function combinarPitjor(parts) {
  const compten = parts.filter(p => p[0] !== "info");
  const amb = compten.filter(p => ESTATS[p[0]].pes >= 0);
  const detall = parts.map(p => p[1]);
  if (amb.length === 0) {
    return v("nd", compten[0]?.[1] || "Sense dades", detall);
  }
  const pitjor = amb.reduce((a, b) => (ESTATS[b[0]].pes > ESTATS[a[0]].pes ? b : a));
  return v(pitjor[0], pitjor[1], detall);
}

/* ---------- 1. Produccio = git ---------- */

export function veredicteProduccio(app, railway) {
  if (!app.carpeta) return v("nd", "Sense carpeta local: revisar-ho a mà");
  if (app.error) return v("nd", "La revisió ha fallat", [app.error]);
  const g = app.git || {};
  if (!g.hiHa) {
    return v("falta", "Sense git: el codi només és a la carpeta i a Railway", [
      "Si el disc falla o es puja una versió a mitges, no hi ha cap història per tornar enrere.",
    ]);
  }

  const parts = [];
  if (!g.remot) parts.push(["falta", "La carpeta té git però cap repositori a GitHub"]);

  const objectius = app.railway || [];
  if (objectius.length === 0) {
    parts.push(["nd", "No té cap servei de Railway apuntat"]);
  } else if (!railway) {
    parts.push(["nd", "Railway no consultat: només dades de la carpeta"]);
  } else if (railway.error) {
    parts.push(["nd", "No s'ha pogut consultar Railway: " + railway.error]);
  } else {
    for (const o of objectius) {
      const projecte = railway.apps.find(a => a.name === o.projecte);
      if (!projecte) { parts.push(["nd", `No trobo el projecte «${o.projecte}» a Railway`]); continue; }
      const servei = projecte.services.find(s => s.name === o.servei);
      if (!servei) { parts.push(["nd", `No trobo el servei «${o.servei}» a ${o.projecte}`]); continue; }
      const d = servei.deploy;
      if (!d) { parts.push(["nd", `${o.servei}: sense cap desplegament`]); continue; }
      if (!d.hash) {
        parts.push(["falta", `${o.servei}: pujat amb railway up, no se sap quin codi corre`]);
        continue;
      }
      if (d.branch && g.branca && d.branch !== g.branca) {
        parts.push(["info", `La carpeta és a la branca ${g.branca}; Railway desplega ${d.branch}`]);
      }
      const cap = d.branch ? (g.caps || {})[d.branch] : null;
      if (!cap) {
        parts.push(["mig", `${o.servei}: desplega la branca ${d.branch || "?"}, que no trobo a GitHub`]);
      } else if (cap.startsWith(d.hash)) {
        parts.push(["ok", `${o.servei}: corre l'últim commit de ${d.branch} (${d.hash})`]);
      } else {
        parts.push(["mig", `${o.servei}: corre ${d.hash}, però ${d.branch} ja és a ${cap.slice(0, 7)}`]);
      }
    }
  }

  if (g.brutes > 0) parts.push(["mig", `${n(g.brutes, "fitxer", "fitxers")} sense commit a la carpeta`]);
  if (g.perPujar > 0) parts.push(["mig", `${n(g.perPujar, "commit", "commits")} sense pujar a GitHub (${g.branca})`]);
  if (g.remot && g.branca && g.brancaRemota === false) {
    parts.push(["mig", `La branca ${g.branca} només és en aquesta carpeta`]);
  }
  if (!parts.some(p => p[0] === "mig" || p[0] === "falta")) {
    parts.push(["info", "La carpeta està neta i al dia amb GitHub"]);
  }
  return combinarPitjor(parts);
}

/* ---------- 2. Copies de la base de dades ---------- */

export function veredicteCopies(app, railway) {
  if (!app.bd) return v("nocal", "Sense base de dades");
  if (app.bd === "firebase") {
    return v("nd", "Firestore: les exportacions es miren a Google Cloud");
  }
  if (!app.carpeta) return v("nd", "Sense carpeta local: revisar-ho a mà");

  const c = app.copies || {};
  const parts = [];

  for (const w of c.workflows || []) {
    let estat = "ok";
    const notes = [];
    const empitjora = e => { if (ESTATS[e].pes > ESTATS[estat].pes) estat = e; };
    if (!w.ultima) {
      empitjora("mig");
      notes.push("no s'ha pogut veure si corre");
    } else if (w.ultima.estat === "mai") {
      empitjora("falta");
      notes.push("no ha corregut mai");
    } else if (!w.ultima.conclusio && w.ultima.estat !== "completed") {
      empitjora("mig");
      notes.push("està corrent ara mateix");
    } else if (w.ultima.conclusio !== "success") {
      empitjora("falta");
      notes.push(`l'última ha acabat en «${w.ultima.conclusio || w.ultima.estat || "?"}»`);
    } else {
      const dies = Math.floor((Date.now() - Date.parse(w.ultima.data)) / 86400000);
      if (dies > 3) { empitjora("mig"); notes.push(`l'última bona és de fa ${dies} dies`); }
    }
    if (!w.restaura) { empitjora("mig"); notes.push("no prova la restauració"); }
    if (!w.xifra) { empitjora("mig"); notes.push("el volcat no va xifrat"); }
    parts.push([estat, `${w.fitxer}: ${notes.length ? notes.join(", ") : "corre, va xifrada i prova la restauració"}`]);
  }

  for (const s of c.scripts || []) parts.push(["mig", `Script de còpia ${s}: no se sap si corre`]);

  if (railway && !railway.error) {
    for (const o of app.railway || []) {
      const projecte = railway.apps.find(a => a.name === o.projecte);
      const copia = projecte?.services.find(s => /backup|copia/i.test(s.name));
      if (copia) parts.push(["mig", `Servei «${copia.name}» a Railway: restauració no comprovada`]);
    }
  }

  if (parts.length === 0) {
    return v("falta", "Cap còpia automàtica", [
      "Si la base de dades es corromp o s'esborra, no hi ha d'on recuperar-la.",
      "Les còpies del volum de Railway, si estan activades, no es veuen des d'aquí.",
      "Com posar-la: skill copies-seguretat-bd.",
    ]);
  }
  // N'hi ha prou amb un mecanisme bo: aqui mana el millor, no el pitjor.
  const millor = parts.reduce((a, b) => (ESTATS[b[0]].pes < ESTATS[a[0]].pes ? b : a));
  return v(millor[0], millor[1], parts.map(p => p[1]));
}

/* ---------- 3. Secrets ---------- */

export function veredicteSecrets(app) {
  if (!app.carpeta) return v("nd", "Sense carpeta local: revisar-ho a mà");
  if (app.error) return v("nd", "La revisió ha fallat", [app.error]);
  const s = app.secrets || {};
  const linies = [];
  for (const f of s.envSeguit || []) linies.push(`${f} és dins de git`);
  for (const t of s.trobades || []) linies.push(`${t.tipus} a ${t.fitxer}${t.linia ? ":" + t.linia : ""}`);
  if (app.git?.remotAmbToken) linies.push("L'adreça del remot de git porta un token");

  if (linies.length) {
    return v("falta", linies.length === 1 ? linies[0] : `${linies.length} indicis de secrets al codi`, [
      ...linies,
      "Si és una clau real: revocar-la i fer-ne una de nova. Esborrar-la no n'hi ha prou, queda a l'historial.",
    ]);
  }
  return v(
    "ok",
    `Res als ${n(s.fitxers, "fitxer", "fitxers")} ${s.escanejat === "carpeta" ? "de la carpeta" : "de git"}`,
    ["L'historial de git no es revisa: una clau esborrada fa temps hi pot seguir."]
  );
}

/* ---------- 4. Proves ---------- */

export function veredicteProves(app) {
  if (!app.carpeta) return v("nd", "Sense carpeta local: revisar-ho a mà");
  if (app.error) return v("nd", "La revisió ha fallat", [app.error]);
  const p = app.proves || {};
  const hiHa = p.script || p.fitxers > 0;
  const detall = (p.ciFitxers || []).map(f => `Corren a ${f}`);
  const quantes = p.fitxers > 0 ? n(p.fitxers, "fitxer de prova", "fitxers de prova") : "Ordre «test» sense fitxers de prova";
  if (hiHa && p.ci) return v("ok", `${quantes}, corren a GitHub Actions`, detall);
  if (hiHa) {
    return v("mig", `${quantes}, però no corren soles`, [
      "Les proves només serveixen si algú les passa: un workflow de GitHub les passaria a cada push.",
    ]);
  }
  return v("falta", "Cap prova automàtica", ["Tot es comprova a mà, i a mà vol dir que moltes coses no es comproven."]);
}

/* ---------- 5. Dades de menors ---------- */

export function veredicteMenors(app) {
  if (app.menors === false) return v("nocal", "No guarda dades d'alumnat");
  if (app.menors == null) return v("nd", "Per confirmar si guarda dades d'alumnat");
  if (!app.carpeta) return v("nd", "Sense carpeta local: revisar-ho a mà");
  if (app.error) return v("nd", "La revisió ha fallat", [app.error]);

  const m = app.indicisMenors || {};
  const priv = m.privacitat || [];
  const ret = m.retencio || [];
  const detall = [
    ...priv.map(f => `Privacitat: ${f}`),
    ...ret.map(f => `Esborrat: ${f}`),
    "Són indicis automàtics: cal mirar que el termini que diu la pàgina sigui el que fa el codi.",
  ];
  if (priv.length && ret.length) return v("ok", "Pàgina de privacitat i esborrat programat", detall);
  if (priv.length) return v("mig", "Té pàgina de privacitat, però no trobo cap esborrat programat", detall);
  if (ret.length) return v("mig", "Esborra dades antigues, però no trobo pàgina de privacitat", detall);
  return v("falta", "Ni pàgina de privacitat ni esborrat programat", [
    "Com fer-ho: skill privacitat-menors.",
  ]);
}

/* ---------- Conjunt ---------- */

export function veredictes(app, railway) {
  return {
    produccio: veredicteProduccio(app, railway),
    copies: veredicteCopies(app, railway),
    secrets: veredicteSecrets(app),
    proves: veredicteProves(app),
    menors: veredicteMenors(app),
  };
}

/** Quantes apps tenen cada pilot posat, sobre les que el necessiten. */
export function resumPerPregunta(files) {
  return PREGUNTES.map(p => {
    const aplicables = files.filter(f => ESTATS[f.v[p.id].estat].pes >= 0);
    return {
      ...p,
      ok: aplicables.filter(f => f.v[p.id].estat === "ok").length,
      aplicables: aplicables.length,
    };
  });
}

/**
 * Que arreglar primer. Un secret al codi o una base de dades d'alumnat sense
 * copia passen davant de tot; les proves, al final.
 */
const PES_PRIORITAT = {
  secrets:   { falta: 100, mig: 40 },
  copies:    { falta: 70, mig: 25 },
  produccio: { falta: 60, mig: 30 },
  menors:    { falta: 50, mig: 20 },
  proves:    { falta: 15, mig: 5 },
};

/**
 * Agrupa per pregunta i estat: «Còpies · falta a 15 apps» diu mes que quinze
 * linies iguals. Dins de cada grup, primer les apps amb dades d'alumnat.
 */
export function prioritats(files, max = 6) {
  const grups = new Map();
  for (const f of files) {
    for (const p of PREGUNTES) {
      const ver = f.v[p.id];
      let pes = PES_PRIORITAT[p.id][ver.estat];
      if (!pes) continue;
      const alumnat = f.app.menors === true;
      if (alumnat && (p.id === "copies" || p.id === "produccio")) pes += 20;
      const clau = p.id + ":" + ver.estat;
      if (!grups.has(clau)) grups.set(clau, { id: p.id, pregunta: p.titol, estat: ver.estat, pes: 0, apps: [] });
      const g = grups.get(clau);
      g.pes = Math.max(g.pes, pes);
      g.apps.push({ slug: f.app.slug, nom: f.app.nom, resum: ver.resum, alumnat });
    }
  }
  return [...grups.values()]
    .map(g => ({ ...g, apps: g.apps.sort((a, b) => Number(b.alumnat) - Number(a.alumnat)) }))
    .sort((a, b) => b.pes - a.pes || b.apps.length - a.apps.length)
    .slice(0, max);
}

/* ---------- Validacio del que envia l'agent ---------- */

const SLUG = /^[a-z0-9-]{1,60}$/;
const CLAUS_PROHIBIDES = new Set(["__proto__", "constructor", "prototype"]);

const str = (x, max = 200) => (typeof x === "string" && x.length ? x.slice(0, max) : null);
const enter = x => (Number.isFinite(x) ? Math.max(0, Math.min(1e6, Math.trunc(x))) : null);
const bool = x => x === true;
const tri = x => (x === true ? true : x === false ? false : null);
const llista = (x, max, f) => (Array.isArray(x) ? x.slice(0, max).map(f).filter(y => y != null) : []);

function netejarCaps(c) {
  const out = {};
  if (!c || typeof c !== "object") return out;
  for (const [k, sha] of Object.entries(c).slice(0, 200)) {
    if (CLAUS_PROHIBIDES.has(k) || k.length > 120) continue;
    if (typeof sha === "string" && /^[0-9a-f]{7,40}$/.test(sha)) out[k] = sha;
  }
  return out;
}

/**
 * Reconstrueix la revisio nomes amb els camps coneguts i amb mides acotades.
 * Torna null si no te la forma esperada. Mai guardem res que no sapiguem
 * pintar, i l'agent no envia mai valors de secrets: nomes tipus, fitxer i linia.
 */
export function netejarRevisio(cos) {
  if (!cos || typeof cos !== "object" || !Array.isArray(cos.apps)) return null;
  if (cos.apps.length === 0 || cos.apps.length > 80) return null;

  const apps = [];
  for (const a of cos.apps) {
    if (!a || typeof a !== "object" || !SLUG.test(a.slug)) return null;
    const g = a.git && typeof a.git === "object" ? a.git : null;
    const p = a.proves && typeof a.proves === "object" ? a.proves : null;
    const c = a.copies && typeof a.copies === "object" ? a.copies : null;
    const s = a.secrets && typeof a.secrets === "object" ? a.secrets : null;
    const m = a.indicisMenors && typeof a.indicisMenors === "object" ? a.indicisMenors : null;

    apps.push({
      slug: a.slug,
      nom: str(a.nom, 80) || a.slug,
      carpeta: str(a.carpeta, 200),
      bd: a.bd === "postgres" || a.bd === "firebase" ? a.bd : null,
      menors: tri(a.menors),
      nota: str(a.nota, 300),
      error: str(a.error, 300),
      railway: llista(a.railway, 6, r =>
        r && str(r.projecte, 80) && str(r.servei, 80) ? { projecte: str(r.projecte, 80), servei: str(r.servei, 80) } : null
      ),
      git: g && {
        hiHa: bool(g.hiHa),
        remot: str(g.remot, 120),
        remotAmbToken: bool(g.remotAmbToken),
        branca: str(g.branca, 120),
        head: str(g.head, 40),
        brutes: enter(g.brutes),
        perPujar: enter(g.perPujar),
        brancaRemota: tri(g.brancaRemota),
        ultimCommit: str(g.ultimCommit, 40),
        caps: netejarCaps(g.caps),
      },
      proves: p && {
        script: bool(p.script),
        fitxers: enter(p.fitxers) ?? 0,
        ci: bool(p.ci),
        ciFitxers: llista(p.ciFitxers, 10, x => str(x, 200)),
      },
      copies: c && {
        workflows: llista(c.workflows, 10, w =>
          w && str(w.fitxer, 200)
            ? {
                fitxer: str(w.fitxer, 200),
                restaura: bool(w.restaura),
                xifra: bool(w.xifra),
                ultima: w.ultima && typeof w.ultima === "object"
                  ? { conclusio: str(w.ultima.conclusio, 40), estat: str(w.ultima.estat, 40), data: str(w.ultima.data, 40) }
                  : null,
              }
            : null
        ),
        scripts: llista(c.scripts, 10, x => str(x, 200)),
      },
      secrets: s && {
        escanejat: s.escanejat === "carpeta" ? "carpeta" : "git",
        fitxers: enter(s.fitxers) ?? 0,
        envSeguit: llista(s.envSeguit, 20, x => str(x, 200)),
        trobades: llista(s.trobades, 30, t =>
          t && str(t.tipus, 60) && str(t.fitxer, 200) ? { tipus: str(t.tipus, 60), fitxer: str(t.fitxer, 200), linia: enter(t.linia) } : null
        ),
      },
      indicisMenors: m && {
        privacitat: llista(m.privacitat, 10, x => str(x, 200)),
        retencio: llista(m.retencio, 10, x => str(x, 200)),
      },
    });
  }
  return { versio: 1, generada: str(cos.generada, 40), origen: str(cos.origen, 80), apps };
}
