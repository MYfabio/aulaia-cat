# aulaia.cat - Estat actual

## Resum en una frase

Catàleg web estable de 12 aplicacions educatives per a escoles de Catalunya, amb formulari únic de sol·licitud i panell administratiu de gestió d'altes.

## Fet i tancat ✓

- Landing page amb 12 apps en producció, 2 en construcció, 1 en presentació.
- Formulari centralitzat (`/alta`) que totes les apps usen per rebre sol·licituds.
- API de CORS (`/api/alta`) protegida per dominis, accepta JSON i form-data.
- Base de dades PostgreSQL amb taula `solicituds` auto-creada.
- Panell administratiu (`/panel`) amb autenticació per contraseya.
- Gestió d'altes: listar, validar, rebutjar, esborrar sol·licituds.
- Enviament de correus amb Resend per a validacions.
- Seguretat: CSP, X-Frame-Options, comparació de password de temps constant.
- Blog amb 4 articles publicats.
- Desplegament a Railway amb monitorització d'estat.
- Build compila sense errors (Next.js 16.2.11, Turbopack).

## En marxa / A mig fer ⚡

- **Correus de validació**: El sistema envia els correus quan s'accepta una sol·licitud, però el email d'accés real els proporciona manualment quien revisa. El template és genèric, potser mancaria personalització.

## El següent per ordre 📋

1. **Clarificar procés de validació**: Qui revisa manualment les sol·licituds? Hi ha protocol per categoritzar-les per app, localitat o urgència?
2. **Monitorització de sol·licituds**: El panell no mostra alertes si passen dies sense revisar algun centre.
3. **Netejar proves**: La taula `solicituds` pot tenir registres de tests que s'hauria de fer desaparèixer periodicament.
4. **Backups**: Confirmar que Railway fa backup automàtic de la BD.

## Aturat / Desbloqueig 🔒

**Cap**: El projecte és operacional. Funciona sense dependències externes críticas (Resend és opcional, Rails és on es desplegua).

**Potencial** (a autoritzar si es planteja):
- Afegir notificacions de sol·licituds pendents (Slack, email al gestor).
- Exportar estadístiques d'altes per app, localitat, etc.
- Integrar Google Search Console al panell (ja hi ha ruta, falta API).
- Versionat de schemas PostgreSQL (ara és auto-create-only).

## Revisió periòdica

**Llegeix aquest fitxer en començar cada sessió. Actualitza'l al final de cada sessió.**

Inclou:
- Noves sol·licituds rebudes o validades.
- Errors o caigudes detectats.
- Canvis fets al codi o infraestructura.
- Dependències actualitzades.
- Articles SEO nous.

---

**Última actualització**: 31 de setembre de 2026 (primeira sessió de codi)
