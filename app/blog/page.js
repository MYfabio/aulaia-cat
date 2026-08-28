import Link from "next/link";
import { llistarArticles } from "../../lib/blog";
import apps from "../../data/apps.json";

const URL = "https://www.aulaia.cat/blog";

export const metadata = {
  title: "Blog · aulaia.cat",
  description:
    "Articles sobre coordinació digital, pla lector, ràdio escolar i eines d'aula, escrits des de dins d'un centre educatiu.",
  alternates: { canonical: URL },
  openGraph: {
    title: "Blog · aulaia.cat",
    description:
      "Articles sobre coordinació digital, pla lector, ràdio escolar i eines d'aula, escrits des de dins d'un centre educatiu.",
    url: URL,
    siteName: "aulaia.cat",
    locale: "ca_ES",
    type: "website",
  },
};

function dataLlegible(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("ca-ES", { day: "numeric", month: "long", year: "numeric" });
}

export default function BlogIndex() {
  const articles = llistarArticles();
  const nomApp = slug => apps.find(a => a.slug === slug)?.nom;

  return (
    <div className="landing">
      <Link href="/" className="landing-back">← Tornar a l&apos;inici</Link>

      <header className="blog-head">
        <p className="blog-kicker">Blog</p>
        <h1>Del que fem servir a l&apos;aula</h1>
        <p className="blog-lede">
          Coses que hem hagut de resoldre en un centre de veritat: com es coordina la
          digitalització, què costa muntar un pla lector, què funciona i què no. Sense
          promeses que no puguem sostenir.
        </p>
      </header>

      {articles.length === 0 ? (
        <div className="blog-buit">
          <p>Encara no hi ha cap article publicat.</p>
        </div>
      ) : (
        <div className="blog-llista">
          {articles.map(a => (
            <article key={a.slug} className="blog-fitxa">
              {a.imatge && (
                <Link href={"/blog/" + a.slug} className="blog-fitxa-imatge" tabIndex={-1} aria-hidden="true">
                  <img src={a.imatge} alt="" width={1200} height={630} loading="lazy" />
                </Link>
              )}
              <p className="blog-meta">
                <time dateTime={a.data}>{dataLlegible(a.data)}</time>
                <span aria-hidden="true"> · </span>
                <span>{a.minuts} min de lectura</span>
              </p>
              <h2>
                <Link href={"/blog/" + a.slug}>{a.titol}</Link>
              </h2>
              <p className="blog-resum">{a.resum}</p>
              {a.etiquetes.length > 0 && (
                <p className="blog-etiquetes">
                  {a.etiquetes.map(e => (
                    <span key={e} className="blog-etiqueta">{e}</span>
                  ))}
                </p>
              )}
              {a.apps.length > 0 && (
                <p className="blog-apps">
                  Hi surten:{" "}
                  {a.apps.map((s, i) => (
                    <span key={s}>
                      {i > 0 && ", "}
                      <Link href={"/apps/" + s}>{nomApp(s) || s}</Link>
                    </span>
                  ))}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
