# Com treballar en aulaia.cat

## Arrencada local

```bash
npm install
npm run dev
```

L'aplicació estarà a `http://localhost:3000`. No necessita base de dades per al frontend.

Per a funcionalitat completa (formulari i panell), cal:
- `DATABASE_URL` amb connexió a PostgreSQL (crea la taula automàticament)
- `RESEND_API_KEY` per a enviament de correus
- `PANEL_PASSWORD` + `PANEL_SECRET` pel panell administratiu
- `PANEL_DEMO_PASSWORD` (opcional) per obrir la demostració del panell: qui entra amb aquesta contrasenya veu totes les seccions amb dades inventades (`lib/demo/`) i no pot desar ni enviar res. Sense la variable, la demo no existeix; ha de tenir 8 caràcters o més i no pot ser la mateixa que `PANEL_PASSWORD`. Canviar-la o treure-la tanca a l'instant les sessions de demo obertes. Prova local: configuració `aulaia-demo` de `.claude/launch.json` i `node --test scripts/demo/proves.mjs`
- `ANTHROPIC_ADMIN_KEY` perquè `/panel/ia` pugui llegir el cost d'Anthropic (clau d'administrador de l'organització, només lectura; prova local amb `node scripts/cost-ia/provar.mjs`)
- `RESEND_PANEL_KEY` perquè `/panel/correus` pugui llistar els enviaments de Resend per app (clau amb accés complet, perquè Resend no en té de només lectura; aquí només es llegeix; prova local amb `node scripts/correus/provar.mjs`)
- `ACTIVITAT_CLAUS` perquè les apps puguin enviar el seu informe d'activitat a `/api/activitat` (JSON slug → empremta SHA-256 de la clau; `docs/informe-activitat.md`)

## Estructura

```
app/                    # Rutes i components de Next.js
├── page.js            # Landing principal
├── alta/              # Formulari de sol·licitud
├── panel/             # Panell administratiu (protegit)
├── api/               # API del servidor
├── apps/[slug]/       # Detalls de cada app
└── blog/[slug]/       # Articles

lib/
├── db.js              # PostgreSQL: gestió de taula `solicituds`
├── correu.js          # Enviament amb Resend
├── panel-auth.js      # Autenticació del panell
└── railway.js         # Dades de Railway (panell)

data/
├── apps.json          # Catàleg d'aplicacions
└── accessos.json      # Control d'accessos

public/               # Assets estàtics
components/           # Components reutilitzables
```

## Convencions

- **Idioma**: Català en tot el codi (variables, comentaris, strings).
- **Nomenclatura**: camelCase en JS, kebab-case en fitxers (tret de components React).
- **Validació**: Al servidor, mai al client. Els formularis validen a `lib/correu.js`.
- **Seguretat**:
  - CORS limitat a dominis coneguts (veggies `apps.json`).
  - Password del panell amb comparació de temps constant.
  - CSP i X-Frame-Options al `next.config.js`.
  - PostgreSQL usa prepared statements (paràmetres de `pg`).
- **Dades**: La taula `solicituds` es crea automàticament. No mantenim migracions.
- **Correu**: `enviarCorreu()` va sempre per Resend amb templates tancades.

## Coses que NO fer mai

- No demanar dades des d'una pàgina de `/panel` directament a `lib/db`, `lib/railway`, `lib/search-console`, `lib/anthropic-admin`, `lib/resend-panel` ni `data/accessos.json`: sempre per `lib/panell-fonts.js`, que és on es decideix si qui mira és l'administrador o la demostració. Una secció nova del panell necessita la seva font a `lib/panell-fonts.js` i les seves dades inventades a `lib/demo/`; si no, la demo ensenyaria dades reals. Les rutes d'`/api/panel` que desen, envien o exporten comencen per `nomesAdmin()`.
- No afegir lògica de validació al client sense al servidor.
- No canviar dominis ni secrets en codi: sempre per variables d'entorn.
- No deixar variables d'entorn per defecte en producció (ex: contraseya buida).
- No modificar directament la base de dades sense passar per les funcions de `db.js`.
- No enviar HTML en correus sense escapar valors.
- No eliminar camps de `solicituds` sense revisar històric: els pot tocar la taula algun script extern.

## Testeig

No hi ha suite de tests automatitzats. Comprova manualment:
- `npm run build` - compilació correcta.
- Landing: 12 apps en producció es llisten.
- `/alta` - formulari envia dades a BD.
- `/panel/altes` - sol·licituds es mostren i es poden validar (cal `PANEL_PASSWORD`).
- CORS: APIs d'altres dominis funcionen si venen de llista blanca.

## Desplegament

A Railway. El `proxy.js` fa de middleware. Variables crítiques:
- `DATABASE_URL` → postgres://...
- `RESEND_API_KEY` → clau API Resend
- `PANEL_PASSWORD` → contraseya del panell
- `PANEL_SECRET` → 32+ chars per a sessions

Els repositoris de les **altres apps** (radioescolar.cat, dictats.cat, etc.) apunten a aquest `/api/alta` per enviar sol·licituds.

## Monitorització

- Panell: `/panel` mostra estat de Railway, consum i certificats.
- Logs: Railway ofereix visibilitat de errors i rendiment.
- Errors: Si `RESEND_API_KEY` falta, els correus no es fan enviar (debug a logs).

## Preguntes sense resposta (demana al propietari)

1. Qui és responsable de revisar i validar les sol·licituds senyaladament?
2. Quina és la política de retenció de dades a `solicituds`?
3. Es pot borrar manualment la taula o falta backup?
4. Hi ha límit de sol·licituds pendents o s'ha de fer alerta si passen de N?
5. Els centres validats reben un email amb instruccions d'accés? De qui?
