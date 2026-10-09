# Helyek – Föld, Afrika, Amerika (`src/content/places-facts/fold-afrika-amerika.json`)

- 193/193 topográfiai elem kész (Föld 61, Afrika 49, Amerika 83), mind `generated: true, reviewed: false`.
- Validátor: `npx tsx scripts/validate-content.ts places src/content/places-facts/fold-afrika-amerika.json` → 0 hiba, 0 figyelmeztetés.
- A fokhálózati adatok a `public/data/places.json` anchor/bbox mezőiből, kerekítve. Ahol az anchor félrevezető volt (Amerika, USA, Chile, Ecuador: a szigetek/Alaszka miatt), ott a fő szárazföldi kiterjedés szerepel.

## Tanári ellenőrzést kérő állítások

**Szerkezet, lemeztektonika**
- Kaledóniai-hegységrendszer: folytatása az Appalache északi részén és Grönlandon; Appalache = kaledóniai + variszkuszi.
- Variszkuszi-hegységrendszer: az Ural és az Appalache déli része is ide sorolva.
- Pacifikus-hegységrendszer: „kialakulása a középidőben kezdődött”.
- Ősföldek ásványkincsei: Guyanai (bauxit, arany), Kanadai (vas, nikkel, urán), Angara (gyémánt), Dekkán (bazaltfennsík ÉNy-on).
- Hudson-öböl: „a Kanadai-ősföld süllyedékében”, izosztatikus emelkedés.
- Mount St. Helens: a Juan de Fuca-lemez alábukásához köti. Popocatépetl: a Cocos-lemezhez köti (ezek a lemezek nincsenek a tananyag lemezlistáján).
- Kaliforniai-öböl: lemezmozgás révén nyílt meg.
- Seychelle-szigetek: Gondwanából leszakadt kontinentális kéregdarab (gránit).
- Arab-ősföld határolása: a Vörös-tenger árkának megnyílásával vált el Afrikától.

**Áramlások, éghajlat**
- Nyugati-szél-áramlás: „a Föld legnagyobb vízszállítású áramlása”, ágai táplálják a Humboldt- és a Benguela-áramlást.
- Brazíliai-áramlás: „növeli Brazília keleti partvidékének csapadékát”.
- Atacama: a Humboldt-áramláson kívül az Andok szélárnyéka is szerepet játszik.
- Kaliforniai-félsziget: a hideg Kaliforniai-áramlás is szárítja.
- Namib: dűnéi „a Föld legmagasabb dűnéi közé tartoznak”.

**Számok, csúcsértékek**
- Mariana-árok kb. 11 km; Egyenlítő kb. 40 000 km.
- „Legek”: Nílus „a Föld egyik leghosszabb folyója” (szándékosan nem írja, hogy a leghosszabb); Amazonas a legbővizűbb; Grönland a legnagyobb sziget; Angel-vízesés a legmagasabb; Itaipu „az egyik legnagyobb” vízerőmű; Kráter-tó az USA legmélyebb tava; Chile a legnagyobb rézérc-kitermelő; Marokkó „az egyik legnagyobb” foszfát-kitermelő; Niger termékenysége „az egyik legmagasabb”.
- Évszámok: Yellowstone 1872, Mount St. Helens kitörése 1980, Brazíliaváros 1960, San Francisco-i földrengés 1906, Katrina hurrikán 2005.

**Társadalom, gazdaság**
- Pretoria = közigazgatási, Fokváros = törvényhozási főváros (a harmadik, Bloemfontein nincs megemlítve).
- Liberia: kaucsukültetvények, lobogó alatti hajólajstromozás. Panama: hajólajstromozás és pénzügyi szolgáltatások mellett az `adóparadicsom` címke került rá.
- Bahama-szigetek: az `adóparadicsom` és az `offshore cég` címke.
- Washington: a Világbank és az IMF székhelye. Houston: a NASA irányítóközpontja.
- Kuba: a `tervutasításos gazdaság` címke.
- Detroit: a `ellenvárosodás (dezurbanizáció)` címke (inkább városhanyatlás, a címke vitatható).
- Szudán (táj): az é. sz. 6–13° közötti szavannasáv. A Száhel határait (é. sz. 12–18°) a bbox alapján adtam meg.
