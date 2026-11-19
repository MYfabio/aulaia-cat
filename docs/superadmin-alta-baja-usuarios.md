# Alta y baja de usuarios desde el superadmin de cada app

Informe del 12/11/2026. El trabajo empezó en una sesión de dictats y se fue
extendiendo a otras apps. Se para aquí para seguirlo desde una conversación
propia de Aulaia, porque afecta a todo el ecosistema.

**Objetivo del propietario:** desde el panel de superadmin de cada app, poder
dar de alta y borrar usuarios de cualquier centro, no solo que lo haga la
coordinación de cada centro.

**Decisión de arquitectura:** cada app gestiona sus propios usuarios en su
panel. El panel de aulaia.cat **no** gestiona usuarios de las apps: hoy lo
protege una sola contraseña y se convertiría en la llave de todas. Si algún
día se quiere gestión central, antes hay que reforzar el acceso al panel.
Propuesta pendiente: que «Accessos» enlace directamente a la pantalla de
usuarios de cada app.

**Relacionado:** `docs/cambio-de-curso-automatizado.md` (12/11/2026). El cambio
de curso automatizado reutilizará este alta y baja en bloque; por eso, en las
apps que faltan, la lógica va en funciones de servicio reutilizables e
idempotentes, no dentro de la ruta ni de la pantalla.

---

## 1. Cambios hechos y desplegados

Todos se desplegaron con `git push` (Railway despliega solo desde GitHub). En
producción solo se ha comprobado desde fuera, sin sesión. **No se ha creado ni
borrado ningún usuario real.**

| App | Repo · rama · commit | Dónde | Qué hace |
|---|---|---|---|
| dictats | `MYfabio/ditat` · master · `7c7f369` | `/admin` → «Usuaris i rols» y la ficha de cada centro | Alta antes de entrar (correo, rol, centro). Borrar con aviso; si tiene suscripción, primero la cancela en Stripe y, si falla, no borra nada. |
| TypeEdu | `MYfabio/typeedu` · main · `9359c50` | Administración global → Roles y centros | Igual que dictats. El alumnado nuevo de un centro recibe las adaptaciones NESE del centro. Textos en es/ca/en/eu. |
| MatEscac | `MYfabio/matescac` · main · `f81e117` | `/[lang]/admin` | Alta solo como alumno o docent (el superadmin sigue saliendo de `SUPERADMIN_EMAILS`). Rechaza correos fuera de `ALLOWED_EMAIL_DOMAINS`. Al borrar a un docent, **sus grupos pasan al superadmin** que lo borra (el grupo exige docent y en cascada se llevaría las tareas del alumnado). |
| Diedric3D | `MYfabio/diedric3d` · main · `85680de` | `/admin/users` | Alta real (antes solo por migración SQL). «Editar» también cambia el centro. El borrado fallaba con cualquiera con actividad (3 FK sin regla de borrado); ahora, en una transacción, los grupos quedan sin docent, los retos sin autor y los intentos se van con la persona. Quitada la pantalla «Invitaciones», que mostraba datos inventados. |
| Ràdio Escolar | `MYfabio/radio-industrial-jove` · main · `d769bed` | `/superadmin` → miembros de cada centro | Botón «Esborra del tot», solo superadmin. **Los pódcasts publicados se quedan sin dueño** y el nombre de autor no se toca (decisión del propietario). Borra también la cuenta de Supabase si existe `SUPABASE_SERVICE_ROLE_KEY`. |

Además, en dictats volvió a producción trabajo que **se había perdido el
5/11/2026**: un push a GitHub redesplegó sin lo que solo se había subido con
`railway up` (Classroom, grupos del docent, la pregunta «aprendes o enseñas»).
Desde `7c7f369` GitHub y producción coinciden.

### Pareja 1: KIPUK y La Claqueta (desplegadas el 12/11/2026)

Desplegadas con `git push` tras la aprobación del propietario; Railway terminó
en SUCCESS con los dos commits. Comprobado el contenido servido, sin sesión:
en KIPUK `POST /api/admin/users` pasó de 404 a 401 («Cal iniciar sessió»); en
La Claqueta `/admin/usuaris` pasó de 404 a redirigir a `/entrar`; portadas en
200 y `/api/salut` en `ok`. **No se ha creado ni borrado ningún usuario real.**

| App | Repo · rama · commit | Dónde | Qué hace |
|---|---|---|---|
| KIPUK | `MYfabio/kipuk` · main · `01135b4` | `/admin/usuaris` (ruta nueva `POST /api/admin/users`) | Alta previa por centro con `schoolId` explícito (antes iba al «primer centro»): correo + rol; lista de pendientes con anular. 409 si el correo ya entró o ya tiene alta previa. Rechaza correos de otro dominio o que no podrían entrar. Baja solo superadmin, con confirmación: sus **grupos y competiciones pasan al superadmin** que borra (iban en cascada con equipos, partidos y resultados); se van con la persona sus respuestas de encuesta, Classroom, pruebas activadas y asignaciones de grupo por su correo. Listas, marcas e insignias del alumnado se quedan (van por correo, son del centro). El admin de centro puede dar de alta en su centro, no borrar. |
| La Claqueta | `MYfabio/claqueta` · **`main-4xlf7c`** (la que despliega Railway) · `08527b3` | `/admin/usuaris` (enlace «Persones» en `/admin` y en cada centro) | Selector de centro y búsqueda; alta previa (correo del dominio del centro, nombre, rol); cambio de rol; **desactivar/reactivar** como baja por defecto (no entra, se cierran sus sesiones, su trabajo se conserva). «Esborrar del tot» solo si no tiene ninguna actividad (una alta por error): lo impiden las 17 FK sin cascada y antes se comprueban consentimientos y las columnas sin FK de quién publicó o aprobó. Nunca uno mismo ni otro superadmin. Test nuevo `tests/usuaris-superadmin.test.ts`. |

Pruebas hechas (bases temporales `kipuk_altes_tmp` y `claqueta_altes_tmp` en el Postgres local, ya borradas):

- KIPUK: 50/50 casos contra el build de producción (`vinext start`), incluidos duplicado, otro dominio, rol inventado, admin de otro centro (403), docent (403), sin sesión (401), sin confirmar, uno mismo, otro superadmin y usuario inexistente. Tras borrar a un docent con grupo, competición, partido validado, valoración, sesión de pruebas, Classroom e insignia: todo lo del grupo intacto y sin autor. Tipos y lint limpios en lo tocado (los errores de `app/demo`, `examples/` y `worker/` ya estaban).
- La Claqueta: suite completa 84/84 (78 que ya había + 6 nuevos); el 7.º test nuevo se añadió después y pasó junto a los de multicentro (19/19). `tsc`, lint y `next build` correctos. En pantalla: alta, duplicado, dominio ajeno, borrar un docent con grupo y una alumna con consentimiento (rechazados, sin tocar nada), desactivar, cambio de rol, borrar una alta por error, y formularios manipulados (uno mismo, otro superadmin, persona de otro centro): todos rechazados. Un admin de centro que entra en `/admin/usuaris` vuelve a `/app?error=permis`.

### Pareja 2: Chef Boss y Poetes Vives (desplegadas el 12/11/2026)

Desplegadas con `git push` tras la aprobación del propietario (Chef Boss desde
el worktree, `superadmin-usuaris:main`); Railway terminó en SUCCESS con los dos
commits. Comprobado sin sesión: en Chef Boss `POST` y `DELETE
/api/admin/teacher-accounts` pasaron de 404 («Cannot POST/DELETE») a 401, y el
bundle servido (`index-BDe2dBMc.js`, mismo hash que el build local) contiene
los textos nuevos. En Poetes Vives el proxy redirige a `/entrar` antes de llegar
a la página, así que desde fuera solo se ha comprobado el commit desplegado,
portada en 200 y `/coordinacio` protegida; **falta verlo con sesión**. No se ha
creado ni borrado ningún usuario real.

| App | Repo · rama · commit | Dónde | Qué hace |
|---|---|---|---|
| Chef Boss | `MYfabio/chefboss` · main · `b6d4187`, hecho en un **worktree desde `origin/main`** (rama local `superadmin-usuaris`; se subiría con `git push origin superadmin-usuaris:main`) | «Altes docents» (`TeacherAccountsPanel`), rutas nuevas `POST` y `DELETE /api/admin/teacher-accounts` | Ya no hay tabla de centros (la quitó la migración 007): el alta es **solo docent**, como en MatEscac; el superadmin sigue saliendo de `SUPERADMIN_EMAILS`/`TEACHER_ADMIN_EMAILS`. Alta previa (correo y nombre): queda aprobada y con intención «docent», así que al entrar no se le pregunta «alumne o docent». 409 si el correo ya tiene cuenta. Borrar: solo superadmin con cuenta propia (el código maestro no puede), nunca uno mismo ni otro superadmin, con confirmación. Sus **grupos pasan a quien borra** y deja de ser co-docente de los demás (los grupos guardan al dueño por correo, sin FK: se quedaban huérfanos); alumnado, partidas y notas intactos; las partidas abiertas en memoria se refrescan. Lógica en `database.js` (`createTeacherAccount`, `deleteTeacherAccount`). Rechazar, desactivar y reactivar siguen igual. Documentado en `docs/TEACHER_ACCESS_AND_DOMAIN.md`. |
| Poetes Vives | `MYfabio/clubpoetasvius` · **`castellano`** (la que despliega Railway) · `3d9fd1a` | `/coordinacio` | Un solo centro por despliegue (`siteConfig`). Alta previa (correo del dominio del centro, nombre, rol alumna/docent/coordinadora) para coordinación y superadmin; al entrar con Google, Auth.js la enlaza por correo y conserva el rol. Si el correo existe, no se toca. Borrar: solo superadmin, nunca uno mismo ni otro superadmin, y **solo si no tiene ninguna actividad**: poemas, revisiones, escalaciones y grupos apuntan a la persona con `RESTRICT` y no se borran nunca desde aquí. Se van la cuenta enlazada, sesiones, seudónimo, pertenencia a grupos y contador de IA. No existe forma de desactivar (no hay campo). |

Pruebas hechas (bases temporales `chefboss_altes_tmp` y `poetes_altes_tmp`, ya borradas):

- Chef Boss: 24/24 casos contra la API local, incluidos duplicado, correo no válido, docent (403), sin sesión (401), código maestro (403), sin confirmar, uno mismo, otro superadmin, inexistente e id no válido; y el camino del login sobre la cuenta dada de alta (sigue aprobada, sin preguntar intención). Tras borrar a un docent dueño de un grupo y co-docente de otro: el grupo pasa al superadmin, el otro pierde el co-docente, alumnado intacto. En pantalla: alta, confirmación, borrado; sin botones en superadmins. Tests previos 148/148 y build del frontend correctos.
- Poetes Vives: en pantalla con el acceso de prueba de desarrollo: alta, duplicado, dominio ajeno, alta de un superadmin, borrar una alumna con poema y una docente que revisó (rechazados, sin tocar nada), borrar una alumna sin actividad (se va también su seudónimo), formularios manipulados (uno mismo, otro superadmin) rechazados. La coordinación da de alta pero no ve «Esborra», y un POST manipulado suyo a la acción de borrar lo rechaza el servidor (403) sin borrar nada. Quien se dio de alta como docente entra y ve la cola de revisión. `tsc`, lint y `next build` correctos. El enlace con Google no se puede probar en local.

### Pareja 3: Enfonsar la flota y El Taulell (desplegadas el 15/11/2026)

Desplegadas con `git push` tras la aprobación del propietario; Railway terminó
en SUCCESS con los dos commits. Comprobado sin sesión: en Enfonsar la flota
`POST`/`DELETE /api/teacher/accounts` pasaron de 404 a 401 y el bundle servido
de `/docent` contiene los textos nuevos; en El Taulell `/api/platform/members`
pasó de 404 a 401 («Cal iniciar sessió com a administració de plataforma»).
**No se ha creado ni borrado ningún usuario real.**
En las dos la lógica está en funciones de servicio idempotentes (`lib/usuaris.ts`).

| App | Repo · rama · commit | Dónde | Qué hace |
|---|---|---|---|
| Enfonsar la flota | `MYfabio/undirlaflota` · main · `752956a` | `/docent` → «Docents i sol·licituds» (ruta nueva `POST`/`DELETE /api/teacher/accounts`) | El alumnado no tiene cuenta (entra con código de clase y nombre) y no hay centros: el alta es **solo docent**. Alta previa (correo y nombre): queda validado y entra con Google sin pedir acceso. 409 si el correo ya tiene fila (pendiente, validado o rechazado) o acceso por `SUPERADMIN_EMAILS`/`TEACHER_EMAILS`. Borrar: solo superadmin, nunca uno mismo, otro superadmin ni un docente de `TEACHER_EMAILS` (seguiría entrando), con confirmación. Sus **clases pasan a quien borra** (guardan al dueño por correo, sin FK); alumnado, partidas y puntuaciones intactos. Textos ca/es/en. |
| El Taulell | `MYfabio/eltaulell` · main · `907e0bf` | `/administracio-plataforma` → botón «Persones» en cada centro (ruta estática nueva `/api/platform/members`) | Aquí no se entra con Google sino con contraseña: el alta previa (nombre, correo, perfil y grupo) deja a la persona **convidada** y genera el enlace de activación, que se envía por correo (como las altas de coordinación) y se puede copiar. Si el correo ya existe en la plataforma, no se toca. Baja: **suspender** (reversible; ya existía para la coordinación) y reactivar; **borrar** se lleva la pertenencia y lo suyo (grupos, sesiones, sus tareas, uso de IA, invitaciones) y, si no es de otro centro, la cuenta; sus mensajes y encuestas del tablero quedan sin autor. Nunca quien actúa, otra administración de plataforma ni la última coordinación activa. La auditoría de plataforma guarda perfil y recuentos («Persona esborrada (alumnat), compte inclòs, 6 tasques»), sin nombre ni correo. Se añadieron 3 métodos a la base falsa de la vista local con las mismas cascadas que Prisma. |

Pruebas hechas (bases temporales `flota_altes_tmp` y `taulell_altes_tmp`, ya borradas):

- Enfonsar la flota: 25/25 casos contra el servidor local, incluidos pendiente, rechazado y acceso por variable (409), docent (403), sin sesión (401), sin confirmar, uno mismo, otro superadmin, docente de variable, inexistente y repetir el borrado. El docente dado de alta entra al panel; tras borrarlo, sus dos clases (una con el correo en mayúsculas) pasan al superadmin, alumnado y puntuaciones intactos, y ya no entra. En pantalla: alta, confirmación y borrado. `tsc` y `next build` correctos; el error de ESLint en `app/docent/page.tsx` (setState en un efecto) ya estaba antes.
- El Taulell: 38 casos con Prisma real y el acceso demo de plataforma: alta con grupo y de coordinación, duplicado (también de otro centro), sin grupo, grupo de otro centro, centro inexistente, correo no válido; **activación real con el enlace** (queda ACTIVE); suspender y reactivar (ACTIVE con contraseña, INVITED sin ella); última coordinación, uno mismo y otra administración de plataforma rechazados; borrar un alumno con 6 tareas y un mensaje (tareas fuera, mensaje sin autor, cuenta borrada), una persona de dos centros (la cuenta se queda) y una tutora con invitaciones (sin rastro). En pantalla: panel «Persones». `tsc`, 21 tests y `next build` correctos. La prueba e2e local ya fallaba por una aserción antigua (ver hallazgos).

### Pareja 4: Memòria hecha; Museu Apagat a la espera de decidir cómo se despliega

| App | Repo · rama · commit | Dónde | Qué hace |
|---|---|---|---|
| Memòria | `MYfabio/memoria` · main · `f958500`, hecho en un **worktree desde `origin/main`** (rama local `superadmin-usuaris`; la carpeta local tiene trabajo sin commitear de otra sesión: tablas del informe de actividad) | `/[lang]/admin/usuaris` (enlace desde «El meu compte» para superadmin) | Lista de cuentas de cualquier centro y personales con búsqueda, y **borrar** con confirmación: se va la cuenta y todo lo suyo (apuntes, temas, pruebas, repasos), igual que la autobaja. Nunca uno mismo ni otro superadmin. Hasta ahora las cuentas de centro no se podían borrar de ninguna manera (la autobaja es solo para cuentas personales y la coordinación aún no existe). **Sin alta previa**, a propósito: el login identifica por el id de Google y deniega (`conflicte-identitat`) si ya hay una fila con ese correo sin id, así que un alta previa bloquearía la entrada; además entra cualquier cuenta de Google y el centro sale del dominio que certifica Google. Lógica en `src/lib/usuaris.ts`. |
| Museu Apagat | **sin repositorio**: carpeta local `VIP` (no es git) y servicio de Railway `museu-apagat` sin fuente de GitHub (último despliegue el 5/11 con `railway up`) | — | Verificado: superadmin por `SUPERADMIN_EMAILS`; ya hay API `GET`/`PATCH /api/admin/usuaris` (listar y cambiar rol) **sin pantalla**; el login enlaza por correo, así que el alta previa funcionaría; borrar un docente se lleva en cascada sus grupos (con evaluaciones, correcciones y entregas del alumnado): habría que pasarlos al superadmin como en MatEscac. **No se ha tocado** a la espera de decidir cómo desplegarlo. |

Pruebas de Memòria (base temporal `memoria_altes_tmp`, ya borrada; no se usó `memoria_test`, que es compartida con la otra sesión): en pantalla, búsqueda, sin confirmar, uno mismo y otro superadmin (manipulados), inexistente y borrado real (temas incluidos; auditoría con centro y motiu, sin correo). Una cuenta personal recibe 404 en la pantalla, y un envío de la acción de borrar reconstruido con su identificador real responde 404 sin borrar nada (el mismo envío como superadmin sí borra). `tsc`, lint y `next build` correctos; 196/197 tests unitarios (el de salud necesita base de datos).

### Criterio común aplicado

- **Alta:** se crea el usuario antes de que entre, con rol y centro. Al entrar
  con Google (o enlace) el login lo encuentra por correo y conserva el rol. Si
  el correo ya existe, **no se toca** (409): cambiar en silencio rol o centro es
  un cambio de permisos que nadie ha visto.
- **Baja:** solo superadmin; nunca uno mismo; si hay suscripción, se cancela
  antes y, si falla, no se borra; lo propio de la persona (entregas, prácticas,
  intentos) se va con ella; lo del grupo o del centro se conserva (sin autor o
  transferido); el registro de auditoría guarda el rol, **nunca nombre ni
  correo**.
- **Verificación:** cada cambio se probó en local con una base de datos
  temporal (nunca la de producción), incluidos los casos que deben fallar
  (duplicado, sin centro, uno mismo, un docent sin permiso → 403).

---

## 2. Pendiente

### Del propietario

1. **Ràdio Escolar:** en Railway (proyecto `radioescolar`), cambiar el nombre de
   la variable `UPABASE_SERVICE_ROLE_KEY` a `SUPABASE_SERVICE_ROLE_KEY` (falta
   la «S»). Hasta entonces el borrado quita a la persona de la radio pero su
   cuenta de Supabase sigue, y la pantalla lo avisa.
2. **Probar en producción** en cada panel un alta y un borrado con un correo de
   prueba propio. En Ràdio el botón no se ha podido probar en ningún navegador
   (el login es de Supabase).
3. **Ràdio Escolar:** en la carpeta local hay un commit de otra sesión sin
   subir (`ea9e58f`, «Espai i estudi…»). No se publicó a propósito; revisarlo
   antes de hacer push desde esa carpeta.
4. **dictats:** `docs/PROMPT-INICIO.md` se quedó sin subir a propósito (el repo
   es público y lleva rutas locales).

### Pareja 1 (KIPUK y La Claqueta): pendiente

1. ~~Desplegar~~ Hecho: `01135b4` en `kipuk/main` y `08527b3` en
   `claqueta/main-4xlf7c`.
2. Decisiones de producto a confirmar:
   - KIPUK: ¿bien que los grupos y competiciones de un docent borrado pasen
     al superadmin (como en MatEscac)? ¿Y que las marcas e insignias del
     alumno borrado se queden con el centro (van por correo)?
   - La Claqueta: con alumnado con actividad solo se puede desactivar.
     ¿Se quiere además «anonimizar» (quitar nombre y correo)? Cambiaría la
     autoría que sale en la revista publicada, por eso no se ha hecho.
3. Probar en producción un alta y un borrado con un correo de prueba propio.

### Pareja 2 (Chef Boss y Poetes Vives): pendiente

1. ~~Desplegar~~ Hecho: `b6d4187` en `chefboss/main` y `3d9fd1a` en
   `clubpoetasvius/castellano`. Falta abrir `/coordinacio` con sesión de
   superadmin para ver el alta y el borrado en producción.
2. Poetes Vives, decisión de producto: ¿qué hacer con quien tiene poemas o
   revisiones? Opciones: (a) añadir «desactivar» (migración con una columna y
   comprobación en el login; es lo que propone el estudio de cambio de curso),
   (b) borrar con sus poemas (se perderían poemas del mur, el registro de
   moderación y las escalaciones de bienestar), (c) dejarlo como está.
3. Regla nueva aparecida en este informe (funciones de servicio en `lib/`,
   idempotentes): Chef Boss ya la cumple; en Poetes Vives la lógica está en
   `src/app/coordinacio/actions.ts` y en KIPUK dentro de la ruta. Pendiente de
   confirmar con el propietario antes de moverla.

### Pareja 3 (Enfonsar la flota y El Taulell): pendiente

1. ~~Desplegar~~ Hecho: `752956a` en `undirlaflota/main` y `907e0bf` en
   `eltaulell/main`. Falta probar con sesión un alta y un borrado en cada una.
2. El Taulell, privacidad: al borrar a alguien quedan su correo en registros
   antiguos que ya existían (`AuditLog.metadata` de la coordinación,
   `PlatformAuditLog` de «centre creat» y `EmailDelivery.recipient`). ¿Se
   limpian también al borrar? No se ha hecho sin preguntar.

### Pareja 4 (Memòria y Museu Apagat): pendiente

1. **Memòria: permiso para desplegar** `f958500` (desde el worktree:
   `git push origin superadmin-usuaris:main`, rebasando antes si la otra sesión
   ha subido algo).
2. **Memòria, decisión:** ¿se quiere alta previa? Haría falta que el login
   adoptara una fila sin id de Google con ese correo (cambio en la lógica de
   entrada, que hoy es estricta a propósito). Hoy aporta poco: entra cualquiera.
3. **Museu Apagat, decisión:** no tiene repositorio. Opciones: (a) crear
   `MYfabio/museu-apagat` (privado) con la carpeta `VIP` y conectar Railway a
   GitHub, como se hizo con Chef Boss el 25/08; (b) excepción puntual con
   `railway up`, comprobando antes que la carpeta coincide con lo desplegado.

### Apps que faltan (3)

Inventario hecho leyendo el código el 11/11/2026; verificar cada punto antes
de tocar nada.

| App | Superadmin hoy | Alta | Baja | Dónde iría · riesgo al borrar |
|---|---|---|---|---|
| FPSegura | Columna `is_superadmin` sin usar | No | No | Activar `is_superadmin` en `authz.ts` · ~30 FK sin `onDelete`: desactivar |
| Pla Lector | No existe (un centro por despliegue) | Lo hace el admin del centro | Igual | Dar entrada al superadmin (hoy un correo de fuera del dominio no entra) |
| Aules Sostenibles | No existe | Lo hace coordinación | Igual | Definir superadmin en `ADMIN_ROLES` |

Ya lo tenían completo: **AulaAcull** (anonimiza) y **Kiosko** (instalación de un
solo centro).

### Hallazgos de paso (no son de esta tarea)

- **Aules Sostenibles, seguridad:** `firestore.rules` deja crear y borrar
  `roleAssignments` a cualquier cuenta `@escolaindustrial.org`, alumnado
  incluido; la restricción solo está en la pantalla. El propio fichero lo marca
  como regla de desarrollo pendiente antes de producción.
- **TypeEdu:** 1 de 27 tests ya fallaba antes (busca `decision.source === 'self'`,
  que se movió a `access-rules.mjs`). Es una aserción vieja, no una regresión.
- **Diedric3D:** los endpoints `/v1/admin/invitations*` de la API siguen
  devolviendo datos inventados; la pantalla ya no los usa.
- **KIPUK, `/admin/docents`** (alta masiva del centro, no tocada): si el
  correo ya entró, le **cambia el rol en silencio**, y usa el «primer centro»
  de quien actúa: un admin del centro A cuyo primer centro fuera B podría dar
  rol de docent en B. Hoy hay un solo dominio y no pasa, pero conviene
  alinearlo con `/admin/usuaris`.
- **KIPUK, diseño:** cualquier cuenta del dominio entra y recibe «alumne»;
  una persona borrada que vuelva a entrar con Google lo hará como alumna nueva.
- **KIPUK, local:** `npm run dev` corre el servidor en workerd (plugin de
  Cloudflare) y no ve las variables del proceso; para probar con base local
  hay que usar `npm run build` + `npm start`.
- **Chef Boss, carpeta local:** `main` local diverge de `origin/main` (1 commit
  de otra sesión sin subir, `e9a27e1` «No es perd la feina…», y le falta
  `4fe3f93`) y hay ficheros modificados sin commitear. Además existe un
  worktree de otra sesión, `D:/Temp/claude/cb-deploy`, en ese mismo `e9a27e1`.
  Desde el 12/11 `origin/main` lleva 2 commits que ese código no tiene
  (`4fe3f93` y `b6d4187`, el alta y baja): **un `railway up` desde esa carpeta o
  ese worktree los quitaría de producción**. Hay que rebasar sobre `origin/main`
  y subir con `git push`. No se ha tocado nada de eso.
- **Enfonsar la flota, seguridad (menor):** `lib/auth.ts` usa un secreto por
  defecto si falta `SESSION_SECRET`; con él cualquiera podría firmar una sesión
  con el correo de un superadmin. En producción la variable sí está (32+
  caracteres), así que hoy no hay riesgo; convendría que la app no arrancara
  sin ella.
- **El Taulell, prueba e2e:** `npm run test:e2e` falla en la primera
  aserción: busca `class="access-page"` y la página de acceso ya tiene
  `class="access-page access-page-simple"` (commit `73209b9` o anterior). No es
  de esta tarea.
- **El Taulell, alta de coordinación (no tocada):** si el correo ya existe,
  `POST /api/admin/users` le **cambia el nombre** (`upsert … update: { name }`)
  y lo añade al centre; y los registros de auditoría de la coordinación guardan
  el correo.

### Entornos locales que quedan

- dictats: base `dictatsia_dev` y `ditat/.env.local` (ver memoria
  `dictatsia-local-dev`). Las demás bases temporales están borradas.

---

## 3. Prompt para seguir en otra conversación

Abrir una conversación nueva de Claude Code en `C:\Users\super\Desktop\APPS\aulaia-cat`
y pegar:

```
Sigue el trabajo transversal "alta y baja de usuarios desde el superadmin de
cada app" del ecosistema aulaia. Antes de nada lee
docs/superadmin-alta-baja-usuarios.md: ahí está lo hecho (dictats, TypeEdu,
MatEscac, Diedric3D y Ràdio Escolar, ya desplegados), el criterio común y la
lista de las 11 apps que faltan con sus riesgos.

Objetivo: que desde el panel de superadmin de cada app yo pueda dar de alta
(antes de que entren, con rol y centro) y borrar usuarios de cualquier centro.
Aplica el mismo criterio que en las ya hechas: si el correo existe no se toca;
la baja es solo para superadmin y nunca sobre uno mismo; si hay suscripción, se
cancela antes; lo propio de la persona se va con ella y lo del grupo o centro
se conserva; auditoría sin nombre ni correo. Donde la base de datos no deje
borrar (FK sin cascada) o haya alumnado real, propón desactivar o anonimizar en
lugar de borrar.

Orden propuesto: KIPUK, La Claqueta, Chef Boss y Poetes Vives ya están
hechas y desplegadas, y también Enfonsar la flota y El Taulell; siguen
Museu Apagat, Memòria, FPSegura, Pla
Lector y Aules Sostenibles. Trabaja de dos en dos y, al acabar cada pareja, dame un
resumen y pídeme permiso antes de desplegar.

Reglas:
- Verifica en el código cada punto del inventario antes de tocar nada.
- Escribe el alta y la baja como funciones de servicio reutilizables e
  idempotentes (p. ej. altaPrevia y baixa en lib/), no dentro de la ruta ni
  de la pantalla: el cambio de curso automatizado las llamará en bloque (ver
  docs/cambio-de-curso-automatizado.md, apartado 7).
- Prueba siempre en local con una base temporal (Postgres local postgres:ava),
  nunca contra producción, incluidos los casos que deben fallar. Borra la base
  temporal al terminar.
- Antes de commitear mira git status y si hay commits locales sin subir de
  otras sesiones: sube solo lo tuyo (worktree desde origin/main si hace falta).
- Despliega con git push, no con railway up, y comprueba después el contenido
  que sirve producción, no solo el estado "Online".
- Cuando una decisión de producto cambie qué se pierde al borrar (por ejemplo,
  qué pasa con el trabajo del alumnado), pregúntamelo antes.
- Si encuentras algo que no es de esta tarea (seguridad, bugs), anótalo en el
  informe y avísame, no lo arregles sin preguntar.

Al terminar cada app, actualiza docs/superadmin-alta-baja-usuarios.md (qué se
hizo, commit, qué queda).
```
