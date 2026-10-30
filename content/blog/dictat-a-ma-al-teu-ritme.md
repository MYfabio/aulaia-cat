---
titol: Dictat a mà, corregit per foto, al ritme de cadascú
resum: Un dictat a l'aula té dos problemes que s'accepten com a inevitables: el docent llegeix a un sol ritme per a trenta ritmes diferents, i corregir trenta fulls a mà s'emporta la tarda. Expliquem com dictats.cat resol els dos sense renunciar al paper, i què fa quan la màquina no està segura del que llegeix.
data: 2026-09-21
autor: Fabio Martínez
etiquetes: [Ortografia, Català, Atenció a la diversitat, Intel·ligència artificial]
apps: [dictats, aulaacull, typeedu]
imatge: /blog/dictat-a-ma-al-teu-ritme.jpg
imatgeAlt: Una noia amb auriculars escriu a mà un dictat en una llibreta, amb el portàtil obert al costat i una prestatgeria plena de llibres al fons
imatgeCredit: Imatge generada amb intel·ligència artificial
---

Un dictat de tota la vida té una cosa que cap fitxa d'ortografia no té: obliga a escoltar, retenir i escriure alhora. I té dos problemes que tothom accepta com a part del paisatge. El primer és el ritme: el docent llegeix a una velocitat, i a l'aula hi ha qui va sobrat i qui encara està a la frase anterior. El segon és la correcció: trenta fulls escrits a mà, un per un, amb el bolígraf vermell, una tarda sencera per saber el que ja se sospitava.

A l'article d'agost explicàvem [què hi fa la intel·ligència artificial a dictats.cat](/blog/la-ia-escriu-el-dictat-la-norma-no) i què no. Aquest va dels dos problemes de dalt: com es fa un dictat que espera cadascú, i com es corregeix un dictat escrit a mà a partir d'una foto.

## Un dictat que espera

A [dictats.cat](/apps/dictats) el text no es llegeix de cop. Es parteix en blocs de frases, i l'alumne passa d'un bloc a l'altre quan vol. Abans que soni la primera lectura de cada bloc hi ha un compte enrere curt amb un senyal, perquè el bolígraf estigui a punt; qui repeteix la frase ja no l'espera.

La velocitat de la veu la tria l'alumne, i pot repetir. Fins on, ho decideix el docent quan prepara el dictat: la velocitat per defecte, si les repeticions són il·limitades o n'hi ha un nombre per frase, i si la pantalla ha d'estar oculta, que vol dir que el text no apareix fins que el dictat s'ha enviat. Amb límit de repeticions, l'alumne veu quantes li queden a cada frase. Un dictat d'avaluació i un dictat de pràctica són el mateix dictat amb aquests tres ajustos diferents.

La veu és una locució generada en català. Si no ha arribat, o el servei de veu falla, el navegador llegeix amb la seva pròpia veu i el dictat no s'atura.

## Ritme TDAH i suport per a la dislèxia

Dos ajustos més, que el docent tria en generar el dictat. El **ritme TDAH** fa que cada bloc sigui una sola frase: menys per retenir, més pauses, el mateix text. El **suport per a la dislèxia** genera el dictat amb vocabulari senzill, i a la pantalla hi ha la tipografia OpenDyslexic i el mode d'alt contrast.

Són ajustos del dictat, no de l'alumne. Ningú queda marcat: el docent prepara el dictat que convé al grup, o dos dictats de la mateixa regla, i cadascú fa el seu.

## Escrit a mà, fotografiat

Aquí és on el paper torna. L'alumne pot escriure el dictat al teclat, o fer-lo a mà a la llibreta i fotografiar-lo amb el mòbil o la tauleta. La foto puja, i passen dues coses.

Primer, un servei de reconeixement de text llegeix la foto i en treu cada paraula amb dues dades: on és dins de la imatge, i com de segur està d'haver-la llegit bé. Després, la intel·ligència artificial compara el text llegit amb el dictat original i troba les faltes, amb l'explicació de cada una.

I el resultat no és una llista: és la foto mateixa, amb les marques a sobre, imitant el que faria un mestre amb el bolígraf vermell. La paraula mal escrita, subratllada, amb la forma correcta escrita a sobre. Si només falla l'accent, no se subratlla tota la paraula: es marca la vocal que l'hauria de portar. Si hi falta una paraula, un ganxo entre les dues del costat amb la que hi hauria d'anar. L'alumne veu la seva lletra, corregida com sempre s'ha corregit, i pot tocar cada marca per llegir per què.

## Quan la màquina no està segura

Aquesta és la part que ens sembla més important, i la que menys es veu.

Una lletra mal llegida per la màquina no és una falta de l'alumne. Per això cada paraula porta el nombre de confiança del reconeixement, i quan és baix, la paraula no es corregeix: es marca d'una altra manera, perquè el docent hi miri. Potser l'alumne l'havia escrit bé i qui s'equivoca és la màquina. Preferim una marca de «revisa-ho» que una falta que no existeix.

El docent té un revisor de lliuraments on veu cada dictat amb les seves marques, les que són faltes i les que són dubtes, i decideix. I amb tots els dictats de la classe, veu quines faltes es repeteixen més, que és el que un dictat serveix per saber.

## Què no resol

Com sempre, el que no fa.

**La foto ha de ser una foto.** Lletra molt petita, paper arrugat, poca llum o una foto torta fan que el reconeixement dubti de moltes paraules, i llavors el docent ha de revisar-ne més. L'aplicació ho diu amb les marques de dubte, però no fa miracles.

**Corregir una foto costa diners.** El reconeixement de text i el model que compara es paguen per ús. Per això hi ha un límit de mida per foto, prou per a qualsevol foto de mòbil i no per a fitxers enormes, i per això té sentit que el centre tingui el seu pla.

**Sense claus, tot funciona igual, però no llegeix fotos.** Si el servei de reconeixement no està configurat, el dictat al teclat funciona i la foto es transcriu amb un text d'exemple que ho diu clarament. No es fa veure que corregeix.

**El dictat en veu alta del docent no desapareix.** Res d'això substitueix el docent llegint a l'aula amb la classe en silenci. És per a la pràctica, la preparació i l'avaluació que no es pot fer a trenta ritmes alhora.

## Per començar

[dictats.cat](https://www.dictats.cat) té pla gratuït per provar-ho, i el pla de centre es demana des d'[aquesta web](/alta?app=dictats). Els dictats van del nivell A1 al C2 i segueixen el currículum de Catalunya.

I si el vostre alumnat encara no escriu en català amb comoditat, [AulaAcull.cat](/apps/aulaacull) fa el pas d'abans, amb les instruccions en la llengua de cadascú i el català com a llengua meta. Un dictat és el pas de després.
