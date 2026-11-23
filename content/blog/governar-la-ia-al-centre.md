---
titol: "Governar la IA al centre: saber què en fem i per a què"
resum: La pregunta no és quina eina d'IA fa servir un centre, sinó quins processos la fan servir, amb quines dades i amb quin control humà. Cinc preguntes que cal poder respondre abans de fer servir cap eina amb dades reals.
data: 2026-11-23
autor: Fabio Martínez
etiquetes: [Governança de la IA, Privacitat, Coordinació digital, Google Workspace]
apps: [bitacola]
imatge: /blog/governar-la-ia-al-centre.jpg
imatgeAlt: Un robot blanc gegant agenollat al pati d'una escola mostra un globus terraqüi de llum a un grup d'alumnes, mentre dos docents ho observen des de l'entrada.
imatgeCredit: Imatge generada amb intel·ligència artificial
---

Quan parlem d'intel·ligència artificial a l'educació, solem pensar a generar activitats o a corregir textos. Però en un centre la major part de la feina és una altra cosa: processos repetits que s'allarguen tot el curs. Una matrícula, un informe de tutoria, la revisió de centenars d'exercicis, l'anàlisi de resultats per grup i per alumne, el butlletí de notes.

## El problema no és l'eina, és el procés

Aquests processos ja estan automatitzats en part, i moltes vegades ningú no va decidir com. Governar la IA en un centre comença per identificar-los, dir qui decideix en cadascun i per a què serveix l'eina.

## Eines fetes al centre

Una part de la resposta és que el mateix centre, o el seu equip docent, dissenyi eines petites per resoldre les seves necessitats. Tenen tres avantatges:

- **S'ajusten al projecte educatiu.** No cal adaptar el centre a un producte genèric.
- **Són independents.** Si canvia el proveïdor d'una aplicació comercial, el centre no perd el procés.
- **Es poden explicar.** Si el codi i la documentació són públics, qualsevol família, docent o responsable pot veure què fa l'eina.

El risc és el de sempre: que l'eina creixi sense control. Per això convé començar petit, amb un sol procés i una persona responsable clara.

## L'entorn: Google Workspace for Education

Molts centres ja treballen amb Google Workspace for Education. Això vol dir que l'administració del centre té un marc de control: qui té compte, quines dades es guarden, quines aplicacions externes es permeten i quins permisos es concedeixen.

Una eina del centre hauria de respectar aquest marc, no saltar-se'l. A la pràctica, es tradueix en tres regles:

1. **Permisos mínims.** L'aplicació demana només el que necessita. Per exemple, llegir Classroom i Drive només en lectura, sense escriure ni esborrar res.
2. **Autorització explícita.** L'accés el concedeix la persona que l'usa, amb un inici de sessió estàndard i no amb contrasenyes guardades a l'eina.
3. **Control de l'administrador.** L'administrador del domini decideix quines aplicacions pot fer servir el centre i pot revocar-ne l'accés en qualsevol moment.

Cal comprovar cada cas amb la configuració real del domini del centre, perquè les opcions concretes depenen de com l'hagi configurat l'equip d'administració.

## Un exemple: Bitàcola

[Bitàcola](/apps/bitacola) és un projecte per fer visible com l'alumnat fa servir la IA als treballs llargs, començant pel treball de recerca. És en fase de disseny i encara no està desplegat. El disseny preveu:

- Llegir Classroom i Drive només en lectura, amb l'alumnat protegit.
- Anonimitzar les dades abans d'enviar-les a cap model d'IA.
- Fer servir un model a través d'una API, amb la intenció que les dades del centre no s'usin per entrenar-lo. Això s'ha de comprovar a les condicions del proveïdor.
- Allotjar l'aplicació en servidors de la Unió Europea. També cal confirmar-ho abans de publicar-la.
- Que la IA només faci propostes: la valoració la decideix i la signa sempre el docent.

Res d'això vol dir que l'eina estigui funcionant. És el marc en què es dissenya, i el primer pas perquè qualsevol la pugui revisar.

## Transparència: codi públic i documentació

Si una eina del centre fa servir IA, la transparència no es pot quedar en una frase. S'ha de poder comprovar. L'ideal és que el projecte publiqui, com a mínim:

- El codi, en un repositori públic, si l'equip decideix fer-ho.
- Una descripció de quines dades entren, a quin model s'envien i què es retorna.
- Quines decisions pren l'eina i quines continuen sent humanes.
- Un registre de canvis per saber què ha canviat i quan.

Un repositori públic no substitueix l'avaluació d'impacte ni l'acord amb el centre, però permet que qualsevol persona comprovi el que es diu.

## És possible un ús regulat?

Sí, tot i que no és senzill. Hi ha tres marcs que convé revisar amb l'assessorament jurídic del centre. El que segueix és una orientació general, no assessorament legal.

**Reglament europeu d'IA (Reglament (UE) 2024/1689).** Classifica alguns usos de la IA a l'educació com d'alt risc, per exemple els que serveixen per decidir l'accés o l'admissió, avaluar resultats d'aprenentatge o vigilar conductes durant un examen. També prohibeix algunes pràctiques, com el reconeixement d'emocions als centres educatius. Una eina que només ajudi a preparar informes o a organitzar documents té una situació diferent d'una altra que puntuï l'alumnat. Cal determinar en quin grup cau cada ús.

**Protecció de dades (RGPD i llei espanyola).** Moltes dades són de menors. Cal una base legal clara, minimitzar les dades, limitar-ne la finalitat i decidir quant de temps es guarden. Si els tractaments són de risc, sol caldre una avaluació d'impacte.

**Decisions sobre persones.** Un sistema que influeixi en una nota, en un informe o en una decisió sobre un alumne ha de tenir supervisió humana real, no només una signatura al final.

## El que encara no sabem

Per dir que un ús està regulat cal tenir respostes concretes a aquestes preguntes:

- Qui és el responsable del tractament de les dades al centre?
- Quina avaluació d'impacte s'ha fet i qui l'ha revisada?
- Quina informació reben les famílies, i quan cal el seu consentiment?
- Qui pot aturar l'eina si alguna cosa falla?
- Què passa amb les dades si el projecte es deixa de mantenir?

Si el centre no pot respondre aquestes preguntes, l'eina no està preparada per fer-se servir amb dades reals, per bona que sigui.

## Per acabar

Governar la IA en un centre no consisteix a prohibir-la ni a fer-la servir sense mirar. Consisteix a saber quins processos la fan servir, per a què, amb quines dades i amb quin control humà. Les eines creades al mateix centre hi poden ajudar, sempre que siguin petites, transparents i es connectin amb l'administració de l'entorn que el centre ja té.

El repte no és tècnic. És decidir, i poder explicar aquesta decisió.
