import { altesLotConnectat } from "../../../../lib/panell-fonts";
import { esDemo } from "../../../../lib/panell-rol";
import { APPS_ALTES_LOT, MAX_USUARIS_LOT } from "../../../../lib/altes-lot.mjs";
import { AltesLotFormulari } from "./client";

export const metadata = {
  title: "Altes en lot",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AltesLotPage() {
  const [demo, connectat] = await Promise.all([esDemo(), altesLotConnectat()]);
  const apps = Object.entries(APPS_ALTES_LOT).map(([slug, a]) => ({ slug, nom: a.nom, rols: a.rols, domini: a.domini }));

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h1>Altes en lot</h1>
          <p className="panel-sub">Donar d'alta una llista d'alumnat i professorat de cop a una app</p>
        </div>
      </div>

      <section className="panel-sec">
        <h2>Com funciona</h2>
        <ol>
          <li>Tries l'app i enganxes la llista: una persona per línia.</li>
          <li>Cada línia té el nom, el correu, el rol i, si cal, el grup, separats per punt i coma.</li>
          <li>Veus la vista prèvia: quantes files són bones i quines no, i per què.</li>
          <li>Només si ho confirmes amb el nom del centre, la llista s'envia i l'app dona d'alta les persones correctes.</li>
        </ol>
        <p>Com a màxim {MAX_USUARIS_LOT} files per lot. Un correu que ja existeix no es toca: es compta com a ja existent.</p>
      </section>

      <p className="panel-nota">
        Les dades només es mostren aquí i viatgen fins a l'app. No s'envia cap correu d'invitació des d'aquesta pàgina.
      </p>

      {!connectat && (
        <div className="panel-avis">
          <strong>L'enviament encara no està connectat</strong>
          <p>Cal configurar la variable <code>N8N_ALTES_LOT_URL</code> al servei d'aulaia.cat. Fins llavors es pot fer la vista prèvia, però no s'envia res.</p>
        </div>
      )}

      <AltesLotFormulari apps={apps} demo={demo} connectat={connectat} />
    </div>
  );
}
