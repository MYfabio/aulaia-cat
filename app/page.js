import Link from "next/link";
import apps from "../data/apps.json";

export const metadata = {
  title: "Apps i software educatiu per a escoles de Catalunya",
  description: "Catàleg d'aplicacions i projectes digitals per a centres educatius de Catalunya. Ràdio escolar, dictats amb IA, sostenibilitat, pla lector i mecanografia.",
  alternates: { canonical: "/" },
};

const ESTATS = {
  produccio: "En línia",
  construccio: "En construcció",
  desenvolupament: "Properament",
  presentacio: "En presentació",
};

function ProjectRow({ app, num }) {
  return (
    <Link href={"/apps/"+app.slug} className="proj-row">
      <span className="proj-num">{String(num).padStart(2,"0")}</span>
      <span className="proj-main">
        <span className="proj-cat">{app.categoria}</span>
        <span className="proj-name">{app.nom}</span>
        <span className="proj-desc">{app.resum}</span>
      </span>
      <span className="proj-meta">
        {app.domini && <span className="proj-domain">{app.domini}</span>}
        <span className={"proj-state" + (app.estat==="produccio" ? " is-live" : "")}>
          {ESTATS[app.estat] || "En preparació"}
        </span>
      </span>
    </Link>
  );
}

export default function Home() {
  const enLinia = apps.filter(a=>a.estat==="produccio");
  const enConstruccio = apps.filter(a=>a.estat==="construccio"||a.estat==="desenvolupament");
  const enPreparacio = apps.filter(a=>a.estat==="presentacio");

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

      <section className="section" id="apps">
        <div className="section-header">
          <h2>Projectes en línia</h2>
          <p>Cadascun té el seu domini propi i funciona de manera independent.</p>
        </div>
        <div className="proj-list">
          {enLinia.map((app,i)=><ProjectRow key={app.slug} app={app} num={i+1} />)}
        </div>
      </section>

      {enConstruccio.length>0 && (
        <section className="section" id="en-construccio" style={{paddingTop:0}}>
          <div className="section-header">
            <h2>En construcció</h2>
            <p>Projectes amb l'abast ja definit que estem desenvolupant ara mateix.</p>
          </div>
          <div className="proj-list">
            {enConstruccio.map((app,i)=><ProjectRow key={app.slug} app={app} num={enLinia.length+i+1} />)}
          </div>
        </section>
      )}

      {enPreparacio.length>0 && (
        <section className="section" id="en-preparacio" style={{paddingTop:0}}>
          <div className="section-header">
            <h2>En preparació</h2>
            <p>Els estem presentant als centres. Encara no tenen web pública.</p>
          </div>
          <div className="proj-list">
            {enPreparacio.map((app,i)=><ProjectRow key={app.slug} app={app} num={enLinia.length+enConstruccio.length+i+1} />)}
          </div>
        </section>
      )}

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
