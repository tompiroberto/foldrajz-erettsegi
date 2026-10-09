# Tanulókártyák – t3-2 (3.2 A levegőburok földrajza)

- Fájl: `src/content/cards/t3-2.json` – 49 kártya, a 3.2.1–3.2.6 összes követelményére (k és e) egy-egy; mind `generated: true, reviewed: false`.
- Validátor: `npx tsx scripts/validate-content.ts cards src/content/cards/t3-2.json` → 0 hiba, 0 figyelmeztetés; minden magyarázat 80–200 szó.
- Számolós kártyák mintapéldával: középhőmérséklet és hőingások (3.2.2 k4), vízgőztartalom (3.2.4 e2), főn (3.2.3 e2, 0,5 / 1 °C/100 m).
- Ábrák: atmosphere-layers, solar-angle, greenhouse, climate-chart, cyclone, fronts, circulation, monsoon, foehn; nem vizuális követelménynél null.
- Önellenőrzés: tényellenőrzés után javítva a térképi betűjelölés (A / nemzetközileg L) és a balatoni viharjelzési tanács (óvatosabb megfogalmazás).

## Szakmai ellenőrzést kér
- Napi középhőmérséklet: a 4 mérés (1, 7, 13, 19 óra) átlaga – egyes források max+min/2-t tanítanak.
- Telítési értékek a példában (25 °C: 23 g/m³; 10 °C: 9,4 g/m³; harmatpont kb. 13 °C) – „a táblázat szerint” megfogalmazással.
- Ózonréteg magassága kb. 20–30 km; trópusi ciklon 26 °C feletti víz; CO2 kb. 280 → 400+ ppm; Katrina 2005; London 1952.
- HungaroMet név (korábban OMSZ); balatoni viharjelzési fokozatok tanácsa.
- Tenyészidőszak küszöbe 10 °C (egyezik a fogalomtárral).
