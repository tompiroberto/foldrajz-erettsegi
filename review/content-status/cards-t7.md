# Tanulókártyák – 7. témakör: Magyarország (t7.json)

- 98 kártya: az objectives-7.json mind a 98 követelménye (7.1–7.9, közép + emelt) le van fedve, mindegyikhez pontosan egy kártya tartozik.
- Validátor (`npx tsx scripts/validate-content.ts cards src/content/cards/t7.json`): 0 hiba, 0 figyelmeztetés. A magyarázatok 96–147 szavasak.
- A 7. témakörnek nincsenek saját hivatalos fogalomcímkéi a concepts.json-ban, ezért a `concepts` mezőben a 3–6. és a 10. témakör hivatalos címkéi szerepelnek (pl. „mezőségi talaj”, „régió”, „eurorégió”, „nemzeti park”, „világörökség”, „Natura 2000”). A szétvágott töredékcímkék közül csak az önmagukban is értelmes darabokat használtam (pl. „állami” + „szövetkezeti és magántulajdon”, „ős-” + „ó-” + „közép- és újidő”).
- Ábrák: climate-chart, soil, river, karst, rock-cycle, plate-boundaries, age-pyramid, demographic, urbanization, city-zones, economic-sectors, integration; a többi kártyánál null.
- Számadatok: csak a jól ismert, kerek értékek szerepelnek (kb. 93 000 km², 19 megye + Budapest, 10 nemzeti park, 13 nemzetiség, kb. 9,6 millió lakos, népességcsúcs 1980 körül kb. 10,7 millió, Paks kb. a hazai áramtermelés fele, 22 borvidék, 8 régió / 3 nagyrégió, 23 kerület, kb. 80 agglomerációs település). Friss statisztika (GDP-értékek, %-os arányok) nincs benne.
- Az önellenőrzés során javítottam: a vásárvonal-városok listáját (Győr helyett Hatvan), Dunaújvárost és Százhalombattát a Duna menti alföldi városok közé tettem, Dunaújvárosnál a kohászatot „válságba került” jelzővel írtam, a hungarikum-kategóriákat pontosítottam (a Hévízi-tó és a hortobágyi puszta a „természeti környezet” kategóriában van), és kivettem egy bizonytalan hungarikum-példát.
- Lektornak érdemes megnézni:
  - a lemeztektonikai magyarázatot (7.2 e1) – az ALCAPA/Tisza–Dácia mikrolemezek nevét szándékosan nem írtam le;
  - a korokhoz kötött hozzárendeléseket (7.2 e2, 7.5 e1): perm uránérc és vörös homokkő, jura mangánérc, eocén recski ércesedés;
  - az aktuálisan változó adatokat: autó- és akkumulátorgyári telephelyek (Debrecen), az energiaimport útvonalai, a külkereskedelmi partnerek sorrendje;
  - az idegenforgalmi körzetek listáját (7.4 k18) – igazítsuk a használt tankönyv felosztásához;
  - a világörökségi helyszíneknél csak a hivatalos lista elemei szerepelnek (a Dunai limes nincs benne).
