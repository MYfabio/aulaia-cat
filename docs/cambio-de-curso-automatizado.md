# Cambio de curso automatizado: un directorio del centro para todas las apps

Estudio del 12/11/2026. Solo análisis: no se ha tocado código de ninguna app.

**La pregunta del propietario:** siendo previsores con el alta y baja de
usuarios que estamos montando, ¿cómo automatizamos el curso que viene el
cambio de curso? Por ejemplo, en la Escola Industrial: pasar a todo el
alumnado a sus grupos nuevos, asignar los docentes de cada grupo, las
tutorías, etc. Eso supone una conexión con todas las apps.

---

## 1. Resumen

- **Hoy cada app guarda sus propios grupos**, creados a mano por el docente o
  importados de Classroom o de un Excel. En septiembre, cada docente tendría
  que rehacer sus grupos en cada app que use. Con una docena de apps en el
  mismo centro, eso no se sostiene. Revisadas 19 apps (El Taulell queda
  fuera: es un prototipo): **ninguna tiene una entrada para recibir datos de
  otro servidor, casi ninguna conoce el curso académico y solo dos tienen
  tutorías** (apartado 3).
- **Propuesta:** un **directorio del centro** en aulaia.cat. Se carga una vez
  al año (y se corrige en septiembre y octubre) con la exportación del
  programa de gestión académica del centro. aulaia.cat calcula qué cambia, tú
  (o la coordinación) lo revisas y lo apruebas, y cada app lo recibe por un
  **conector común** y lo aplica en su propia base de datos.
- **Las apps siguen siendo independientes.** Ninguna consulta aulaia.cat
  cuando alguien entra; solo reciben la estructura cuando cambia. Si
  aulaia.cat cae, todas siguen funcionando. Es el mismo criterio que ya se
  eligió para los cobros (aviso a cada app, cada una guarda su estado).
- **El alta y baja que estamos haciendo ahora es la pieza que el conector
  reutilizará:** dar de alta antes de entrar, con rol y centro, y dar de baja
  sin perder lo del grupo. Conviene escribirla ya como funciones reutilizables
  y no dentro de la pantalla (ver apartado 7).
- **Para septiembre de 2027 es realista:** personas (altas, salidas, nivel)
  en todas las apps; grupos clase y tutorías en dos o tres apps de centro; y
  grupos de materia solo en La Claqueta. El resto de grupos de materia, con
  Classroom como hasta ahora.
- **Antes de conectar nada:** reforzar el acceso al panel de aulaia.cat (hoy
  es una sola contraseña) y tener por escrito el encargo de tratamiento con el
  centro, porque aulaia.cat pasaría a guardar la lista de todo el alumnado.

---

## 2. Qué pasa cada septiembre

Lo que el sistema tiene que resolver, en un centro como la Escola Industrial:

| Movimiento | Ejemplo | Qué tiene que pasar en cada app |
|---|---|---|
| Promoción | 1r ESO A → 2n ESO C | El alumno sale del grupo viejo y entra en el nuevo. Su trabajo del curso pasado se conserva. |
| Repetición | Se queda en 2n ESO, otro grupo | Igual que la promoción, pero mismo nivel. |
| Entrada | Nuevo 1r ESO, 1r de Batxillerat, 1r de FP | Alta previa con rol y centro, y al grupo. |
| Salida | Acaba 4t ESO, 2n de Batxillerat o el ciclo | Deja de tener grupo activo. **Desactivar, no borrar**: el borrado va por la política de conservación. |
| Reorganización | Se rehacen las letras de 3r ESO | Grupos nuevos; los viejos se archivan. |
| Desdobles y optativas | Grupo de Tecnología que mezcla A y B | Grupo de materia distinto del grupo clase. |
| Docencia | Un docente cambia de grupos o de materia | Se le quitan los grupos viejos (archivados) y se le asignan los nuevos. |
| Personal | Docente nuevo, docente que se va | Alta previa; baja con traspaso de sus grupos. |
| Tutorías | Cada grupo clase, su tutor o tutora | Asignar el rol de tutor en las apps que lo usan. |
| Correcciones | Altas tardías, cambios de grupo en octubre | Mismo proceso, otra vez: tiene que poder repetirse sin romper nada. |

**Dos tipos de grupo** que conviene no mezclar:

- **Grupo clase** (1r ESO A): oficial, con tutor. Lo usan las apps de centro
  (Pla Lector, AulaAcull, Aules Sostenibles…).
- **Grupo de materia** (Tecnología 3r ESO, desdoble 1): lo usan las apps de
  aula de un docente (dictats, TypeEdu, MatEscac, Diedric3D…). Puede coincidir
  con un grupo clase o mezclar varios.

El programa de gestión académica del centro tiene los dos, porque es de donde
salen los horarios.

---

## 3. Lo que hay hoy en las apps

Revisión del código de 20 apps el 12/11/2026, solo lectura. La hicieron tres
agentes en paralelo; los puntos de seguridad de dictats los he comprobado a
mano. Antes de tocar una app, verificar su fila en el código.

**El Taulell queda fuera del cambio de curso:** es un prototipo (decisión del
propietario, 12/11/2026). Se revisó, pero no cuenta en lo que sigue.

**Lo común:**

- **Ninguna app tiene una entrada para que otro servidor le mande datos.** Solo
  hay los webhooks de Stripe (dictats, TypeEdu). El conector es trabajo nuevo
  en cada una.
- **Todas identifican por correo**, y en casi todas el correo es único en toda
  la base de datos. Es la buena noticia: el correo del centro sirve de clave
  común sin inventar nada. AulaAcull y KIPUK miran primero el identificador de
  Google y después el correo.
- **Casi ninguna sabe qué es un curso académico.** Solo AulaAcull lo exige
  (formato `2026-2027`), Ciutat Viva lo guarda y Museu Apagat lo tiene
  **escrito a fuego** («2026-2027»). En TypeEdu y Diedric3D la columna
  existe pero no se usa; en Chef Boss y FPSegura es texto libre. En el resto,
  los grupos no tienen tiempo: el «1r ESO A» del curso que viene caería encima
  del de este.
- **Las tutorías casi no existen:** solo Pla Lector (tabla `tutories`, varios
  tutores por grupo) y Aules Sostenibles (rol TUTOR). Poetes Vives tiene una marca de tutor por persona, no por
  grupo. dictats llama «tutor» al único docente del grupo.
- **Varias apps suponen un solo grupo por alumno** (dictats, Museu Apagat,
  AulaAcull, Aules Sostenibles, Ràdio): al cambiar de grupo se pierde el
  rastro del anterior.
- **En seis apps, borrar un grupo se lleva trabajo del alumnado** (TypeEdu,
  KIPUK, Chef Boss, MatEscac, Museu Apagat, Enfonsar la flota). Por
  eso el cambio de curso tiene que **archivar**, nunca borrar y recrear.
- **Seis apps son de un solo centro por instalación** (MatEscac, Museu Apagat,
  Poetes Vives, Pla Lector, Aules Sostenibles, Kiosko) y KIPUK admite un solo
  dominio. No impide el conector; cada instalación tendrá su propia clave.

| App | Grupos hoy | Curso académico | Archivar | Varios docentes | Tutoría | Importación hoy | Qué se rompe en septiembre | Nivel |
|---|---|---|---|---|---|---|---|---|
| Pla Lector | Grupo como texto en el usuario; aulas por grupo | Fechas del curso en configuración; historial de matrículas | — | No (docentes sin grupo) | Sí | Excel (Nom, Correu, Rol, Grup) que cambia de grupo | Casi nada: ya está pensada para reimportar en septiembre. Tutorías y aulas van por nombre de grupo y hay que rehacerlas. | 2 |
| La Claqueta | `grups` + `membres_grup` con alta y baja | No (nivel y fecha de inicio) | Sí | Sí | No | CSV y Classroom con sincronización (marca a quien sale) | Ya guarda el origen de cada grupo y hace bajas suaves: es el modelo más preparado. | 3 |
| FPSegura | `student_group` + `group_member` | Texto libre | Sí | Sí | No | CSV de personas del centro, sin grupo | Falta importar a grupos. Sin cascadas: nada se pierde. | 2 |
| AulaAcull | `group` + `group_membership` | Sí, obligatorio | No | Sí | No (el «tutor» es la IA) | CSV con grupo; códigos de grupo | Cambiar de grupo borra también las pertenencias de cursos anteriores. | 2 |
| Ràdio Escolar | `classes` + `class_members` | No | No | No (un propietario) | No | Excel/CSV de coordinación | La importación reutiliza el grupo que se llame igual y nunca quita a nadie. Los pódcasts van por grupo. | 2 |
| Aules Sostenibles | `groups`; un grupo por alumno | No (constantes en el código) | Sí | Solo tutores | Sí | CSV/XLSX de grupos, alumnado, tutorías y docentes | Reimportar no mueve a nadie (salta los correos que ya existen). Escribe el navegador: haría falta una Cloud Function. | 2 |
| Ciutat Viva | `Group` + `GroupTeacher`; alumnado por equipos | Sí | No | Sí | No | Invitaciones | Revisado solo el esquema. | 3 |
| TypeEdu | `classrooms` + `enrollments` | Columna que la importación no rellena | Sí | No | No | CSV de personas sin grupo; Classroom | Borrar un grupo se lleva los resultados de las pruebas. | 3 |
| Diedric3D | `classrooms` + `enrollments` | Columna sin usar | No | No | No | Classroom sin lista de alumnos (espera la AIPD); códigos | Fácil: el trabajo es del alumno, no del grupo. Pero no guarda listas hasta la AIPD. | 3 |
| KIPUK | `groups` + `group_members` por correo | No (texto libre) | No | Sí (solo para filtrar) | No | Excel/CSV del centro (solo añade); Classroom sin correos | La importación agrupa por código («ESO-1A») y solo añade: mezclaría el curso nuevo con el viejo. Borrar grupos borra el historial de ligas. | 3 |
| Chef Boss | `groups` + `group_students` por correo | Texto libre + archivado | Sí | Sí | No | CSV exportado de Classroom | El juego entero es del grupo, no del alumno. Sin entidad centro. | 3 |
| dictats | `ClassGroup`; un grupo por alumno | No | No | No | El docente se llama «tutor» | CSV de personas sin grupo; Classroom | Sin histórico de grupo; los grupos se acumulan año tras año. | 3 |
| MatEscac | `Group` + alumnos | No | No | No | No | CSV por grupo | Un centro por instalación; borrar un grupo se lleva tareas y torneos. | 3 |
| Museu Apagat | `Group` + `GroupStudent` por correo | Fijo «2026-2027» | No | Sí (correos de codocentes) | No | CSV de Classroom | La app supone un grupo por alumno; borrar un grupo se lleva las correcciones. | 3 |
| Enfonsar la flota | Códigos de clase; el alumno existe por clase | No (la clase caduca al año) | Por caducidad | No | No | Ninguna | La identidad es un apodo por clase: no hay alumno que mover. | — |
| Poetes Vives | Tablas de grupo sin usar | No | — | — | Marca por persona | Ninguna (alta al entrar) | Solo necesita personas y la marca de tutor. | 1 |
| Memòria | Sin grupos (decisión de diseño) | No (nivel del alumno) | — | — | — | Ninguna | Solo subir el nivel (`curs`). | 1 |
| Kiosko, La Cantina | Sin alumnado ni grupos | — | — | — | — | — | Fuera del alcance. | — |
| El Taulell | Prototipo | — | — | — | — | — | Fuera del alcance mientras sea un prototipo. | — |

**Tres niveles de conector**, de menos a más trabajo:

1. **Personas:** alta previa con rol, desactivar a quien sale y, si la app lo
   usa, el nivel del alumno. **Es el alta y baja que estamos haciendo ahora**,
   llamado en bloque. Sirve para todas las apps con usuarios.
2. **Grupos clase y tutorías:** las apps de centro (Pla Lector, AulaAcull,
   Ràdio, Aules Sostenibles, FPSegura).
3. **Grupos de materia y docencia:** las apps de aula de un docente (dictats,
   TypeEdu, MatEscac, Diedric3D, KIPUK, La Claqueta, Chef Boss, Museu Apagat,
   Ciutat Viva). Es el más caro, y en estas apps el grupo es del docente, que
   ya lo puede importar de Classroom.

**Conclusión:** el nivel 1 en todas antes de septiembre de 2027 es realista,
porque reutiliza el alta y baja. El nivel 2, en dos o tres apps de centro. El
nivel 3, empezar solo por La Claqueta (su modelo ya está preparado) y dejar
el resto con la importación de Classroom un curso más.

---

## 4. De dónde salen los datos

| Fuente | A favor | En contra |
|---|---|---|
| **A. Exportación del programa de gestión académica** (CSV o Excel: alumnado y grupo, docencia, tutorías) | Es donde vive la matrícula: la versión oficial. No hace falta ningún permiso especial de Google. Sirve para cualquier centro. | Hay que subir el fichero (una vez en julio o septiembre y en las correcciones). Cada programa exporta con columnas distintas: hace falta un adaptador por programa. |
| **B. Google Workspace** (unidades organizativas, grupos de Google, Classroom) | Ya es la identidad con la que se entra en todas las apps. Se podría leer solo. | Leer el directorio exige que el superadministrador de Workspace del centro dé permisos de administrador a una cuenta de servicio: es la llave de todo el dominio. Classroom tiene los cursos de cada docente, pero no los grupos clase ni las tutorías. |
| **C. A mano en el panel** | Sin dependencias. | No escala; solo para correcciones puntuales. |

**Recomendación: A como fuente principal** (una plantilla propia «estructura
del curso» y un adaptador para lo que exporte el programa de la Escola
Industrial), **C para correcciones** y **B solo como comprobación** más
adelante, si el centro lo quiere. Classroom sigue siendo la mejor vía para que
un docente importe *su* grupo de materia en apps donde el grupo es suyo y no
del centro.

Si el programa del centro es **iEduca**, puede que haya API y no haga falta
subir ningún fichero. El prototipo de El Taulell tiene un conector con iEduca
(`eltaulell/lib/external-integrations.ts`) que sirve de referencia, pero solo
lee cursos, recursos y actividades, no alumnado ni tutorías: habría que ver
qué más expone la API para el centro.

A más largo plazo, si la app de Matrícula (hoy prototipo) llega a usarse, ella
misma sería la fuente: la matrícula ya diría en qué grupo va cada alumno.

---

## 5. Arquitectura propuesta

```
 Programa de gestión          aulaia.cat (panel)                    Cada app
 académica del centro
 ┌───────────────┐   Excel   ┌──────────────────────┐   aviso    ┌──────────────────┐
 │ alumnado,     │ ───────▶  │ 1. Directorio del    │  firmado   │ Conector común   │
 │ grupos,       │  (julio,  │    centro (curso N)  │ ─────────▶ │ /api/aulaia/sync │
 │ docencia,     │  sept.,   │ 2. Plan de cambios   │            │  · simulación    │
 │ tutorías      │  octubre) │    N-1 → N           │ ◀───────── │  · aplicar       │
 └───────────────┘           │ 3. Aprobación        │  informe   │  · informe       │
                             │ 4. Envío por app     │ sin nombres│                  │
                             └──────────────────────┘            └──────────────────┘
```

### 5.1 El directorio del centro (en aulaia.cat)

Datos mínimos, por centro y por curso académico:

- **Curso académico** (`2027-2028`, el formato que ya usa AulaAcull), con
  estado: preparación, activo, cerrado.
- **Grupo:** código estable (`2027-2028/2ESO-C`), nombre, etapa, nivel, tipo
  (clase o materia), y para los de materia, a qué grupos clase pertenece.
- **Persona:** correo del dominio del centro (la clave: es con lo que se entra
  en todas las apps), nombre para mostrar y rol (alumno, docente,
  coordinación).
- **Matrícula** (alumno → grupo clase y grupos de materia), **docencia**
  (docente → grupo, materia) y **tutoría** (docente → grupo clase).

**Lo que no se guarda:** ni NESE, ni fecha de nacimiento, ni DNI, ni datos de
familias, ni notas. Si una app necesita NESE (TypeEdu, por ejemplo), lo sigue
gestionando ella. Se conservan solo el curso activo y el anterior (hace falta
para calcular los cambios); lo demás se purga solo.

### 5.2 Plan de cambios y aprobación

Al subir la estructura de un curso nuevo, aulaia.cat la compara con la
anterior y enseña un resumen, **sin aplicar nada**:

> 2027-2028 en la Escola Industrial: 412 alumnos cambian de grupo, 118 entran,
> 109 salen, 6 docentes nuevos, 2 se van, 14 tutorías cambian. Afecta a:
> dictats (9 grupos), KIPUK (14), Pla Lector (16)… *(cifras de ejemplo)*

Después, cada app hace una **simulación** con esos datos y responde qué haría
(cuántas altas, bajas, grupos archivados, avisos). Solo con todo revisado se
pulsa «Aplicar», app por app o todas.

### 5.3 El conector común (en cada app)

Un único contrato, igual en todas las apps, para que el trabajo de una sirva
de plantilla a las demás:

1. **Una ruta**, `POST /api/aulaia/sync`, que solo acepta peticiones de
   servidor firmadas con HMAC-SHA256 (cuerpo + marca de tiempo, rechaza si
   tiene más de 5 minutos), con **una clave distinta por app** (si se filtra
   la de una, no sirve para las demás). Mismo estilo que `/api/correu`, pero
   con firma en lugar de clave en claro.
2. **Foto completa, no lista de cambios.** La app recibe la estructura entera
   de los grupos que le tocan para ese curso y la reconcilia con lo que tiene.
   Si un envío falla a medias, el siguiente lo arregla; se puede repetir
   cuantas veces haga falta (idempotente por número de versión).
3. **Solo toca lo que es suyo.** Los grupos y pertenencias que vienen del
   directorio se marcan con su origen y su código externo. Los grupos que un
   docente se haya hecho a mano no se tocan nunca.
4. **Archivar, no borrar.** Los grupos del curso que se cierra quedan en solo
   lectura con su trabajo dentro, para la evaluación y el historial.
5. **Desactivar, no borrar.** Quien sale del centro deja de poder entrar; el
   borrado real va por la política de conservación de cada app y por la baja
   que ya estamos montando.
6. **Si el correo existe, no se cambia su rol en silencio**: es el mismo
   criterio del alta. Un cambio de rol se lista en la simulación y se aprueba.
7. **Informe de vuelta solo con cifras** (altas, bajas, grupos, errores por
   código), nunca nombres ni correos.
8. **Modo simulación** (`simulacio: true`): hace todo dentro de una
   transacción y la deshace al final.

Cada app recibe solo **los centros que la tienen contratada y los niveles que
le interesan** (el campo `nivells` de `data/apps.json` ya lo dice: Pla Lector
no necesita FP; FPSegura no necesita ESO).

### 5.4 Alternativas descartadas

- **Que las apps consulten aulaia.cat al entrar.** Mete aulaia.cat en el
  camino de todas: si cae, caen todas. Descartado igual que para los cobros.
- **Inicio de sesión único emitido por aulaia.cat.** Una segunda puerta a
  todos los paneles, protegida por la contraseña del panel. Ya se descartó.
- **Classroom como única fuente.** No tiene grupos clase ni tutorías, y cada
  docente tendría que reconectar en cada app cada septiembre.
- **Borrar y recrear los grupos cada año.** Se llevaría el trabajo del
  alumnado en cascada en varias apps (ver apartado 3).

---

## 6. Seguridad y protección de datos

Con el directorio, aulaia.cat pasa de guardar solicitudes de centros a guardar
la lista de todo el alumnado de un centro, menores incluidos. Eso cambia lo
que hay que tener antes de empezar:

1. **Acceso al panel:** entrar con Google (tu cuenta del centro, lista
   cerrada de correos) y segundo factor, no solo la contraseña actual. Sin
   esto, el panel sería la llave de todas las apps: es la condición que ya
   dejamos escrita en `docs/superadmin-alta-baja-usuarios.md`.
2. **Encargo de tratamiento:** el centro es el responsable; aulaia.cat sería
   encargado. Hace falta el contrato o la adenda con la Escola Industrial y
   que la evaluación de impacto cubra el directorio (la aprobada el
   28/10/2026 es para el alumnado de Classroom en dictats; no está confirmado
   que cubra más).
3. **Mínimo de datos** (apartado 5.1) y **purga automática** de los cursos
   cerrados.
4. **Registro de auditoría** en aulaia.cat y en cada app: quién aprobó, cuándo,
   cuántos cambios. Nunca nombres ni correos.
5. **Claves por app**, guardadas como variables de entorno, con rotación
   prevista.
6. **El fichero subido no se guarda:** se lee, se valida y se descarta.
7. **Desarrollo con datos inventados.** La exportación real solo en producción.

---

## 7. Qué cambia ya en el alta y baja (ser previsores)

El trabajo de `docs/superadmin-alta-baja-usuarios.md` es exactamente lo que el
conector hará en bloque. Para no tener que rehacerlo, en las 9 apps que faltan
(y, cuando se pueda, en las ya hechas):

- **La lógica en una función de servicio** (`lib/usuaris…`), no dentro de la
  ruta ni de la pantalla: `altaPrevia(correu, rol, centre)` y
  `baixa(persona, mode)`. El panel de superadmin la llama para uno; el
  conector, para cien.
- **Idempotente:** llamar dos veces con lo mismo no da error ni duplica.
- **Desactivar como modo de baja** donde aún no existe. El cambio de curso
  desactiva; borrar es otra decisión.
- **Nada más en el modelo de datos por ahora.** No hace falta añadir columnas
  de curso ni de origen hasta que se construya el conector de cada app.

Y hay cosas que **romperán septiembre de 2027 aunque nunca hagamos el
directorio**, porque también afectan a la reimportación a mano. Conviene
arreglarlas antes del verano, cada una en su app:

- **Museu Apagat:** el curso «2026-2027» es el valor por defecto de
  `Group.curs`. Los grupos nuevos nacerían con el año viejo.
- **KIPUK:** la importación del centro agrupa por código y solo añade: el
  «ESO-1A» de 2027-2028 se mezclaría con el de este curso.
- **Ràdio Escolar:** la importación reutiliza el grupo que se llame igual y
  nunca quita a nadie.
- **Aules Sostenibles:** reimportar no cambia de grupo a quien ya tiene rol.
- **AulaAcull:** cambiar de grupo borra las pertenencias de cursos anteriores.

---

## 8. Calendario hasta septiembre de 2027

| Cuándo | Qué | Quién |
|---|---|---|
| Nov.–dic. 2026 | Terminar el alta y baja con funciones reutilizables (apartado 7). Decidir las preguntas del apartado 9. | Yo · tú |
| Ene.–feb. 2027 | Acceso al panel con Google y segundo factor. Contrato del formato «estructura del curso» y plantilla Excel. Pedir al centro una exportación de prueba. | Yo · tú |
| Mar.–abr. 2027 | Directorio en aulaia.cat: subir, validar, plan de cambios. Sin enviar a ninguna app. Arreglar lo que rompe septiembre (final del apartado 7). | Yo |
| Abr.–may. 2027 | Conector en las apps piloto, con simulación, probado con datos inventados. Propuesta: **Pla Lector** (nivel 2; el conector es la versión automática de su importación de Excel), **La Claqueta** (nivel 3) y **Memòria** (nivel 1). Después, nivel 1 en el resto. | Yo |
| Jun. 2027 | Ensayo general con la estructura de 2026-2027 en simulación contra producción (no aplica nada). | Yo · tú |
| Jul. 2027 | Cerrar 2026-2027: archivar grupos en las apps piloto. | Tú apruebas |
| Sept. 2027 | Cargar 2027-2028 en las apps piloto, y personas (nivel 1) en las demás. Los grupos de materia, como hasta ahora (a mano o Classroom). | Tú apruebas |
| Sept.–oct. 2027 | Correcciones con el mismo proceso. Ampliar a más apps por orden de uso. | Yo |

---

## 9. Decisiones y preguntas para ti

1. **¿Qué programa de gestión académica usa la Escola Industrial** (¿iEduca?)
   y quién puede sacar la exportación (secretaría, jefatura de estudios)? Una
   exportación de muestra, aunque sea con nombres inventados, decide el
   adaptador.
2. **¿Quién aprueba el cambio de curso en cada centro?** ¿Solo tú (superadmin)
   o también la coordinación del centro desde el panel? Si es la coordinación,
   el panel necesita usuarios con rol, no solo tu cuenta.
3. **¿Con qué apps empezamos?** Propongo Pla Lector, La Claqueta y Memòria
   (apartado 8), pero manda lo que la Escola Industrial usa de verdad con
   alumnado: dime cuáles.
4. **¿Qué hacemos con el trabajo del curso pasado?** Propuesta: grupos
   archivados en solo lectura durante un curso más y después la purga de cada
   app.
5. **¿Los docentes pueden seguir creando grupos propios** al lado de los del
   directorio? Propuesta: sí, y el conector no los toca.
6. **Contrato de encargo de tratamiento con el centro:** ¿existe ya algo que
   cubra las apps de aulaia.cat, o hay que redactarlo? Diedric3D, por
   ejemplo, no guarda las listas de Classroom hasta que se apruebe la AIPD: el
   directorio necesita esa misma aprobación.

---

## 10. Hallazgos de paso (no son de este estudio)

Para arreglar en su app, cada uno con tu permiso:

- **dictats, seguridad (media), comprobado:** la importación por CSV de la
  coordinación hace `upsert` por correo con `update: { schoolId }`
  (`ditat/src/app/school/actions.ts:57-60`). Si la coordinación de un centro
  importa el correo de alguien de otro centro, se lo lleva al suyo sin aviso.
  Contradice el criterio del alta («si el correo existe, no se toca»). En el
  mismo fichero, `assignStudentToClass` (`:186-194`) no comprueba que el
  alumno y el grupo sean del centro de quien lo hace (los ids no se adivinan,
  pero falta la comprobación).
- **dictats, menor, comprobado:** borrar a un docente borra en cascada su
  historial de enmiendas de corrección (`TeacherOverride`,
  `ditat/prisma/schema.prisma:403`). La corrección se queda; se pierde quién
  la cambió y por qué. El borrado desde el superadmin sí conserva los dictados
  (`ditat/src/app/admin/actions.ts:217`).
- **KIPUK:** `groups.owner_id` va en cascada (`Kipuk/db/schema.ts:81`). Si se
  borrara fuera del panel al admin que hizo la importación, se irían los
  grupos del centro. La baja del superadmin ya los traspasa.
- **Aules Sostenibles:** la función `getMyRoles` lee `roleAssignments/{uid}`
  (`functions/src/index.ts:37`), pero la app crea esos documentos con id
  automático: la función no encontraría los roles. Se suma a las reglas de
  Firestore de desarrollo que ya estaban anotadas.
