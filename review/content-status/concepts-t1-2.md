# Fogalomtár – 1–2. témakör (`src/content/concepts/t1-2.json`)

- Szócikkek: **180** (127 fő szócikk hivatalos címkével + 53 al-szócikk `parent`-tel)
- Hivatalos címkék: **134/134 lefedve** (concepts-1.json + concepts-2.json)
- Validátor: `npx tsx scripts/validate-content.ts concepts src/content/concepts/t1-2.json` → 0 hiba, 0 figyelmeztetés
- Összevont szétvágott címkék: „kis” + „közepes és nagy méretarányú térkép”; „szintvonalas” + „színfokozatos” + „árnyékolásos domborzatábrázolás”; „sík-” + „henger- és kúpvetület”; „északi” + „déli” + „keleti és nyugati félgömb”; „topográfiai” + „földrajzi és tematikus térkép”.
- Önellenőrzés megtörtént (követelmények + tankönyvi tények); javítva: meteoroid mérete, fotoszféra hőmérséklete, holdfázisok kelési/delelési idejei, Everest magassága.

## Ellenőrzésre javasolt
- Méretarány-határok (nagy: 1:200 000-nél nagyobb; közepes: 1:200 000–1:1 000 000; kis: 1:1 000 000-nál kisebb) – tankönyvenként eltérhet.
- `hold` (Hold, égitest) vs. `termeszetes-hold` (a „hold” fogalom) – az id-k szándékosan így vannak.
- Kapu Tibor (2025, ISS) említése a Farkas Bertalan példában – friss adat.
- Bay Zoltán holdradar: „az amerikai kísérlettel közel egy időben, attól függetlenül” megfogalmazás.
- Napkorona hőmérséklete csak nagyságrendként („millió °C nagyságrendű”).
