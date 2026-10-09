# Fogalomtár t4-2 (4.5–4.8 + egyedi fogalmak)

- Fájl: `src/content/concepts/t4-2.json` – 131 szócikk, a batch minden címkéje lefedve (4.5, 4.6, 4.7, 4.8, „A 4. témához tartozó egyedi fogalmak”).
- Validátor: `npx tsx scripts/validate-content.ts concepts src/content/concepts/t4-2.json` → 0 hiba, 0 figyelmeztetés. Minden `related` és `parent` a fájlon belüli id-re mutat.
- Összevont, szétvágott címkék: „erdős” + „cserjés és füves szavanna”; „ős-” / „elő-” / „ó-” / „közép- és újidő” (fő szócikk + 5 al-szócikk); „kaledóniai” / „variszkuszi” / „eurázsiai és pacifikus hegységképződés” (fő + 4 al).
- Hierarchia: övezet → öv/vidék → terület → éghajlat/növényzet (`parent`); időszakok az óidő/középidő alá, a korok a harmadidőszak alá, a glaciális/interglaciális a jégkor alá.
- Id-ütközés elkerülése: a 4.7-es „hóhatár” id-je `hohatar-hegysegekben` (a 4.2-es batch valószínűleg `hohatar`-t használ).

## Lektornak ellenőrizendő
- Időpontok: Föld kb. 4,6 milliárd év; ős/elő határ kb. 2,5 milliárd; óidő kezdete kb. 540 millió; középidő kb. 250–66 millió; negyedidőszak kezdete kb. 2,6 millió (régebbi tankönyvek ~1,8–2 milliót írnak); holocén kb. 10 ezer éve.
- Hazai példák: eocén barnakőszén (Dorog, Tatabánya), oligocén kiscelli agyag, jura mecseki kőszén, kréta bakonyi bauxit, triász dolomit a Dunántúli-középhegységben.
- A Pannon-tó feltöltődését a pliocénhez kötöttük („ekkorra nagyrészt”), a modern rétegtan szerint nagyrészt késő miocén – szükség esetén pontosítsd.
- A szavanna altípusainak sorrendje (erdős → füves → cserjés az Egyenlítőtől távolodva) a tankönyvi felosztást követi.
