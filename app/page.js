import Link from "next/link";
import fs from "node:fs";
import path from "node:path";
import apps from "../data/apps.json";
import CatalegApps from "../components/CatalegApps";

export const metadata = {
  title: "Apps i software educatiu per a escoles de Catalunya",
  description: "Catàleg d'aplicacions i projectes digitals per a centres educatius de Catalunya. Ràdio escolar, dictats amb IA, sostenibilitat, pla lector i mecanografia.",
  alternates: { canonical: "/" },
};

// Les captures es generen a mà (public/captures/<slug>.jpg); sense captura, la fitxa mostra la icona.
const captures = Object.fromEntries(
  apps
    .filter(a => fs.existsSync(path.join(process.cwd(), "public", "captures", a.slug + ".jpg")))
    .map(a => [a.slug, "/captures/" + a.slug + ".jpg"])
);

export default function Home() {
  const enLinia = apps.filter(a=>a.estat==="produccio");

  return (
    <>
      <section className="hero">
        <span className="hero-tag">Software educatiu · Catalunya</span>
        <h1>Apps educatives fetes <span>a Catalunya</span></h1>
        <p>Cada projecte neix d'una necessitat real d'un centre i té la seva pròpia web. Aquí pots veure què fa cadascun abans d'entrar-hi.</p>
        <div className="hero-actions">
          <Link href="#apps" className="btn btn-primary">Veure els projectes</Link>
          <Link href="/contacte" className="btn btn-outline">Demana una demo</Link>
        </div>
        <div className="hero-badges">
          {[enLinia.length+" projectes en línia","Per a escoles i instituts","De Sabadell","Amb suport d'IA"].map(b=>(
            <span key={b} className="badge">{b}</span>
          ))}
        </div>
      </section>

      <CatalegApps apps={apps} captures={captures} />

      <section className="seo-intro">
        <div className="seo-intro-inner">
          <h2>La tecnologia ha de ser invisible. El que ha de brillar és l'aprenentatge.</h2>
          <p>A aulaia.cat dissenyem i desenvolupem aplicacions digitals pensades específicament per a la realitat dels centres educatius catalans. No adaptem eines generals: creem solucions que neixen de les necessitats reals dels docents, dels equips directius i, sobretot, de l'alumnat.</p>
          <p>La tecnologia, per si sola, no transforma l'educació. El que la transforma és posar-la al servei d'un propòsit pedagògic clar. Cada projecte neix d'una pregunta concreta que es fa un docent o un equip directiu: com fem que l'alumnat millori l'ortografia sense hores de correcció manual? Com donem veu a l'alumnat més enllà de l'aula? Com convertim la sostenibilitat en un projecte real i no en un exercici fictici?</p>
          <div className="seo-intro-tags">
            {["ESO","Cicles Formatius","Primària","Batxillerat","Escola Verda","Aprenentatge Servei","Competència Digital","STEM"].map(t=>(
              <span key={t} className="badge">{t}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="per-a-qui">
        <div className="section-header">
          <h2>Per a qui treballem</h2>
          <p>Dissenyem per als professionals que fan possible la transformació digital dels centres.</p>
        </div>
        <div className="who-grid">
          {[
            {n:"01",title:"Equips directius",desc:"Eines per prendre decisions àgils amb dades reals del centre."},
            {n:"02",title:"Coordinadors digitals",desc:"Apps fàcils d'integrar sense trencar la rutina del claustre."},
            {n:"03",title:"Docents",desc:"Projectes que amplien les possibilitats de l'aprenentatge a l'aula."},
            {n:"04",title:"Escoles i instituts",desc:"Solucions adaptades als centres públics i concertats."},
          ].map(w=>(
            <div key={w.title} className="who-card">
              <div className="who-card-icon">{w.n}</div>
              <h3>{w.title}</h3><p>{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section" style={{paddingTop:0}}>
        <div className="landing-final-cta">
          <p className="landing-final-title">Vols veure algun projecte en acció?</p>
          <p className="landing-final-sub">Demana una demo gratuïta i t'expliquem com s'adapta al teu centre. Sense compromís.</p>
          <Link href="/contacte" className="btn btn-primary">Contacta'ns</Link>
        </div>
      </section>
    </>
  );
}
