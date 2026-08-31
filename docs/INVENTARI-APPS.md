# Inventari d'aplicacions — còpia de context

Revisió: 31/08/2026. Aixecat llegint el codi de cada carpeta de
`C:\Users\super\Desktop\APPS`. Aquest document és la còpia de seguretat del
context: si es perd una conversa, es recupera des d'aquí.

Cada projecte té a més el seu `docs/PROMPT-INICIO.md` per arrencar una sessió
nova de Claude Code.

## Aplicacions

| Projecte | Carpeta | Repositori | Domini | Estat |
| --- | --- | --- | --- | --- |
| aulaia.cat | `aulaia-cat` | — (sense git) | aulaia.cat | producció · paraigua de tota la resta |
| Ràdio Escolar | `Radio` | MYfabio/radio-industrial-jove | radioescolar.cat | producció · **connectat a Lovable** |
| dictats.cat | `ditat` | MYfabio/ditat | dictats.cat | producció |
| Pla Lector | `pla_lector` | MYfabio/biblioteca-pla-lector | (app interna, fora de cercadors) | producció |
| Landing Pla Lector | `plalector-landing` | — | elplalector.cat | producció |
| Chef Boss | `Chefboss` | MYfabio/chefboss | chefboss.es | producció (1.9.0), 1.10.0 en local |
| Aules Sostenibles | `aules-sostenibles` | MYfabio/aules-sostenibles | aulessostenibles.cat | MVP en curs (fase 4, iteració I1) |
| KIPUK.ES | `kipuk-es` | — (local, sense remot) | kipuk.es (previst) | MVP amb dades sintètiques |
| Pantalles | `Pantallas_web` | MYfabio/pantalles | — | **pendent de desplegar** |
| Kipuk (demo antiga) | `Kipuk` | MYfabio/kipuk | — | obsolet, no s'hi treballa |

Altres carpetes a `APPS` sense fitxa encara: `Aula de acollida`, `diedrico`,
`Ecool`, `mecanografia`, `modulo radio`, `recursos-pla-lector`, `tetris3d`.

## Tecnologia per projecte

- **aulaia.cat** — Next.js (JS). `data/apps.json` (catàleg públic),
  `data/accessos.json`, `lib/railway.js` (API de Railway), `lib/search-console.js`,
  `lib/correu*.js`, `app/panel`, `app/alta`. Encàrrec de gestió a
  `docs/rol-agent-gestor.md`.
- **Ràdio Escolar** — TanStack Start (React 19, SSR amb Nitro) + Vite +
  Supabase + Postgres. El centre es configura a `src/lib/siteConfig.ts`.
- **dictats.cat** — Next.js 16 + Prisma + Postgres + Auth.js (Google i Entra ID)
  + Claude + Google Vision (OCR) + Gemini/OpenAI TTS + Stripe.
- **Pla Lector** — Node + Express 4 (CommonJS) + Postgres + Passport Google,
  domini restringit a `escolaindustrial.org`. Frontend pla a `public/`.
- **Chef Boss** — monorepo `frontend` (React + Vite, prerender) i `backend`
  (Express 4 ESM) + Postgres + Gemini. Context viu a `PROJECT_CONTEXT.md`.
- **Aules Sostenibles** — monorepo npm (web PWA React, Cloud Functions 2a gen,
  shared) sobre Firebase. Regles amb denegació per defecte.
- **KIPUK.ES** — Next.js + `node:sqlite` + OAuth de Google Classroom (només
  lectura) + Gemini rere flag. Migració prevista a PostgreSQL.
- **Pantalles** — Next.js 14 + Prisma + NextAuth + Gemini + Vercel Blob.

## Regles comunes a tots els projectes

- Mai dades reals d'alumnat en desenvolupament: dades sintètiques o de seed.
- Les claus d'IA viuen només al servidor; a la IA només hi va el mínim.
- Cap secret al repositori: variables d'entorn a Railway, Firebase o GitHub.
- L'autorització es comprova al servidor, no amagant botons.
- Tot ha de seguir funcionant sense claus d'IA (motor local o mode sandbox).

## Feina feta el 31/08/2026

- `docs/PROMPT-INICIO.md` a Kipuk, Chef Boss, Pla Lector, dictats, Ràdio,
  Aules Sostenibles i Pantalles.
- `kipuk-es`: tot el MVP estava sense versionar amb un únic commit inicial.
  Commit fet (`MVP del dossier: sorteig, calendari, classificacio, Classroom i
  auditoria`). **Segueix sense remot: cal crear el repositori a GitHub.**
- `Pantalles`: hi havia un token d'accés personal de GitHub incrustat a la URL
  del remot. Tret del `.git/config`. **Cal revocar-lo a GitHub.**
- `Pantalles`: credencials d'administrador tretes del README (segueixen a
  l'historial de git: cal canviar la contrasenya, no només esborrar-la).
- `.gitignore` ampliat a Ràdio (zip i .dc.html) i Chef Boss (.tmp_doc_review).
- Comprovat que cap `.env` real està seguit per git en cap projecte.

## Avisos d'alta (31/08/2026)

`/api/alta` desava la sol·licitud a Postgres i no enviava cap correu: ni l'avís
intern ni l'acusament de rebuda. Les plantilles `alta-avis-intern` i
`alta-rebuda` existien a `lib/correu-central.js` però només les cridava
`/api/correu`, que és per a les altres apps. Per això no arribava mai cap avís
d'alta nova: calia mirar `/panel/altes` a mà.

Arreglat a `app/api/alta/route.js`: després de desar es criden els dos correus
amb `Promise.allSettled`, de manera que un error de correu no tomba l'alta.
L'adreça interna surt de `AVIS_ALTES_EMAIL` (per defecte, la de Fabio).
**Cal desplegar-ho i comprovar que `RESEND_API_KEY` i `RESEND_FROM` hi són a
Railway.**

## Pendent

1. Crear el repositori de `kipuk-es` a GitHub i pujar-hi la feina.
2. Revocar el token de GitHub exposat i canviar la contrasenya d'admin de Pantalles.
3. Registre operatiu a aulaia.cat: repositori, servei de Railway, entorns,
   variables crítiques, estat i última revisió per app — el que demana
   `docs/rol-agent-gestor.md` i que `apps.json` no conté.
4. Tasca programada per a l'informe diari (avui el document l'assumeix però no
   s'executa sol).
5. Consolidar carpetes duplicades: `Kipuk`/`kipuk-es`, `Radio`/`modulo radio`,
   `pla_lector`/`plalector-landing`/`recursos-pla-lector`.
6. Desplegar l'arreglada dels avisos d'alta i fer una prova real del formulari.
7. `aulaia-cat` no té repositori git: tot el paraigua viu en una sola còpia al disc.
