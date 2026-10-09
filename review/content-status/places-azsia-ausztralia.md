# Helyek – Ázsia, Ausztrália és Óceánia (`src/content/places-facts/azsia-ausztralia.json`)

- **134/134** topográfiai elem kitöltve (Ázsia + Ausztrália és Óceánia), mind `generated: true, reviewed: false`.
- Validátor: `npx tsx scripts/validate-content.ts places src/content/places-facts/azsia-ausztralia.json` → **0 hiba, 0 figyelmeztetés**.
- A fogalomcímkék a `starter-data/concepts.json`-ből, a folyamat-id-k a `catalog.ts`-ből valók.

## Koordináta-eltérések a `public/data/places.json`-ben
Ezeknél nem az anchor/bbox, hanem a tényleges kiterjedés alapján írtam a fekvést; érdemes a geo adatot is javítani:
- **Új-Zéland**: anchor [169.2, -52.6] (a szubantarktikus szigetekre esik), a bbox a Kermadec-szigetekig ér → a szövegben 34–47° d. sz., 166–179° k. h.
- **Ausztrália**: a bbox [73, -55, 168, -9] tengerentúli területeket is tartalmaz → a szöveg a szárazföldre vonatkozik (10–39° d. sz., 113–154° k. h.).
- **Melanézia**: anchor [125.2, -4.1] (Indonéziába esik), a bbox az egész földet átéri → kézzel: 0–23° d. sz., kb. 130–180° k. h.
- **Polinézia**: a bbox a 180°-os délkört átlépve az egész földet lefedi → a Hawaii–Új-Zéland–Húsvét-sziget háromszöggel írtam le.

## Tanári ellenőrzésre javasolt állítások
- **Csomolungma** 8848 m (az újabb mérés 8848,86 m) – a tankönyvi kerekítés maradjon?
- **India** „a Föld legnépesebb országa (Kínát is megelőzve)” – friss (2023-as) változás, a régebbi tankönyvek még Kínát írják.
- **Kaukázus**: Elbrusz 5642 m; „gerincét gyakran Európa és Ázsia határának tekintik” – a határ meghúzása tankönyvenként eltér.
- **Bajkál-tó**: „mélysége meghaladja az 1600 m-t”, „a Föld legnagyobb édesvízkészletű tava”.
- **Holt-tenger**: „több mint 400 m-rel a tengerszint alatt” (a szint folyamatosan csökken).
- **Nagy-korallzátony**: „hossza meghaladja a 2000 km-t”, a korallok 20 °C feletti vízigénye.
- **Fuji**: 3776 m, utolsó kitörés 1707; „az óceáni lemezek alábukásához kapcsolódó” – egyszerűsítés (hármas lemezcsomópont).
- **Japán-szigetek**: „több kőzetlemez találkozásánál” – szándékosan nincs szám (a tankönyvek 3-at vagy 4-et írnak).
- **Pamír, Tien-san**: „csúcsai 7000 m fölé emelkednek”; **Új-Guinea**: „4000 m fölé”; **Tibet**: „átlagosan 4000 m feletti”.
- **Nagy-Vízválasztó-hegység**: „óidei gyűrthegység, amelyet később újra kiemeltek” – a tankönyvi besorolás (gyűrt vs. röghegység) eltérhet.
- **Dekkán-fennsík**: bazalttakaró és fekete (gyapot-)talaj – emelt szintű részlet.
- **Dél-kínai-hegyvidék**: toronykarszt (Kuanghszi) – a bbox csak részben fedi a karsztvidéket.
- **Közép-szibériai-fennsík**: gyémántlelőhelyek (Jakutföld) – a fennsík keleti peremére esnek.
- **Szibéria**: hidegpólus Ojmjakon / Verhojanszk.
- **Kaszpi-mélyföld**: „részben tengerszint alatti”.
- **Kiotó**: „közel ezer évig” császári főváros (794–1868).
- **Cseljabinszk**: a 2013-as meteor esemény – kérdés, hogy bent maradjon-e (eseményhez kötött állítás).
- **Csennai**: fő esős évszaka az északkeleti (téli) monszun idején, ősszel – emelt szintű, eltér az általános monszunsémától.
- **Jeruzsálem**: a fekvésben „Izrael fővárosának tekinti, státusza nemzetközileg vitatott” – a megfogalmazás érzékeny, érdemes tanárral egyeztetni.
- **Szöul**: „agglomerációjában él az ország népességének közel fele”.
- **Sencsen**: első különleges gazdasági övezet, 1980.
- **Tokió**: „a Föld legnépesebb városi agglomerációja” (forrásonként eltérhet: Tokió vagy Jakarta / Delhi).
- **Hongkong** „kistigris”, ill. **Tajvan** „újonnan iparosodott ország” – a tankönyvi besorolás megfelelő, csak a megfogalmazást kell ellenőrizni.
