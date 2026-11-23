---
titol: "Gobernar la IA en el centro: saber qué hacemos con ella y para qué"
resum: La pregunta no es qué herramienta de IA usa un centro, sino qué procesos la usan, con qué datos y con qué control humano. Cinco preguntas que hay que poder responder antes de usar cualquier herramienta con datos reales.
data: 2026-11-23
autor: Fabio Martínez
etiquetes: [Gobernanza de la IA, Privacidad, Coordinación digital, Google Workspace]
apps: [bitacola]
imatge: /blog/governar-la-ia-al-centre.jpg
imatgeAlt: Un robot blanco gigante arrodillado en el patio de un colegio muestra un globo terráqueo de luz a un grupo de alumnos, mientras dos docentes lo observan desde la entrada.
imatgeCredit: Imagen generada con inteligencia artificial
original: governar-la-ia-al-centre
---

Cuando hablamos de inteligencia artificial en educación, solemos pensar en generar actividades o en corregir textos. Pero en un centro la mayor parte del trabajo es otra cosa: procesos repetidos que se alargan durante todo el curso. Una matrícula, un informe de tutoría, la revisión de cientos de ejercicios, el análisis de resultados por grupo y por alumno, el boletín de notas.

## El problema no es la herramienta, es el proceso

Esos procesos ya están automatizados en parte, y muchas veces nadie decidió cómo. Gobernar la IA en un centro empieza por identificarlos, decir quién decide en cada uno y para qué sirve la herramienta.

## Herramientas hechas en el centro

Una parte de la respuesta es que el propio centro, o su equipo docente, diseñe herramientas pequeñas para resolver sus necesidades. Tienen tres ventajas:

- **Se ajustan al proyecto educativo.** No hace falta adaptar el centro a un producto genérico.
- **Son independientes.** Si cambia el proveedor de una aplicación comercial, el centro no pierde el proceso.
- **Se pueden explicar.** Si el código y la documentación son públicos, cualquier familia, docente o responsable puede ver qué hace la herramienta.

El riesgo es el mismo de siempre: que la herramienta crezca sin control. Por eso conviene empezar pequeño, con un solo proceso y una persona responsable clara.

## El entorno: Google Workspace for Education

Muchos centros ya trabajan con Google Workspace for Education. Eso significa que la administración del centro tiene un marco de control: quién tiene cuenta, qué datos se guardan, qué aplicaciones externas se permiten y qué permisos se conceden.

Una herramienta del centro debería respetar ese marco, no saltárselo. En la práctica, eso se traduce en tres reglas:

1. **Permisos mínimos.** La aplicación pide solo lo que necesita. Por ejemplo, leer Classroom y Drive en modo solo lectura, sin escribir ni borrar nada.
2. **Autorización explícita.** El acceso lo concede la persona que lo usa, con un inicio de sesión estándar y no con contraseñas guardadas en la herramienta.
3. **Control del administrador.** El administrador del dominio decide qué aplicaciones puede usar el centro y puede revocar el acceso en cualquier momento.

Hay que comprobar cada caso con la configuración real del dominio del centro, porque las opciones concretas dependen de cómo lo tenga configurado el equipo de administración.

## Un ejemplo: Bitàcola

[Bitàcola](/es/apps/bitacola) es un proyecto para hacer visible cómo usa la IA el alumnado en los trabajos largos, empezando por el trabajo de investigación de bachillerato. Está en fase de diseño y todavía no está desplegado. El diseño prevé:

- Leer Classroom y Drive en modo solo lectura, con el alumnado protegido.
- Anonimizar los datos antes de enviarlos a cualquier modelo de IA.
- Usar un modelo a través de una API, con la intención de que los datos del centro no se usen para entrenarlo. Esto hay que comprobarlo en las condiciones del proveedor.
- Alojar la aplicación en servidores de la Unión Europea. También hay que confirmarlo antes de publicarla.
- Que la IA solo haga propuestas: la valoración la decide y la firma siempre el docente.

Nada de esto significa que la herramienta esté funcionando. Es el marco en el que se diseña, y el primer paso para que cualquiera pueda revisarlo.

## Transparencia: código público y documentación

Si una herramienta del centro usa IA, la transparencia no puede quedarse en una frase. Tiene que poder comprobarse. Lo ideal es que el proyecto publique, como mínimo:

- El código, en un repositorio público, si el equipo decide hacerlo.
- Una descripción de qué datos entran, a qué modelo se envían y qué se devuelve.
- Qué decisiones toma la herramienta y cuáles siguen siendo humanas.
- Un registro de cambios para saber qué ha cambiado y cuándo.

Un repositorio público no sustituye a la evaluación de impacto ni al acuerdo con el centro, pero permite que cualquier persona compruebe lo que se dice.

## ¿Es posible un uso regulado?

Sí, aunque no es sencillo. Hay tres marcos que conviene revisar con el asesoramiento jurídico del centro. Lo que sigue es una orientación general, no asesoramiento legal.

**Reglamento europeo de IA (Reglamento (UE) 2024/1689).** Clasifica algunos usos de la IA en educación como de alto riesgo, por ejemplo los que sirven para decidir el acceso o la admisión, evaluar resultados de aprendizaje o vigilar conductas durante un examen. También prohíbe algunas prácticas, como el reconocimiento de emociones en centros educativos. Una herramienta que solo ayude a preparar informes o a organizar documentos tiene una situación distinta de otra que puntúe al alumnado. Hay que determinar en qué grupo cae cada uso.

**Protección de datos (RGPD y ley española).** Muchos datos son de menores. Hace falta una base legal clara, minimizar los datos, limitar la finalidad y decidir cuánto tiempo se guardan. Si los tratamientos son de riesgo, suele hacer falta una evaluación de impacto.

**Decisiones sobre personas.** Un sistema que influya en una nota, en un informe o en una decisión sobre un alumno tiene que tener supervisión humana real, no solo una firma al final.

## Lo que aún no sabemos

Para decir que un uso está regulado hay que tener respuestas concretas a estas preguntas:

- ¿Quién es el responsable del tratamiento de los datos en el centro?
- ¿Qué evaluación de impacto se ha hecho y quién la ha revisado?
- ¿Qué información reciben las familias, y cuándo hace falta su consentimiento?
- ¿Quién puede parar la herramienta si algo falla?
- ¿Qué pasa con los datos si el proyecto se deja de mantener?

Si el centro no puede responder a estas preguntas, la herramienta no está lista para usarse con datos reales, por muy buena que sea.

## Para acabar

Gobernar la IA en un centro no consiste en prohibirla ni en usarla sin mirar. Consiste en saber qué procesos la usan, para qué, con qué datos y con qué control humano. Las herramientas creadas en el propio centro pueden ayudar, siempre que sean pequeñas, transparentes y se conecten con la administración del entorno que el centro ya tiene.

El reto no es técnico. Es decidir, y poder explicar esa decisión.
