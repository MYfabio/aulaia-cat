---
titol: Construir abans de dibuixar: com ensenyar el sistema dièdric amb un validador determinista
resum: El sistema dièdric encalla molt alumnat perquè se li demana deduir un volum a partir de tres dibuixos plans sense haver-lo pogut girar mai. A Diedric3D invertim l'ordre: primer es construeix amb blocs, després es dibuixa. I la correcció no la fa una IA, la fa un validador determinista que sempre explica per què una resposta no encaixa.
data: 2026-11-08
autor: Fabio Martínez
etiquetes: [Dibuix tècnic, Visió espacial, Disseny de software educatiu]
apps: [diedric3d]
imatge: /blog/construir-abans-de-dibuixar-sistema-dedric.jpg
imatgeAlt: Una peça de cubs blancs flotant dins d'un racó de plans quadriculats on es projecten l'alçat, la planta i el perfil amb línies cian sobre fons blau marí
imatgeCredit: Imatge generada amb intel·ligència artificial
---

**En una frase:** un alumne entén una projecció quan l'ha vist canviar mentre construïa el cos, no quan s'ha après la regla; i una correcció que sempre dona el mateix resultat i diu el perquè és més útil a l'aula que una nota opaca, sigui humana o automàtica.

## El problema: deduir un volum sense haver-lo tocat

El sistema dièdric és una de les parts del dibuix tècnic on més alumnat es queda pel camí, i gairebé sempre pel mateix motiu. La didàctica clàssica demana un salt mental difícil: mirar l'alçat, la planta i el perfil, tres dibuixos plans, i imaginar el cos que els explica. Qui té visió espacial ho fa de pressa. La resta memoritza regles («l'alçat és a dalt a l'esquerra») sense construir mai la imatge mental que les justifica.

El problema, doncs, no és de memòria ni d'esforç. És d'**ordre pedagògic**: es demana el camí invers (del dibuix al volum) abans d'haver recorregut el camí directe (del volum al dibuix).

## Principi de disseny: invertir l'ordre

A [Diedric3D](/apps/diedric3d) l'alumnat comença construint. Munta una peça amb blocs i l'alçat, la planta i el perfil es redibuixen al costat cada cop que col·loca o treu un cub. La relació entre el cos i les seves vistes deixa de ser un enunciat i passa a ser una cosa que s'ha vist passar desenes de vegades.

Quan, més endavant, toca el camí invers, ja hi ha un entrenament previ. Els reptes van del reconeixement (quina peça correspon a unes vistes) al dibuix (representar les vistes d'una peça donada), i inclouen peces més exigents, com les cunyes rampa, on la projecció ja no és un simple quadrat.

Això és un patró reutilitzable més enllà del dibuix tècnic: **si un concepte exigeix passar d'una representació a una altra, deixa manipular la font i mostra la derivada en temps real.** L'alumne pot explorar «què passa si...» sense cost i sense por d'equivocar-se.

## El validador determinista: per què no és una IA

La temptació, avui, és posar un model de llenguatge a corregir-ho tot. Aquí hem fet el contrari, i és una decisió d'arquitectura, no una mancança.

Una projecció ortogonal és matemàtica pura: donada una peça, les seves tres vistes són una funció determinada. Comprovar si el dibuix d'un alumne coincideix amb les vistes correctes no requereix cap interpretació. Per tant:

- **Mateixa entrada, mateixa sortida.** La comprovació sempre dona el mateix resultat. No hi ha variància entre dos alumnes que fan el mateix, ni entre dilluns i divendres.
- **Explica el perquè.** Quan una resposta no encaixa, l'aplicació diu què falla, no només que falla. Una correcció que només diu «incorrecte» no ensenya res; una que assenyala la discrepància és ja part de l'aprenentatge.
- **Auditable pel docent.** No cal confiar en una caixa negra. Si l'alumne discuteix el resultat, la regla que l'ha donat es pot explicar.
- **Cost zero i sense latència per intent.** Es poden permetre tants intents com calgui sense pensar en consum.

La IA hi té un paper, però acotat: proposar reptes nous. I aquests reptes els aprova el professorat abans que arribin a l'aula. Segueix la mateixa línia que vam explicar a [la IA proposa la nota, la posa el docent](/blog/la-ia-proposa-la-nota-la-posa-el-docent): fer servir el model per generar, i un mecanisme comprovable per decidir què és correcte.

## Una regla general per escollir

Abans d'afegir IA a una funció educativa val la pena preguntar-se: **aquesta decisió té una resposta calculable?** Si la té, un algoritme determinista guanya en fiabilitat, transparència i cost. La IA és per al que no es pot formalitzar: redactar un comentari, proposar una variant, adaptar un llenguatge. No per a la comprovació de fets que ja sabem calcular.

## Menys feina per al docent, i cap rànquing

L'altra meitat del disseny és el que *no* fa:

- **Importar el grup costa un clic** des de Google Classroom, o es reparteix un codi d'aula de sis caràcters.
- **El seguiment mostra al docent el mateix que veu l'alumne.** No hi ha una vista secreta amb més dades.
- **Cap rànquing ni nota automàtica.** La valoració es queda al centre. Una classificació convertiria un exercici de visió espacial en una competició, i justament qui té més dificultat és qui més se'n ressent.
- **Adaptacions per alumne** (temps extra, treballar sense cronòmetre, més intents, pistes que no penalitzen): es configuren individualment, són privades i no deixen cap marca visible a la feina. Es desa el paràmetre, mai el motiu ni cap diagnòstic. És una aplicació concreta del principi de minimització de dades: el sistema només ha de saber *què* ajustar, no *per què*.
- **Full imprimible amb codi QR** que porta directament a un repte concret, per treballar en paper i reservar el dispositiu per al moment de construir.

## Què es pot endur qualsevol equip que faci EdTech

1. **Inverteix l'ordre si l'alumnat encalla sempre al mateix punt.** El problema sovint no és el contingut, sinó la seqüència.
2. **Mostra la relació en directe.** Si dues representacions estan connectades, que l'alumne pugui tocar l'una i veure moure's l'altra.
3. **Fes servir lògica determinista on la resposta es pot calcular**, i explica sempre el motiu de l'error.
4. **Reserva la IA per al que no es pot formalitzar**, i deixa sempre que una persona validi.
5. **Dissenya sense rànquings quan la dificultat és desigual.** I deixa les adaptacions invisibles.

## Mirant endavant

La visió espacial és una competència que es pot entrenar, i el 3D al navegador ja permet fer-ho sense maquinari especial. El que encara cal és resistir la temptació de convertir-ho tot en un xat. Les millors eines d'aula dels propers anys no seran les que usin més IA, sinó les que sàpiguen exactament on posar-la i on no.

Si ensenyeu dibuix tècnic a l'ESO o al Batxillerat, podeu provar-ho a [diedric3d.com](https://www.diedric3d.com), disponible en català, castellà i anglès.
