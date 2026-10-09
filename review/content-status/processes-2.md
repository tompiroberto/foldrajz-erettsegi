# Folyamatok – 2. csomag (Légkör, Vízburok; a hold-mozgasa nélkül)

- Fájlok: `src/content/processes/` – uveghazhatas, felho-csapadek, ciklon-anticiklon, frontok, altalanos-legkorzes, monszun, fonszel, ozonreteg, viz-korforgasa, tengeraramlasok, folyo-munkaja, arviz, to-feltoltodese (13 db), mind `generated: true, reviewed: false`.
- Lépések: az outline-os folyamatoknál a catalog lépéscímei betűre pontosan, sorrendben (ikon is került melléjük). A „flow” ábrás folyamatok (felho-csapadek, ozonreteg, tengeraramlasok, arviz, to-feltoltodese) 7–7 lépést kaptak, az ikonok mind a flowIcons listából valók.
- Esszék: 5–6 tartalmi elem, összesen 10 pont, a mintaválasz 5–6 mondat, és minden elemet tartalmaz.
- Fogalmak: csak a concepts.json hivatalos címkéi; helyek: csak a topography.json azonosítói.
- Validátor: `npx tsx scripts/validate-content.ts processes` → 0 hiba, 0 figyelmeztetés (a többi hiányzó folyamat más csomagokhoz tartozik).
- Önellenőrzés: az adiabatikus értékek 1 °C, illetve 0,5 °C/100 m; az északi félgömbi forgásirányok, a passzátszelek iránya és a tengeráramlások köre a tankönyvi modell szerint szerepel.

## Szakmai ellenőrzést kér
- uveghazhatas: „kb. −18 °C a mai kb. +15 °C helyett” (kerek, közismert értékek).
- ozonreteg: Montreali Jegyzőkönyv, 1987; a poláris sztratoszférikus felhők szerepének leegyszerűsített leírása.
- arviz: Szeged, 1879; a 2013-as dunai árvíz rekord vízállása Budapestnél (számérték nélkül).
- fonszel: a Sziklás-hegység (chinook) és az Andok (zonda) mint főnös példák.
- to-feltoltodese: a balatoni algásodás időzítése („a 20. század második felében”).
- ciklon-anticiklon: az Azori-maximumot az Atlanti-óceán azonosítójával jelöltem, mert az Azori-szigeteknek nincs azonosítója.
