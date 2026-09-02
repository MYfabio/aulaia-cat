import Link from "next/link";
import apps from "../data/apps.json";

export const metadata = {
  title: "Propostes d'apps educatives nascudes a l'Escola Industrial de Sabadell",
  description: "Espai de propostes d'aplicacions creades a l'entorn de l'Institut Escola Industrial de Sabadell, un centre que aposta per un model de projectes que integra apps per millorar l'aprenentatge. Ràdio escolar, dictats amb IA, sostenibilitat, pla lector i mecanografia.",
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
        <span className="hero-tag">Escola Industrial de Sabadell · Espai de propostes</span>
        <h1>Apps que neixen <span>dels projectes de l'escola</span></h1>
        <p>L'Institut Escola Industrial de Sabadell aposta per un model de treball per projectes que integra aplicacions digitals per millorar l'aprenentatge. Aquest és l'espai on presentem les propostes d'apps que han sorgit d'aquest entorn: cadascuna neix d'una necessitat real de l'aula i té la seva pròpia web.</p>
        <div className="hero-actions">
          <Link href="#apps" className="btn btn-primary">Veure les propostes</Link>
          <Link href="/contacte" className="btn btn-outline">Demana una demo</Link>
        </div>
        <div className="hero-badges">
          {[enLinia.length+" propostes en línia","Nascudes a l'Escola Industrial","Model de projectes","Amb suport d'IA"].map(b=>(
            <span key={b} className="badge">{b}</span>
          ))}
        </div>
      </section>

      <section className="section" id="apps">
        <div className="section-header">
          <h2>Propostes en línia</h2>
          <p>Apps ja en ús al centre. Cadascuna té el seu domini propi i funciona de manera independent.</p>
        </div>
        <div className="proj-list">
          {enLinia.map((app,i)=><ProjectRow key={app.slug} app={app} num={i+1} />)}
        </div>
      </section>

      {enConstruccio.length>0 && (
        <section className="section" id="en-construccio" style={{paddingTop:0}}>
          <div className="section-header">
            <h2>En construcció</h2>
            <p>Propostes amb l'abast ja definit que s'estan desenvolupant amb els equips del centre.</p>
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
            <p>Idees que s'estan presentant al claustre i a altres centres. Encara no tenen web pública.</p>
          </div>
          <div className="proj-list">
            {enPreparacio.map((app,i)=><ProjectRow key={app.slug} app={app} num={enLinia.length+enConstruccio.length+i+1} />)}
          </div>
        </section>
      )}

      <section className="seo-intro">
        <div className="seo-intro-inner">
          <h2>Un centre, un model de projectes, moltes apps.</h2>
          <p>L'Institut Escola Industrial de Sabadell ha fet una aposta clara: treballar per projectes i integrar-hi aplicacions digitals com a part natural de l'aprenentatge. aulaia.cat recull les propostes d'apps que han nascut en aquest entorn. No són eines generals adaptades: són solucions creades a peu d'aula, a partir de les necessitats dels docents, dels equips directius i, sobretot, de l'alumnat.</p>
          <p>La tecnologia, per si sola, no transforma l'educació. El que la transforma és posar-la al servei d'un projecte amb un propòsit pedagògic clar. Cada proposta neix d'una pregunta concreta que es fa algú del centre: com fem que l'alumnat millori l'ortografia sense hores de correcció manual? Com donem veu a l'alumnat més enllà de l'aula? Com convertim la sostenibilitat en un projecte real i no en un exercici fictici? Les apps que funcionen a l'Escola Industrial es comparteixen aquí perquè altres escoles i instituts de Catalunya les puguin conèixer i adoptar, sempre com a part d'un projecte i mai com a substitut del que passa a l'aula.</p>
          <div className="seo-intro-tags">
            {["ESO","Cicles Formatius","Primària","Batxillerat","Escola Verda","Aprenentatge Servei","Competència Digital","STEM"].map(t=>(
              <span key={t} className="badge">{t}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="pantalles">
        <div className="section-header">
          <h2>I les pantalles?</h2>
          <p>Compartim la preocupació de moltes famílies i docents. Per això aquestes propostes segueixen uns criteris clars.</p>
        </div>
        <div className="who-grid">
          {[
            {n:"01",title:"Amb un propòsit",desc:"Cap app s'usa per usar-la. Cadascuna respon a una necessitat concreta d'un projecte d'aula."},
            {n:"02",title:"El docent decideix",desc:"Quan, quant de temps i per a què. L'eina s'adapta a la programació, no al revés."},
            {n:"03",title:"Pantalla curta, activitat llarga",desc:"Moltes propostes acaben fora de la pantalla: un programa de ràdio, una acció de sostenibilitat, un llibre a les mans."},
            {n:"04",title:"Sense contrasenyes ni dades innecessàries",desc:"Dissenyades per a menors: mínima recollida de dades i cap perfil personal que calgui mantenir."},
          ].map(w=>(
            <div key={w.title} className="who-card">
              <div className="who-card-icon">{w.n}</div>
              <h3>{w.title}</h3><p>{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="per-a-qui">
        <div className="section-header">
          <h2>Per a qui són les propostes</h2>
          <p>Pensades primer per a la comunitat de l'Escola Industrial, i obertes a qualsevol centre que treballi per projectes.</p>
        </div>
        <div className="who-grid">
          {[
            {n:"01",title:"Equips directius",desc:"Eines per impulsar el model de projectes amb dades reals del centre."},
            {n:"02",title:"Coordinadors digitals",desc:"Apps fàcils d'integrar en els projectes sense trencar la rutina del claustre."},
            {n:"03",title:"Docents",desc:"Propostes que amplien les possibilitats de cada projecte d'aula."},
            {n:"04",title:"Altres escoles i instituts",desc:"El que funciona a l'Escola Industrial, adaptable a centres públics i concertats."},
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
          <p className="landing-final-title">Vols veure alguna proposta en acció o proposar-ne una de nova?</p>
          <p className="landing-final-sub">Demana una demo gratuïta o explica'ns la necessitat del teu projecte. Sense compromís.</p>
          <Link href="/contacte" className="btn btn-primary">Contacta'ns</Link>
        </div>
      </section>
    </>
  );
}
