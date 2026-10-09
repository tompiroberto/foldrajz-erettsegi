# Generált tartalom – formátumok

Minden generált elem `"generated": true, "reviewed": false` jelölést kap. Ellenőrzés: `npx tsx scripts/validate-content.ts`.
Azonosítók: a hivatalos listák (`starter-data/`), a folyamat- és ábrakatalógus (`src/content/catalog.ts`), a hashtagek (`src/content/tags.ts`).

## Pontossági szabályok (minden fájlra)
- Magyar tankönyvi szakszókincs, a hivatalos fogalomnevek betűre pontosan; helyesírás és földrajzi nevek a hivatalos lista szerint, soha nem angolosítva.
- Bizonytalan számadatot NE írj. Inkább minőségi állítás vagy jól ismert, kerek érték (pl. „kb. 23,5°”, „kb. 150 millió km”).
- Diáknak szól, tegeződve („Figyelj arra, hogy…”), tömören, vizsgaszinten.

## 1. Fogalomtár – `concepts/<témakör>.json`
```jsonc
{ "entries": [ {
  "id": "holdfazisok",                 // egyedi, ékezet nélküli slug
  "term": "holdfázisok",               // a fogalom neve (a hivatalos alakban)
  "aliases": ["holdfázis"],            // zárójeles és más elfogadott alakok
  "sourceLabels": ["holdfázisok (újhold, első negyed, holdtölte/telihold, utolsó negyed)"], // a lefedett HIVATALOS címke/címkék betűre pontosan
  "parent": null,                       // al-szócikknél a fő szócikk id-je
  "topicNo": 2, "subtopic": "2.2 A Nap és kísérői", "level": "kozep",
  "definition": "1–3 pontos mondat.",
  "example": "Rövid példa, lehetőleg valós helyszínnel.",
  "examplePlaces": ["topography id"],   // opcionális
  "related": ["ujhold", "holdtolte"],  // más szócikkek id-jei
  "tags": ["csillagászat", "2-témakör"],
  "generated": true, "reviewed": false
} ] }
```
- Minden hivatalos címkét le kell fedni legalább egy szócikk `sourceLabels`-ében.
- Ha a PDF-kivonat szétvágott egy felsorolást („kis” + „közepes és nagy méretarányú térkép”), egy szócikk legyen a teljes fogalomra („kis, közepes és nagy méretarányú térkép”) mindkét címkével.
- Zárójeles felsorolás („holdfázisok (újhold, …)”): fő szócikk + al-szócikkek (`parent`).
- „X és Y” páros fogalom (pl. „hideg- és melegfront”): fő szócikk + két al-szócikk.
- 2–5 hashtag, köztük kötelezően a `<n>-témakör`.

## 2. Tanulókártyák – `cards/<témakör>.json`
```jsonc
{ "cards": [ {
  "objectiveId": "2-3-a-fold-es-mozgasai--k6",   // review/content-lists/objectives-<n>.json
  "explanation": "80–200 szavas magyarázat. Bekezdések üres sorral, felsorolás '- ' sorkezdettel.",
  "diagram": "seasons",                           // catalog DIAGRAMS kulcs vagy null
  "concepts": ["helyi idő", "zónaidő"],           // HIVATALOS címkék (concepts.json) betűre pontosan
  "processes": ["helyi-ido-zonaido"],             // catalog PROCESSES id-k
  "examTip": "Tipikus vizsgakérdés vagy gyakori hiba.",
  "selfCheck": [{ "q": "Kérdés?", "a": "Rövid válasz." }],                  // 2–3 db
  "trueFalse": [{ "statement": "Állítás.", "true": true }, { "statement": "Hamis állítás.", "true": false, "correction": "Mi a hiba és mi a helyes." }], // 2 db: egy igaz, egy hamis
  "generated": true, "reviewed": false
} ] }
```

## 3. Folyamatok – `processes/<id>.json`
```jsonc
{
  "id": "evszakok", "title": "…",             // catalog szerint
  "summary": "1–2 mondat.",
  "causes": ["…"], "course": ["…"], "consequences": ["…"],   // Okok → Lefolyás → Következmények
  "steps": [{ "title": "…", "caption": "1–2 mondat.", "icon": "sun" }], // egyedi ábránál a catalog outline lépései pontosan ebben a sorrendben; 'flow' ábránál 4–8 lépés, icon a FLOW_ICONS-ból
  "examples": [{ "text": "…", "places": ["topography id"] }],
  "concepts": ["hivatalos címke"],
  "essay": { "prompt": "Magyarázd el! …", "elements": [{ "text": "tartalmi elem", "points": 2 }], "modelAnswer": "3–6 mondatos mintaválasz." },
  "generated": true, "reviewed": false
}
```

## 4. Helyek – `places-facts/<régió>.json`
```jsonc
{ "facts": { "<topography id>": {
  "fekves": "1–2 mondat: tényleges (fokhálózat, földrész/ország) és viszonylagos fekvés (szomszédok, folyók, hegyek).",
  "facts": ["2–4 rövid, ellenőrizhető tény, ami az elmélethez köt"],
  "concepts": ["hivatalos címke"], "processes": ["catalog id"],
  "generated": true, "reviewed": false
} } }
```
