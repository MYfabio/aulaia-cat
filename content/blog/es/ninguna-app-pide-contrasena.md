---
titol: Por qué ninguna de nuestras apps pide una contraseña
resum: Un centro que estrena seis herramientas digitales acaba con seis listas de usuarios y seis contraseñas olvidadas. Explicamos la decisión que tomamos para evitarlo y qué implica para la coordinación.
data: 2026-08-27
autor: Fabio Martínez
etiquetes: [Coordinación digital, Privacidad, Google Workspace]
apps: [dictats, typeedu, radio-escolar]
imatge: /blog/cap-app-demana-contrasenya.png
imatgeAlt: Una lista de contraseñas de alumnos tachada, junto a la cuenta del centro
original: cap-app-demana-contrasenya
---

Cada septiembre pasa lo mismo en muchos centros. Se estrena una herramienta nueva, alguien prepara una hoja de cálculo con el nombre y el correo de ciento sesenta alumnos, se generan contraseñas, se imprimen en papelitos y se reparten por las aulas. En diciembre, la mitad se han perdido. En marzo, ya nadie recuerda quién tiene acceso a qué.

Este artículo explica por qué decidimos que **ninguna de nuestras herramientas gestionaría contraseñas**, y qué significa eso para quien coordina la digitalización de un centro.

## El problema no es la contraseña, es la lista

Una contraseña olvidada se recupera. El problema de verdad es la lista que hay detrás.

Cuando una aplicación guarda sus propios usuarios, el centro pasa a mantener **una copia más** de los datos de su alumnado. Esa copia hay que actualizarla cuando alguien cambia de grupo, borrarla cuando alguien se va y protegerla mientras exista. Multiplicadlo por las herramientas que usa el centro y tenéis un trabajo de mantenimiento que no hace nadie porque no es de nadie.

Y el día que llega una consulta sobre protección de datos, la pregunta incómoda no es si las contraseñas eran lo bastante largas. Es **cuántas copias hay del listado de alumnos y dónde están**.

## La decisión: el centro ya tiene la identidad

Casi todos los centros con los que trabajamos ya tienen cuentas de Google para su alumnado y su profesorado. Esa identidad existe, la mantiene alguien del centro, y se da de alta y de baja con los procesos que el centro ya tiene.

Construir una segunda identidad al lado de esta no aporta nada. Solo añade una lista que se desincroniza.

Por eso nuestras herramientas **no tienen registro**. Se entra con la cuenta del centro, y el dominio del correo determina a qué centro pertenece cada uno. Si alguien entra con una cuenta de `escolaexemple.cat` y ese dominio está dado de alta, la aplicación ya sabe dónde ponerlo. No hace falta invitar a nadie uno por uno ni repartir códigos.

## Qué gana la coordinación

**Las bajas funcionan solas.** Cuando el centro desactiva la cuenta de Google de una persona, esa persona deja de entrar en todas las herramientas el mismo día. No hay que acordarse de hacerlo en seis sitios.

**No hay contraseñas que recuperar.** Ni las nuestras ni las vuestras. El soporte que eso genera a lo largo de un curso no es despreciable.

**Los grupos se importan.** Si el profesorado ya usa Google Classroom, los grupos y las listas se traen desde allí. Pedirle a un docente que vuelva a teclear una lista que ya existe es la manera más rápida de que deje de usar una herramienta.

## Qué no resuelve

Vale la pena decir también lo que no arregla, porque lo preguntaréis tarde o temprano.

**No todos los centros encajan.** Hay algunos donde el alumnado usa un dominio distinto del profesorado, y otros donde el profesorado entra con cuentas personales. Por eso, aunque el dominio asigna automáticamente, los grupos mantienen un código de invitación: es la vía para quien no encaja en la regla.

**Los datos no desaparecen.** Que no guardemos contraseñas no quiere decir que no guardemos nada. Cuando una herramienta importa un grupo, el nombre y el correo de ese alumnado pasan a estar también en nuestra base de datos, y eso es responsabilidad nuestra y vuestra. Lo que sí evitamos es una segunda contraseña y un segundo proceso de alta y baja.

**No sustituye vuestro criterio.** Que una herramienta sea fácil de poner en marcha no quiere decir que tengáis que ponerla en marcha. La pregunta previa sigue siendo si resuelve un problema que tenéis.

## Cómo comprobarlo antes de decidir

Si estáis valorando cualquier herramienta educativa, estas tres preguntas os ahorrarán trabajo el curso que viene:

1. **¿Cómo se entra?** Si la respuesta incluye generar contraseñas, ya sabéis quién acabará repartiéndolas.
2. **¿Qué pasa cuando un alumno se va del centro?** Si hay que acordarse de borrarlo a mano en esa herramienta, no pasará.
3. **¿De dónde salen los grupos?** Si hay que teclearlos, se teclearán una vez y nunca más se actualizarán.

Son tres preguntas que se hacen en cinco minutos y que dicen más sobre cómo será el curso que cualquier demostración.
