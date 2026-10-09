# Feladatsor-JSON formátum (src/content/exams/<év>_<időszak>.json)

Egy fájl = egy vizsgaidőszak emelt szintű magyar nyelvű földrajz írásbelije.

```jsonc
{
  "id": "2024-tavasz",                 // <év>-<tavasz|osz|februar>
  "year": 2024,
  "season": "tavasz",                  // tavasz | osz | februar
  "date": "2024. május 16.",            // a feladatlap borítójáról
  "label": "Érettségi 2024. május",      // forrásmegjelöléshez; ősszel "október", 2006 februárban "február"
  "files": {
    "feladatlap": "foldrajz_emelt_2024_tavasz_feladatlap.pdf",
    "utmutato": "foldrajz_emelt_2024_tavasz_utmutato.pdf"
  },
  "sourceUrl": "https://www.oktatas.hu/...",   // az INDEX.md "Eredeti oldal" linkje
  "totalPoints": 200,                  // a feladatlap szerinti összpontszám
  "generated": true,                    // a strukturálás gépi, a szöveg az eredetiből van
  "reviewed": false,
  "tasks": [
    {
      "no": 1,
      "title": "Kutatóhajók a fokhálózaton",     // RÖVID magyar összefoglaló cím (ezt mi írjuk)
      "instruction": "Tanulmányozza az ábrát, majd oldja meg a hozzá kapcsolódó feladatokat!", // szó szerint
      "context": "Három kutatóhajó a világtenger …", // a feladat bevezető szövege szó szerint ("" ha nincs)
      "pages": [2, 3],                  // a FELADATLAP PDF oldalszámai (=== OLDAL n === jelölők)
      "guidePages": [2],                // az ÚTMUTATÓ PDF oldalszámai
      "points": 13,
      "needsFigure": true,              // true, ha ábra/térkép/táblázat/kiemelés nélkül nem oldható meg
      "figureNote": "Fokhálózati vázlat három hajóval (A, B, C).", // mit mutat az ábra, ha needsFigure
      "subtopics": ["2-3-a-fold-es-mozgasai"],   // CSAK a _hivatkozasok.md alcím-azonosítói
      "concepts": ["helyi idő", "delelési magasság", "dátumválasztó vonal"], // CSAK hivatalos címkék, betűre pontosan
      "places": ["fold--oceanok--csendes-ocean"],  // CSAK topography.json id-k, ha a feladat konkrét helynévre épül
      "parts": [
        {
          "label": "a",                 // "a", "b", … vagy "" ha a feladatnak nincsenek részei
          "type": "short-answer",       // lásd lent
          "prompt": "Adja meg az A és a C kutatóhajó tartózkodási helyének földrajzi koordinátáit! …",
          "points": 2,
          "items": [                    // opcionális: számozott állítások / kérdések, ha egyenként ellenőrizhetők
            { "n": "1", "text": "Az A és a B betűvel jelölt helyek helyi ideje megegyezik.", "answer": "H" }
          ],
          "options": ["A) …", "B) …"],  // opcionális: a választható lehetőségek szó szerint
          "solution": "A: déli szélesség 40 fok, keleti hosszúság 134 fok; C: …", // az útmutatóból, elfogadott változatokkal és megjegyzésekkel
          "autoCheck": false            // true, ha az items[].answer alapján gépileg pontozható
        }
      ]
    }
  ]
}
```

## `type` értékei
`true-false` (I/H) · `multiple-choice` (egy helyes) · `select-many` (több helyes, bekarikázás) · `matching` (párosítás, betűjel/sorszám a fogalomhoz) · `ordering` (sorrend) · `short-answer` (egy-két szó / szám) · `calculation` (számolás menettel) · `essay` (kifejtős / esszé, az útmutató tartalmi elemeivel) · `map` (térképen jelölt hely megnevezése / bejelölése) · `table` (táblázat kitöltése) · `diagram` (ábra elemzése / rajz készítése)

## Szabályok
- A `prompt`, `items[].text`, `options`, `context`, `solution` **az eredeti szöveg** (csak a tördelési szóközöket, sortöréseket, a pontozott vonalakat és az oldalfejléceket tisztítjuk). Ne fogalmazd át, ne egészítsd ki.
- `items[].answer`: I/H feladatnál "I" vagy "H"; betűjeles párosításnál a betű ("B"); több helyesnél a sorszámok ("2, 4, 5"); rövid válasznál az útmutató válasza, a "/" utáni elfogadott változatokkal együtt.
- Ha az útmutató és a feladatlap részei nem párosíthatók egyértelműen, a `solution` mezőbe kerüljön a teljes útmutató-részlet, `autoCheck: false`.
- Az összes `parts[].points` összege legyen egyenlő a `points`-tal, és a feladatok pontszámainak összege a `totalPoints`-tal (ha az eredetiben eltér, írd a `"note"` mezőbe a feladatnál).
- `subtopics`: 1–3 legjellemzőbb alcím; `concepts`: 0–8 olyan hivatalos fogalom, amely a feladat megoldásához ténylegesen kell.
