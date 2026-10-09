# Kézzel rajzolt geometriák

Minden fájl egy GeoJSON `FeatureCollection` (WGS84, [hosszúság, szélesség] sorrendben!).
Minden feature `properties`:

```json
{ "id": "<topography.json id>", "name": "<hivatalos név>", "confidence": "high|medium|low", "note": "rövid forrás/megjegyzés" }
```

Szabályok:
- Geometriatípus a kategória szerint: pont (település, csúcs, vulkán, gát, barlang, hágó, kis tó, világörökségi helyszín), vonal (folyó, csatorna, tengeráramlás, mélytengeri árok, árokrendszer), poligon (táj, medence, hegység, ősföld, hegységrendszer, régió, nemzeti park, nagyobb tó).
- Pontosság: a poligon a valós terület nagyjából fedje le, 8–30 csúcsponttal; ne lógjon át rossz országba, rossz folyópartra vagy gerincre. Folyók forrástól torkolatig, 8–25 pont. Tengeráramlás a valós útvonalán, **a folyás irányában** (az első pont a kezdet).
- Település-pont: a városközpont ±0,02°-on belül → `high`. Táj-poligon → `medium`, ha a határ bizonytalan → `low`.
- Gyűrű zárt legyen (első pont = utolsó), az óramutatóval ellentétes irányban.
- Ellenőrzés: `npx tsx scripts/build-geo.ts --allow-missing` (a `review/geo-report.md` mutatja az eredményt).
