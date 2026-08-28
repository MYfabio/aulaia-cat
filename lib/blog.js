import "server-only";
import fs from "node:fs";
import path from "node:path";

/**
 * Els articles son fitxers Markdown a content/blog.
 *
 * No hi ha cap llibreria de Markdown: el projecte no en te cap i no val la
 * pena carregar-ne dues per a la mitja dotzena de coses que fem servir. El
 * que hi ha aqui admet titols, paragrafs, negreta, cursiva, enllaços,
 * llistes, cites i codi. Res mes, i a proposit.
 */

const CARPETA = path.join(process.cwd(), "content", "blog");

/* ---------- Capçalera del fitxer ---------- */

/**
 * Llegeix el bloc entre --- del principi. Els valors son text pla, tret dels
 * que van entre claudators, que son llistes.
 */
function separaCapcalera(cru) {
  const m = cru.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { dades: {}, cos: cru };

  const dades = {};
  for (const linia of m[1].split(/\r?\n/)) {
    const tall = linia.indexOf(":");
    if (tall < 0) continue;
    const clau = linia.slice(0, tall).trim();
    let valor = linia.slice(tall + 1).trim();
    if (valor.startsWith("[") && valor.endsWith("]")) {
      dades[clau] = valor
        .slice(1, -1)
        .split(",")
        .map(v => v.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else {
      dades[clau] = valor.replace(/^["']|["']$/g, "");
    }
  }
  return { dades, cos: m[2] };
}

/* ---------- Markdown ---------- */

/** El contingut es nostre, pero s escapa igualment: es mes barat que confiar. */
function escapa(t) {
  return t
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Negreta, cursiva, codi i enllaços dins d una linia. */
function enLinia(t) {
  return t
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, url) => {
      const fora = /^https?:\/\//.test(url) && !url.includes("aulaia.cat");
      const extra = fora ? ' target="_blank" rel="noopener"' : "";
      return `<a href="${url}"${extra}>${text}</a>`;
    });
}

/**
 * De Markdown a HTML, linia a linia. Es prou per a un article: el que no
 * entengui, ho deixa com a paragraf, que sempre es llegible.
 */
export function aHtml(md) {
  const linies = escapa(md).split(/\r?\n/);
  const fora = [];
  let paragraf = [];
  let llista = null; // "ul" | "ol"
  let cita = [];

  const tancaParagraf = () => {
    if (paragraf.length) {
      fora.push(`<p>${enLinia(paragraf.join(" "))}</p>`);
      paragraf = [];
    }
  };
  const tancaLlista = () => {
    if (llista) {
      fora.push(`</${llista}>`);
      llista = null;
    }
  };
  const tancaCita = () => {
    if (cita.length) {
      fora.push(`<blockquote><p>${enLinia(cita.join(" "))}</p></blockquote>`);
      cita = [];
    }
  };
  const tancaTot = () => {
    tancaParagraf();
    tancaLlista();
    tancaCita();
  };

  for (const linia of linies) {
    const l = linia.trimEnd();

    if (!l.trim()) {
      tancaTot();
      continue;
    }

    const titol = l.match(/^(#{2,4})\s+(.*)$/);
    if (titol) {
      tancaTot();
      const nivell = titol[1].length;
      fora.push(`<h${nivell}>${enLinia(titol[2])}</h${nivell}>`);
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(l.trim())) {
      tancaTot();
      fora.push("<hr />");
      continue;
    }

    const citaM = l.match(/^>\s?(.*)$/);
    if (citaM) {
      tancaParagraf();
      tancaLlista();
      cita.push(citaM[1]);
      continue;
    }

    const punt = l.match(/^\s*[-*]\s+(.*)$/);
    if (punt) {
      tancaParagraf();
      tancaCita();
      if (llista !== "ul") {
        tancaLlista();
        fora.push("<ul>");
        llista = "ul";
      }
      fora.push(`<li>${enLinia(punt[1])}</li>`);
      continue;
    }

    const numerat = l.match(/^\s*\d+\.\s+(.*)$/);
    if (numerat) {
      tancaParagraf();
      tancaCita();
      if (llista !== "ol") {
        tancaLlista();
        fora.push("<ol>");
        llista = "ol";
      }
      fora.push(`<li>${enLinia(numerat[1])}</li>`);
      continue;
    }

    tancaLlista();
    tancaCita();
    paragraf.push(l.trim());
  }

  tancaTot();
  return fora.join("\n");
}

/* ---------- Lectura ---------- */

function llegeixFitxer(fitxer) {
  const cru = fs.readFileSync(path.join(CARPETA, fitxer), "utf8");
  const { dades, cos } = separaCapcalera(cru);
  const paraules = cos.split(/\s+/).filter(Boolean).length;

  return {
    slug: fitxer.replace(/\.md$/, ""),
    titol: dades.titol || fitxer,
    resum: dades.resum || "",
    data: dades.data || "",
    autor: dades.autor || "Fabio Martínez",
    etiquetes: dades.etiquetes || [],
    apps: dades.apps || [],
    /** Capçalera de l article. Serveix tambe d imatge en compartir l enllaç. */
    imatge: dades.imatge || null,
    imatgeAlt: dades.imatgeAlt || "",
    esborrany: dades.esborrany === "true",
    /** Un adult llegeix unes 200 paraules per minut. */
    minuts: Math.max(1, Math.round(paraules / 200)),
    cos,
  };
}

/** Els articles publicats, del mes nou al mes vell. Els esborranys no hi son. */
export function llistarArticles() {
  if (!fs.existsSync(CARPETA)) return [];
  return fs
    .readdirSync(CARPETA)
    .filter(f => f.endsWith(".md"))
    .map(llegeixFitxer)
    .filter(a => !a.esborrany)
    .sort((a, b) => (a.data < b.data ? 1 : -1));
}

/** Un article, ja convertit a HTML. Torna null si no existeix o es esborrany. */
export function llegirArticle(slug) {
  const fitxer = `${slug}.md`;
  if (!fs.existsSync(path.join(CARPETA, fitxer))) return null;
  const a = llegeixFitxer(fitxer);
  if (a.esborrany) return null;
  return { ...a, html: aHtml(a.cos) };
}
