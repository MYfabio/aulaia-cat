---
titol: Dictado a mano, corregido por foto, al ritmo de cada uno
resum: Un dictado en el aula tiene dos problemas que se aceptan como inevitables: el docente lee a un solo ritmo para treinta ritmos distintos, y corregir treinta hojas a mano se lleva la tarde. Explicamos cómo dictats.cat resuelve los dos sin renunciar al papel, y qué hace cuando la máquina no está segura de lo que lee.
data: 2026-09-21
autor: Fabio Martínez
etiquetes: [Ortografía, Catalán, Atención a la diversidad, Inteligencia artificial]
apps: [dictats, aulaacull, typeedu]
imatge: /blog/dictat-a-ma-al-teu-ritme.jpg
imatgeAlt: Una chica con auriculares escribe a mano un dictado en una libreta, con el portátil abierto al lado y una estantería llena de libros al fondo
imatgeCredit: Imagen generada con inteligencia artificial
original: dictat-a-ma-al-teu-ritme
---

Un dictado de toda la vida tiene algo que ninguna ficha de ortografía tiene: obliga a escuchar, retener y escribir a la vez. Y tiene dos problemas que todo el mundo acepta como parte del paisaje. El primero es el ritmo: el docente lee a una velocidad, y en el aula hay quien va sobrado y quien todavía está en la frase anterior. El segundo es la corrección: treinta hojas escritas a mano, una por una, con el bolígrafo rojo, una tarde entera para saber lo que ya se sospechaba.

En el artículo de agosto explicábamos [qué hace la inteligencia artificial en dictats.cat](/es/blog/la-ia-escribe-el-dictado-la-norma-no) y qué no. Este va de los dos problemas de arriba: cómo se hace un dictado que espera a cada uno, y cómo se corrige un dictado escrito a mano a partir de una foto.

## Un dictado que espera

En [dictats.cat](/es/apps/dictats) el texto no se lee de golpe. Se divide en bloques de frases, y el alumno pasa de un bloque a otro cuando quiere. Antes de que suene la primera lectura de cada bloque hay una cuenta atrás corta con una señal, para que el bolígrafo esté a punto; quien repite la frase ya no la espera.

La velocidad de la voz la elige el alumno, y puede repetir. Hasta dónde, lo decide el docente cuando prepara el dictado: la velocidad por defecto, si las repeticiones son ilimitadas o hay un número por frase, y si la pantalla tiene que estar oculta, lo que quiere decir que el texto no aparece hasta que el dictado se ha enviado. Con límite de repeticiones, el alumno ve cuántas le quedan en cada frase. Un dictado de evaluación y un dictado de práctica son el mismo dictado con estos tres ajustes distintos.

La voz es una locución generada en catalán. Si no ha llegado, o el servicio de voz falla, el navegador lee con su propia voz y el dictado no se detiene.

## Ritmo TDAH y apoyo para la dislexia

Dos ajustes más, que el docente elige al generar el dictado. El **ritmo TDAH** hace que cada bloque sea una sola frase: menos que retener, más pausas, el mismo texto. El **apoyo para la dislexia** genera el dictado con vocabulario sencillo, y en la pantalla están la tipografía OpenDyslexic y el modo de alto contraste.

Son ajustes del dictado, no del alumno. Nadie queda marcado: el docente prepara el dictado que conviene al grupo, o dos dictados de la misma regla, y cada uno hace el suyo.

## Escrito a mano, fotografiado

Aquí es donde vuelve el papel. El alumno puede escribir el dictado con el teclado, o hacerlo a mano en la libreta y fotografiarlo con el móvil o la tableta. La foto se sube, y pasan dos cosas.

Primero, un servicio de reconocimiento de texto lee la foto y saca cada palabra con dos datos: dónde está dentro de la imagen, y cómo de seguro está de haberla leído bien. Después, la inteligencia artificial compara el texto leído con el dictado original y encuentra las faltas, con la explicación de cada una.

Y el resultado no es una lista: es la propia foto, con las marcas encima, imitando lo que haría un maestro con el bolígrafo rojo. La palabra mal escrita, subrayada, con la forma correcta escrita encima. Si solo falla el acento, no se subraya toda la palabra: se marca la vocal que debería llevarlo. Si falta una palabra, una marca de inserción entre las dos de al lado con la que debería ir. El alumno ve su letra, corregida como siempre se ha corregido, y puede tocar cada marca para leer por qué.

## Cuando la máquina no está segura

Esta es la parte que nos parece más importante, y la que menos se ve.

Una letra mal leída por la máquina no es una falta del alumno. Por eso cada palabra lleva el índice de confianza del reconocimiento, y cuando es bajo, la palabra no se corrige: se marca de otra manera, para que el docente la mire. Quizá el alumno la había escrito bien y quien se equivoca es la máquina. Preferimos una marca de «revísalo» a una falta que no existe.

El docente tiene un revisor de entregas donde ve cada dictado con sus marcas, las que son faltas y las que son dudas, y decide. Y con todos los dictados de la clase, ve qué faltas se repiten más, que es para lo que sirve un dictado.

## Qué no resuelve

Como siempre, lo que no hace.

**La foto tiene que ser una foto.** Letra muy pequeña, papel arrugado, poca luz o una foto torcida hacen que el reconocimiento dude de muchas palabras, y entonces el docente tiene que revisar más. La aplicación lo dice con las marcas de duda, pero no hace milagros.

**Corregir una foto cuesta dinero.** El reconocimiento de texto y el modelo que compara se pagan por uso. Por eso hay un límite de tamaño por foto, suficiente para cualquier foto de móvil y no para ficheros enormes, y por eso tiene sentido que el centro tenga su plan.

**Sin claves, todo funciona igual, pero no lee fotos.** Si el servicio de reconocimiento no está configurado, el dictado con teclado funciona y la foto se transcribe con un texto de ejemplo que lo dice claramente. No se finge que corrige.

**El dictado en voz alta del docente no desaparece.** Nada de esto sustituye al docente leyendo en el aula con la clase en silencio. Es para la práctica, la preparación y la evaluación que no se puede hacer a treinta ritmos a la vez.

## Para empezar

[dictats.cat](https://www.dictats.cat) tiene plan gratuito para probarlo, y el plan de centro se pide desde [esta web](/alta?app=dictats). Los dictados van del nivel A1 al C2 y siguen el currículo de Cataluña.

Y si vuestro alumnado todavía no escribe en catalán con comodidad, [AulaAcull.cat](/es/apps/aulaacull) da el paso de antes, con las instrucciones en la lengua de cada uno y el catalán como lengua meta. Un dictado es el paso de después.
