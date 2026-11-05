"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Assistent d ajuda amb botons. No es un xat amb IA: no genera res, nomes
 * guia i recull el que cal (qui ets, que necessites, quines apps). Aixi no pot
 * inventar-se res sobre privacitat, plaços o preus, i no te cost per missatge.
 * Les altes de centre porten a /alta; la resta va a /api/missatge, que valida.
 */

const T = {
  ca: {
    boto: "Ajuda i contacte",
    titol: "Ajuda d'aulaia.cat",
    tancar: "Tancar",
    enrere: "Enrere",
    nota: "Són aplicacions gratuïtes, en fase de prova, d'un projecte educatiu de l'Institut Escola Industrial de Sabadell. Les porta un equip molt reduït: pot ser que trigui uns dies a contestar-te.",
    perfil: { q: "Qui ets?", docent: "Docent", direccio: "Direcció o coordinació", altre: "Una altra persona" },
    tipus: {
      q: "Què necessites?",
      alta: "Vull l'alta per al meu centre",
      incidencia: "Tinc un problema amb una app",
      dubte: "Tinc un dubte",
      collaboracio: "Vull col·laborar o proposar una millora",
    },
    apps: {
      alta: "Quina app t'interessa?",
      incidencia: "Amb quina app tens el problema?",
      altre: "Quines apps t'interessen? (opcional)",
      continuar: "Continuar", saltar: "Saltar",
      construccio: " (en construcció)",
    },
    via: {
      q: "Com ens has trobat?",
      buscador: "Buscant a Google o similar", recomanacio: "Me'n han parlat",
      xarxes: "Xarxes socials", blog: "Un article del blog", altre: "D'una altra manera",
      saltar: "Saltar",
    },
    alta: {
      text: "Perfecte. L'alta es fa amb el formulari de sol·licitud, i t'hi portem amb l'app triada.",
      mes: "Si en vols més d'una, indica-ho al camp de missatge del formulari.",
      boto: "Anar al formulari d'alta",
    },
    form: {
      q: "Deixa'ns les teves dades i et responem",
      nom: "Nom i cognoms *", centre: "Centre (opcional)", correu: "Correu *",
      text: "Missatge *",
      ph: {
        incidencia: "Què passa? Què esperaves que passés? Si pots, digues-nos el dispositiu i el navegador.",
        dubte: "Quin és el teu dubte?",
        collaboracio: "Explica'ns la idea o com vols ajudar.",
      },
      consent1: "Accepto que tracteu les meves dades per respondre aquest missatge, tal com s'explica a la",
      consent2: "política de privacitat",
      enviar: "Enviar", enviant: "Enviant…",
    },
    fet: {
      titol: "Missatge enviat",
      text: "Gràcies! T'hem enviat un correu de confirmació. Et respondrem tan aviat com puguem.",
    },
    errors: {
      camps: "Falten camps obligatoris. Revisa el formulari.",
      email: "L'adreça de correu no sembla vàlida o és temporal.",
      consentiment: "Cal acceptar el tractament de dades per poder enviar-ho.",
      limit: "S'han enviat massa missatges recentment. Torna-ho a provar en una hora.",
      altre: "No s'ha pogut enviar. Torna-ho a provar en uns minuts o escriu a hola@aulaia.cat.",
    },
  },
  es: {
    boto: "Ayuda y contacto",
    titol: "Ayuda de aulaia.cat",
    tancar: "Cerrar",
    enrere: "Atrás",
    nota: "Son aplicaciones gratuitas, en fase de prueba, de un proyecto educativo del Institut Escola Industrial de Sabadell. Las lleva un equipo muy reducido: puede que tardemos unos días en contestarte.",
    perfil: { q: "¿Quién eres?", docent: "Docente", direccio: "Dirección o coordinación", altre: "Otra persona" },
    tipus: {
      q: "¿Qué necesitas?",
      alta: "Quiero el alta para mi centro",
      incidencia: "Tengo un problema con una app",
      dubte: "Tengo una duda",
      collaboracio: "Quiero colaborar o proponer una mejora",
    },
    apps: {
      alta: "¿Qué app te interesa?",
      incidencia: "¿Con qué app tienes el problema?",
      altre: "¿Qué apps te interesan? (opcional)",
      continuar: "Continuar", saltar: "Saltar",
      construccio: " (en construcción)",
    },
    via: {
      q: "¿Cómo nos has encontrado?",
      buscador: "Buscando en Google o similar", recomanacio: "Me han hablado de vosotros",
      xarxes: "Redes sociales", blog: "Un artículo del blog", altre: "De otra manera",
      saltar: "Saltar",
    },
    alta: {
      text: "Perfecto. El alta se hace con el formulario de solicitud, y te llevamos con la app elegida.",
      mes: "Si quieres más de una, indícalo en el campo de mensaje del formulario.",
      boto: "Ir al formulario de alta",
    },
    form: {
      q: "Déjanos tus datos y te respondemos",
      nom: "Nombre y apellidos *", centre: "Centro (opcional)", correu: "Correo *",
      text: "Mensaje *",
      ph: {
        incidencia: "¿Qué pasa? ¿Qué esperabas que pasara? Si puedes, dinos el dispositivo y el navegador.",
        dubte: "¿Cuál es tu duda?",
        collaboracio: "Cuéntanos la idea o cómo quieres ayudar.",
      },
      consent1: "Acepto que tratéis mis datos para responder a este mensaje, tal como se explica en la",
      consent2: "política de privacidad",
      enviar: "Enviar", enviant: "Enviando…",
    },
    fet: {
      titol: "Mensaje enviado",
      text: "¡Gracias! Te hemos enviado un correo de confirmación. Te responderemos en cuanto podamos.",
    },
    errors: {
      camps: "Faltan campos obligatorios. Revisa el formulario.",
      email: "La dirección de correo no parece válida o es temporal.",
      consentiment: "Hay que aceptar el tratamiento de datos para poder enviarlo.",
      limit: "Se han enviado demasiados mensajes recientemente. Vuelve a intentarlo en una hora.",
      altre: "No se ha podido enviar. Vuelve a intentarlo en unos minutos o escribe a hola@aulaia.cat.",
    },
  },
};

const PERFILS = ["docent", "direccio", "altre"];
const TIPUS = ["alta", "incidencia", "dubte", "collaboracio"];
const VIES = ["buscador", "recomanacio", "xarxes", "blog", "altre"];

export default function Assistent({ lang, apps }) {
  const t = T[lang];
  const base = lang === "es" ? "/es" : "";
  const pathname = usePathname();

  const [obert, setObert] = useState(false);
  const [pas, setPas] = useState("perfil");
  const [historial, setHistorial] = useState([]);
  const [perfil, setPerfil] = useState("");
  const [tipus, setTipus] = useState("");
  const [triades, setTriades] = useState([]);
  const [via, setVia] = useState("");
  const [enviant, setEnviant] = useState(false);
  const [error, setError] = useState(null);
  const [alcadaBaner, setAlcadaBaner] = useState(0);
  const titolRef = useRef(null);

  // El bàner de galetes es fixat a baix i taparia el botó: s'hi posa a sobre mentre hi sigui.
  useEffect(() => {
    const mesura = () => setAlcadaBaner(document.querySelector(".cookie-banner")?.offsetHeight || 0);
    mesura();
    const canvis = new MutationObserver(mesura);
    canvis.observe(document.body, { childList: true });
    window.addEventListener("resize", mesura);
    return () => { canvis.disconnect(); window.removeEventListener("resize", mesura); };
  }, []);

  // Tanca amb Esc i porta el focus al titol a cada pas, perque un lector de pantalla llegeixi la pregunta nova.
  useEffect(() => {
    if (!obert) return;
    const alTeclat = e => { if (e.key === "Escape") setObert(false); };
    document.addEventListener("keydown", alTeclat);
    return () => document.removeEventListener("keydown", alTeclat);
  }, [obert]);

  useEffect(() => {
    if (obert) titolRef.current?.focus();
  }, [obert, pas]);

  // Al panell no hi pinta res: es una eina per a qui visita el web.
  if (pathname?.startsWith("/panel")) return null;

  function anar(seguent) {
    setHistorial(h => [...h, pas]);
    setPas(seguent);
    setError(null);
  }

  function enrere() {
    setPas(historial[historial.length - 1] || "perfil");
    setHistorial(h => h.slice(0, -1));
    setError(null);
  }

  function reiniciar() {
    setPas("perfil"); setHistorial([]); setPerfil(""); setTipus("");
    setTriades([]); setVia(""); setError(null); setEnviant(false);
  }

  function tancar() {
    setObert(false);
    if (pas === "fet") reiniciar();
  }

  function alternarApp(slug) {
    if (tipus === "alta") {
      // L alta es d una app cada vegada: es tria una sola.
      setTriades(p => (p.includes(slug) ? [] : [slug]));
      return;
    }
    setTriades(p => (p.includes(slug) ? p.filter(s => s !== slug) : [...p, slug]));
  }

  async function enviar(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEnviant(true);
    setError(null);
    try {
      const res = await fetch("/api/missatge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipus, perfil, via, apps: triades, idioma: lang,
          nom: f.get("nom"), centre: f.get("centre"), correu: f.get("correu"), text: f.get("text"),
          consentiment: f.get("consentiment") === "on",
          web: f.get("web"),
        }),
      });
      const cos = await res.json().catch(() => ({}));
      if (res.ok && cos.ok) {
        setHistorial([]);
        setPas("fet");
      } else {
        setError(t.errors[cos.error] ? cos.error : "altre");
      }
    } catch {
      setError("altre");
    }
    setEnviant(false);
  }

  const esAlta = tipus === "alta";
  const titolApps = esAlta ? t.apps.alta : tipus === "incidencia" ? t.apps.incidencia : t.apps.altre;
  // L app es obligatoria per a una alta i per a una incidencia; per a la resta es pot saltar.
  const appObligatoria = esAlta || tipus === "incidencia";
  const hrefAlta = `${base}/alta${triades[0] ? "?app=" + encodeURIComponent(triades[0]) : ""}`;

  return (
    <div className="asst" style={{ "--asst-baix": alcadaBaner + "px" }}>
      {obert && (
        <section className="asst-panell" role="dialog" aria-label={t.titol}>
          <header className="asst-cap">
            <strong>{t.titol}</strong>
            <button type="button" className="asst-tanca" onClick={tancar} aria-label={t.tancar}>×</button>
          </header>

          <div className="asst-cos">
            {pas === "perfil" && (
              <>
                <p className="asst-nota">{t.nota}</p>
                <h2 className="asst-q" tabIndex={-1} ref={titolRef}>{t.perfil.q}</h2>
                <div className="asst-opcions">
                  {PERFILS.map(p => (
                    <button key={p} type="button" className="asst-opcio" onClick={() => { setPerfil(p); anar("tipus"); }}>
                      {t.perfil[p]}
                    </button>
                  ))}
                </div>
              </>
            )}

            {pas === "tipus" && (
              <>
                <h2 className="asst-q" tabIndex={-1} ref={titolRef}>{t.tipus.q}</h2>
                <div className="asst-opcions">
                  {TIPUS.map(k => (
                    <button key={k} type="button" className="asst-opcio" onClick={() => { setTipus(k); setTriades([]); anar("apps"); }}>
                      {t.tipus[k]}
                    </button>
                  ))}
                </div>
              </>
            )}

            {pas === "apps" && (
              <>
                <h2 className="asst-q" tabIndex={-1} ref={titolRef}>{titolApps}</h2>
                <div className="asst-chips">
                  {apps.map(a => (
                    <button
                      key={a.slug}
                      type="button"
                      className={"asst-chip" + (triades.includes(a.slug) ? " is-actiu" : "")}
                      aria-pressed={triades.includes(a.slug)}
                      onClick={() => alternarApp(a.slug)}
                    >
                      {a.nom}{a.estat === "construccio" ? t.apps.construccio : ""}
                    </button>
                  ))}
                </div>
                <div className="asst-accions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={appObligatoria && triades.length === 0}
                    onClick={() => anar(esAlta ? "alta" : "via")}
                  >
                    {triades.length === 0 && !appObligatoria ? t.apps.saltar : t.apps.continuar}
                  </button>
                </div>
              </>
            )}

            {pas === "alta" && (
              <>
                <h2 className="asst-q" tabIndex={-1} ref={titolRef}>{t.tipus.alta}</h2>
                <p>{t.alta.text}</p>
                {triades.length > 1 && <p className="asst-nota">{t.alta.mes}</p>}
                <div className="asst-accions">
                  <Link href={hrefAlta} className="btn btn-primary" onClick={() => setObert(false)}>{t.alta.boto}</Link>
                </div>
              </>
            )}

            {pas === "via" && (
              <>
                <h2 className="asst-q" tabIndex={-1} ref={titolRef}>{t.via.q}</h2>
                <div className="asst-opcions">
                  {VIES.map(v => (
                    <button key={v} type="button" className="asst-opcio" onClick={() => { setVia(v); anar("form"); }}>
                      {t.via[v]}
                    </button>
                  ))}
                </div>
                <div className="asst-accions">
                  <button type="button" className="btn btn-outline" onClick={() => { setVia(""); anar("form"); }}>{t.via.saltar}</button>
                </div>
              </>
            )}

            {pas === "form" && (
              <form onSubmit={enviar} className="asst-form">
                <h2 className="asst-q" tabIndex={-1} ref={titolRef}>{t.form.q}</h2>
                {error && <p className="alta-error" role="alert">{t.errors[error]}</p>}
                {/* Camp trampa: una persona no el veu ni el llegeix, un bot l'omple. */}
                <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
                  <label htmlFor="asst-web">No ompliu aquest camp</label>
                  <input id="asst-web" name="web" type="text" tabIndex={-1} autoComplete="off" />
                </div>
                <div className="form-group">
                  <label htmlFor="asst-nom">{t.form.nom}</label>
                  <input id="asst-nom" name="nom" type="text" required maxLength={160} autoComplete="name" />
                </div>
                <div className="form-group">
                  <label htmlFor="asst-centre">{t.form.centre}</label>
                  <input id="asst-centre" name="centre" type="text" maxLength={200} autoComplete="organization" />
                </div>
                <div className="form-group">
                  <label htmlFor="asst-correu">{t.form.correu}</label>
                  <input id="asst-correu" name="correu" type="email" required maxLength={200} autoComplete="email" />
                </div>
                <div className="form-group">
                  <label htmlFor="asst-text">{t.form.text}</label>
                  <textarea id="asst-text" name="text" rows={4} required maxLength={2000} placeholder={t.form.ph[tipus] || ""} />
                </div>
                <label className="asst-consent">
                  <input type="checkbox" name="consentiment" required />
                  <span>{t.form.consent1} <Link href="/privacitat" target="_blank">{t.form.consent2}</Link>.</span>
                </label>
                <button type="submit" className="btn-submit" disabled={enviant}>{enviant ? t.form.enviant : t.form.enviar}</button>
              </form>
            )}

            {pas === "fet" && (
              <>
                <h2 className="asst-q" tabIndex={-1} ref={titolRef}>{t.fet.titol}</h2>
                <p>{t.fet.text}</p>
                <p className="asst-nota">{t.nota}</p>
                <div className="asst-accions">
                  <button type="button" className="btn btn-outline" onClick={tancar}>{t.tancar}</button>
                </div>
              </>
            )}
          </div>

          {historial.length > 0 && pas !== "fet" && (
            <footer className="asst-peu">
              <button type="button" className="asst-enrere" onClick={enrere}>← {t.enrere}</button>
            </footer>
          )}
        </section>
      )}

      <button type="button" className="asst-boto" aria-expanded={obert} onClick={() => (obert ? tancar() : setObert(true))}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path fill="currentColor" d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
        </svg>
        <span>{t.boto}</span>
      </button>
    </div>
  );
}
