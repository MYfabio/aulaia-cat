import Link from "next/link";
import apps from "../../data/apps.json";

export const metadata = {
  title: "Sol·licita accés per al teu centre",
  description: "Formulari únic per demanar accés a qualsevol de les aplicacions educatives d'aulaia.cat. Et responem amb les instruccions per començar.",
  alternates: { canonical: "/alta" },
};

const ROLS = [
  "Direcció",
  "Coordinació digital",
  "Coordinació pedagògica",
  "Docent",
  "Altres",
];

export default async function AltaPage({ searchParams }) {
  const sp = await searchParams;
  const appDemanada = typeof sp?.app === "string" ? sp.app : "";
  const enviat = sp?.enviat === "1";
  const error = typeof sp?.error === "string" ? sp.error : null;

  // Nomes oferim les apps que un centre pot fer servir avui o aviat.
  const disponibles = apps.filter(a => a.estat === "produccio" || a.estat === "construccio");
  const triada = disponibles.find(a => a.slug === appDemanada);

  if (enviat) {
    return (
      <div className="alta">
        <div className="alta-ok">
          <h1>Sol·licitud rebuda</h1>
          <p>
            Gràcies. Revisem cada petició a mà per assegurar-nos que el centre queda ben configurat
            des del primer dia, així que et respondrem al correu que ens has indicat.
          </p>
          <p className="alta-ok-sub">
            Si en un parell de dies no has rebut resposta, escriu-nos a{" "}
            <a href="mailto:hola@aulaia.cat">hola@aulaia.cat</a>.
          </p>
          <Link href="/" className="btn btn-primary">Tornar a l inici</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="alta">
      <header className="alta-head">
        <span className="alta-eyebrow">Alta de centre</span>
        <h1>Sol·licita accés per al teu centre</h1>
        <p>
          Un sol formulari per a totes les aplicacions. Ens dius qui ets i què necessites, i
          et responem amb els passos per començar.
          {triada && <> Has arribat des de <strong>{triada.nom}</strong>.</>}
        </p>
      </header>

      {error && (
        <p className="alta-error">
          {error === "camps"
            ? "Falten camps obligatoris. Revisa el formulari."
            : error === "email"
            ? "L adreça de correu no sembla vàlida."
            : "No hem pogut desar la sol·licitud. Torna-ho a provar en uns minuts."}
        </p>
      )}

      <form method="POST" action="/api/alta" className="alta-form">
        <fieldset>
          <legend>Aplicació</legend>
          <div className="form-group">
            <label htmlFor="app">Quina aplicació t interessa? *</label>
            <select id="app" name="app" defaultValue={triada ? triada.slug : ""} required>
              <option value="">Tria una aplicació</option>
              {disponibles.map(a => (
                <option key={a.slug} value={a.slug}>
                  {a.nom}{a.estat === "construccio" ? " (en construcció)" : ""}
                </option>
              ))}
            </select>
          </div>
        </fieldset>

        <fieldset>
          <legend>El centre</legend>
          <div className="form-group">
            <label htmlFor="centre">Nom del centre *</label>
            <input id="centre" name="centre" type="text" required placeholder="Institut Escola Industrial" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="codiCentre">Codi de centre</label>
              <input id="codiCentre" name="codiCentre" type="text" placeholder="08013164" />
            </div>
            <div className="form-group">
              <label htmlFor="localitat">Localitat</label>
              <input id="localitat" name="localitat" type="text" placeholder="Sabadell" />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Persona de contacte</legend>
          <div className="form-group">
            <label htmlFor="contacteNom">Nom i cognoms *</label>
            <input id="contacteNom" name="contacteNom" type="text" required placeholder="Anna Garcia" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contacteRol">Rol al centre *</label>
              <select id="contacteRol" name="contacteRol" required defaultValue="">
                <option value="">Tria una opció</option>
                {ROLS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="contacteEmail">Correu del centre *</label>
              <input id="contacteEmail" name="contacteEmail" type="email" required placeholder="anna@institut.cat" />
            </div>
          </div>
          <p className="form-legal">
            Fes servir el correu amb què vols accedir després. Si és possible, el del domini del centre.
          </p>
        </fieldset>

        <fieldset>
          <legend>Alguna cosa més</legend>
          <div className="form-group">
            <label htmlFor="missatge">Què voleu treballar? (opcional)</label>
            <textarea id="missatge" name="missatge" rows={4} placeholder="Nombre de grups, nivells, calendari previst…" />
          </div>
        </fieldset>

        <p className="form-legal">
          En enviar aquest formulari acceptes que tractem les teves dades per respondre la
          sol·licitud, tal com s explica a la{" "}
          <Link href="/privacitat">política de privacitat</Link>.
        </p>

        <button type="submit" className="btn-submit">Enviar la sol·licitud</button>
      </form>
    </div>
  );
}
