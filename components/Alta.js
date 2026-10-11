import Link from "next/link";
import { appsEn, base } from "../lib/i18n";

const T = {
  ca: {
    metaTitol: "Sol·licita accés per al teu centre",
    metaDesc: "Formulari únic per demanar accés o una demo de qualsevol de les aplicacions educatives d'aulaia.cat. Et responem amb les instruccions per començar.",
    rols: ["Direcció", "Coordinació digital", "Coordinació pedagògica", "Docent", "Altres"],
    okTitol: "Sol·licitud rebuda",
    okText: "Gràcies. Revisem cada petició a mà per assegurar-nos que el centre queda ben configurat des del primer dia, així que et respondrem al correu que ens has indicat.",
    okSub: "Si en un parell de dies no has rebut resposta, escriu-nos a",
    tornar: "Tornar a l'inici",
    eyebrow: "Alta de centre o demo",
    h1: "Sol·licita accés per al teu centre",
    intro: "Un sol formulari per a totes les aplicacions, tant si vols començar com si primer vols una demo. Ens dius qui ets i què necessites, i et responem amb els passos.",
    arribat: "Has arribat des de",
    errors: {
      camps: "Falten camps obligatoris. Revisa el formulari.",
      email: "L'adreça de correu no sembla vàlida o és temporal (tempmail, etc.).",
      limit: "S'han enviat massa sol·licituds recentment. Torna-ho a provar en una hora.",
      token: "L'enllaç de verificació no és vàlid o ha caducat.",
      altre: "No hem pogut desar la sol·licitud. Torna-ho a provar en uns minuts.",
    },
    aplicacio: "Aplicació", quina: "Quina aplicació t'interessa? *", tria: "Tria una aplicació", construccio: " (en construcció)",
    centreLeg: "El centre", centre: "Nom del centre *", codi: "Codi de centre", localitat: "Localitat",
    contacteLeg: "Persona de contacte", nom: "Nom i cognoms *", rol: "Rol al centre *", triaOpcio: "Tria una opció",
    correu: "Correu del centre *", correuNota: "Fes servir el correu amb què vols accedir després. Si és possible, el del domini del centre.",
    mesLeg: "Alguna cosa més", missatge: "Què voleu treballar? Voleu una demo? (opcional)", missatgePh: "Nombre de grups, nivells, calendari previst…",
    legal1: "En enviar aquest formulari acceptes que tractem les teves dades per respondre la sol·licitud, tal com s'explica a la",
    legal2: "política de privacitat", enviar: "Enviar la sol·licitud",
  },
  es: {
    metaTitol: "Solicita acceso para tu centro",
    metaDesc: "Formulario único para pedir acceso o una demo de cualquiera de las aplicaciones educativas de aulaia.cat. Te respondemos con las instrucciones para empezar.",
    rols: ["Dirección", "Coordinación digital", "Coordinación pedagógica", "Docente", "Otros"],
    okTitol: "Solicitud recibida",
    okText: "Gracias. Revisamos cada petición a mano para asegurarnos de que el centro queda bien configurado desde el primer día, así que te responderemos al correo que nos has indicado.",
    okSub: "Si en un par de días no has recibido respuesta, escríbenos a",
    tornar: "Volver al inicio",
    eyebrow: "Alta de centro o demo",
    h1: "Solicita acceso para tu centro",
    intro: "Un solo formulario para todas las aplicaciones, tanto si quieres empezar como si primero quieres una demo. Nos dices quién eres y qué necesitas, y te respondemos con los pasos.",
    arribat: "Has llegado desde",
    errors: {
      camps: "Faltan campos obligatorios. Revisa el formulario.",
      email: "La dirección de correo no parece válida o es temporal (tempmail, etc.).",
      limit: "Se han enviado demasiadas solicitudes recientemente. Vuelve a intentarlo en una hora.",
      token: "El enlace de verificación no es válido o ha caducado.",
      altre: "No hemos podido guardar la solicitud. Vuelve a intentarlo en unos minutos.",
    },
    aplicacio: "Aplicación", quina: "¿Qué aplicación te interesa? *", tria: "Elige una aplicación", construccio: " (en construcción)",
    centreLeg: "El centro", centre: "Nombre del centro *", codi: "Código de centro", localitat: "Localidad",
    contacteLeg: "Persona de contacto", nom: "Nombre y apellidos *", rol: "Cargo en el centro *", triaOpcio: "Elige una opción",
    correu: "Correo del centro *", correuNota: "Usa el correo con el que quieras acceder después. Si es posible, el del dominio del centro.",
    mesLeg: "Algo más", missatge: "¿Qué queréis trabajar? ¿Queréis una demo? (opcional)", missatgePh: "Número de grupos, niveles, calendario previsto…",
    legal1: "Al enviar este formulario aceptas que tratemos tus datos para responder a la solicitud, tal como se explica en la",
    legal2: "política de privacidad", enviar: "Enviar la solicitud",
  },
};

export function metadataAlta(lang) {
  const t = T[lang];
  return {
    title: t.metaTitol,
    description: t.metaDesc,
    alternates: { canonical: base(lang) + "/alta", languages: { ca: "/alta", es: "/es/alta", "x-default": "/alta" } },
  };
}

export async function Alta({ lang, searchParams }) {
  const t = T[lang];
  const b = base(lang);
  const sp = await searchParams;
  const appDemanada = typeof sp?.app === "string" ? sp.app : "";
  const enviat = sp?.enviat === "1";
  const error = typeof sp?.error === "string" ? sp.error : null;

  // Nomes oferim les apps que un centre pot fer servir avui o aviat.
  const disponibles = appsEn(lang).filter(a => a.estat === "produccio" || a.estat === "construccio");
  const triada = disponibles.find(a => a.slug === appDemanada || a.nom === appDemanada);

  if (enviat) {
    return (
      <div className="alta">
        <div className="alta-ok">
          <h1>{t.okTitol}</h1>
          <p>{t.okText}</p>
          <p className="alta-ok-sub">{t.okSub} <a href="mailto:hola@aulaia.cat">hola@aulaia.cat</a>.</p>
          <Link href={b || "/"} className="btn btn-primary">{t.tornar}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="alta">
      <header className="alta-head">
        <span className="alta-eyebrow">{t.eyebrow}</span>
        <h1>{t.h1}</h1>
        <p>
          {t.intro}
          {triada && <> {t.arribat} <strong>{triada.nom}</strong>.</>}
        </p>
      </header>

      {error && <p className="alta-error">{t.errors[error] || t.errors.altre}</p>}

      <form method="POST" action="/api/alta" className="alta-form">
        <input type="hidden" name="idioma" value={lang} />
        <fieldset>
          <legend>{t.aplicacio}</legend>
          <div className="form-group">
            <label htmlFor="app">{t.quina}</label>
            <select id="app" name="app" defaultValue={triada ? triada.slug : ""} required>
              <option value="">{t.tria}</option>
              {disponibles.map(a => (
                <option key={a.slug} value={a.slug}>{a.nom}{a.estat === "construccio" ? t.construccio : ""}</option>
              ))}
            </select>
          </div>
        </fieldset>

        <fieldset>
          <legend>{t.centreLeg}</legend>
          <div className="form-group">
            <label htmlFor="centre">{t.centre}</label>
            <input id="centre" name="centre" type="text" required placeholder="Institut Escola Industrial" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="codiCentre">{t.codi}</label>
              <input id="codiCentre" name="codiCentre" type="text" placeholder="08013164" />
            </div>
            <div className="form-group">
              <label htmlFor="localitat">{t.localitat}</label>
              <input id="localitat" name="localitat" type="text" placeholder="Sabadell" />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>{t.contacteLeg}</legend>
          <div className="form-group">
            <label htmlFor="contacteNom">{t.nom}</label>
            <input id="contacteNom" name="contacteNom" type="text" required placeholder="Anna Garcia" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contacteRol">{t.rol}</label>
              <select id="contacteRol" name="contacteRol" required defaultValue="">
                <option value="">{t.triaOpcio}</option>
                {t.rols.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="contacteEmail">{t.correu}</label>
              <input id="contacteEmail" name="contacteEmail" type="email" required placeholder="anna@institut.cat" />
            </div>
          </div>
          <p className="form-legal">{t.correuNota}</p>
        </fieldset>

        <fieldset>
          <legend>{t.mesLeg}</legend>
          <div className="form-group">
            <label htmlFor="missatge">{t.missatge}</label>
            <textarea id="missatge" name="missatge" rows={4} placeholder={t.missatgePh} />
          </div>
        </fieldset>

        <p className="form-legal">
          {t.legal1} <Link href="/privacitat">{t.legal2}</Link>.
        </p>

        <button type="submit" className="btn-submit">{t.enviar}</button>
      </form>
    </div>
  );
}
