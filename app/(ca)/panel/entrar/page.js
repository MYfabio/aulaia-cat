export const metadata = {
  title: "Entrar al panell",
  robots: { index: false, follow: false },
};

const MISSATGES = {
  "google": "No s'ha pogut entrar amb Google. Torna-ho a provar.",
  "google-no": "L'entrada amb Google no està configurada encara.",
  "no-autoritzat": "Aquest compte de Google no té accés al panell.",
};

export default async function EntrarPage({ searchParams }) {
  const sp = await searchParams;
  const error = sp?.error === "1";
  const limit = sp?.error === "limit";
  const missatgeGoogle = typeof sp?.error === "string" ? MISSATGES[sp.error] : null;
  const seguent = typeof sp?.seguent === "string" && sp.seguent.startsWith("/") ? sp.seguent : "/panel";
  const googleActiu = Boolean(process.env.PANEL_GOOGLE_CLIENT_ID);

  return (
    <div className="panel-entrar">
      <h1>Panell de control</h1>
      <p className="panel-entrar-sub">Zona privada d aulaia.cat</p>

      {googleActiu && (
        <div className="panel-entrar-form">
          <a href="/api/panel/google/inici" className="btn-submit">Entra amb el compte de Google</a>
        </div>
      )}
      {missatgeGoogle && <p className="panel-error">{missatgeGoogle}</p>}

      <details className="panel-entrar-form" style={{ marginTop: "1.5rem" }}>
        <summary>Contrasenya d&apos;emergència</summary>
        <form method="POST" action="/api/panel/entrar">
          <input type="hidden" name="seguent" value={seguent} />
          <div className="form-group">
            <label htmlFor="password">Contrasenya</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {error && <p className="panel-error">Contrasenya incorrecta. Torna-ho a provar.</p>}
          {limit && <p className="panel-error">Massa intents fallits. Torna-ho a provar d&apos;aquí a un quart d&apos;hora.</p>}
          <button type="submit" className="btn-submit">Entrar</button>
        </form>
      </details>
    </div>
  );
}
