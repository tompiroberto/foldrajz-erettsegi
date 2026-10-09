# Földrajz emelt érettségi – gyakorló webapp

Topográfia (802 hivatalos név vaktérképen) és elmélet (10 témakör, 1025 fogalom, folyamatok, számolás) az emelt szintű földrajz érettségire, a korábbi érettségi feladatsorokkal együtt. Telefonra telepíthető, első megnyitás után offline is működik.

## Mit tud?

- **Topográfia:** böngészhető atlasz régiónként, kártyák, felfedező séta, 5-féle kvíz (Hol van?, beírós, választós, feladatlap, fekvés), minden helyhez fekvésleírás és kulcstények.
- **Elmélet:** tananyag (647 követelmény, mindegyikhez tanulókártya), fogalomtár (1261 szócikk), 41 animált folyamat esszégyakorlóval, 20 számolós feladattípus, vegyes kvíz (9 kérdéstípus).
- **Vizsga:** 44 korábbi érettségi feladatsor (2005–2026) feladatonként, kattintásra látható megoldással; próbavizsga 240 perces időzítővel.
- **Mai ismétlés:** az esedékes elemek (SM-2 ütemezés) és új elemek a napi célig; **Haladás:** körök régiónként/témakörönként, aktivitási naptár, gyenge pontok, heti terv a vizsga dátumáig.

> Az AI-generált tartalom (magyarázatok, fogalmak, tények) jelölve van („AI-generált – ellenőrizd a tankönyvvel”). Az ellenőrzendő tételek összesítője: `review/content-status.md`.

## Futtatás

```bash
npm install
npm run dev        # http://localhost:5173
```

| Parancs | Mit csinál |
|---|---|
| `npm run dev` | fejlesztői szerver (localhost:5173) |
| `npm run build` | típusellenőrzés + éles build a `dist/` mappába |
| `npm run preview` | a kész build kipróbálása |
| `npm test` | egységtesztek (válaszellenőrzés, ismétlésütemező, számolások) |
| `npm run test:e2e` | Playwright: füstteszt minden fő oldalra, kvíz-végigjátszás, akadálymentesség (axe) |
| `npx tsx scripts/validate-content.ts` | a `src/content` tartalmak ellenőrzése (címkék, azonosítók, lefedettség) |
| `node scripts/content-status.mjs` | a `review/content-status.md` összesítő frissítése |

## Adatok

- `starter-data/` – a hivatalos listák (`topography.json`, `concepts.json`, `requirements.json`, `exam-format.txt`). Forrásuk a `starter-data/source/ADATOK_minden_megtanulando_elem.md`; újragenerálás: `npm run data:starter`.
- `docs/erettsegi-feladatsorok/` – az oktatas.hu-ról letöltött emelt szintű földrajz írásbelik és javítási-értékelési útmutatók (2005–2026), lista: `INDEX.md`. Újratöltés: `node scripts/fetch-exams.mjs`.
- `src/content/exams/*.json` – a feladatsorok feladatokra bontva, megoldásokkal, témakör- és fogalom-hozzárendeléssel (formátum: `docs/erettsegi-feladatsorok/_schema.md`). Ellenőrzés: `node scripts/validate-exams.mjs`; állapotjelentés: `node scripts/exam-report.mjs` → `review/exam-status.md`.

### Ha hibát találsz egy érettségi feladatnál

A strukturálás gépi, ezért néhány megoldás (aláhúzással, X-szel vagy ábrán jelölt válaszok) ellenőrzésre szorul – ezek listája a `review/exam-status.md`-ben van. Javításhoz nyisd meg a feladatsor JSON-fájlját, írd át a `solution` / `items[].answer` mezőt az eredeti útmutató alapján, majd futtasd a validátort. Egy PDF-oldal képként: `node scripts/render-pdf-page.mjs <fájl.pdf> <oldal>` (futó dev szerver kell hozzá).

## Tartalom szerkesztése

Minden szöveges tartalom JSON-fájlban van, a komponensekbe semmi sincs beégetve (formátum: `src/content/README.md`):

- `src/content/concepts/*.json` – fogalomtár; `src/content/cards/*.json` – tanulókártyák követelményenként;
- `src/content/processes/*.json` – folyamatok lépései és esszéi; `src/content/places-facts/*.json` – a helyek fekvése és tényei.

Javítás után futtasd a `npx tsx scripts/validate-content.ts` parancsot. Ha egy tételt tankönyvvel ellenőriztél, a `reviewed` mezőt `true`-ra állíthatod.

## Térképszerkesztő (térképi adatok javítása)

1. Nyisd meg a térképet a `?edit=1` paraméterrel, pl. `http://localhost:5173/topografia/terkep?edit=1`.
2. Válassz ki egy helyet; az oldalsávban megjelenik a **Térképszerkesztő**.
   - *Pont / jelölő áthelyezése:* kattints az új helyre (területnél és vonalnál csak a jelölőt mozgatja).
   - *Vonal / terület rajzolása:* kattints sorban a töréspontokra, a térkép fölötti sávban menthetsz vagy visszavonhatsz.
3. **Exportálás (.geojson)** – a letöltött `szerkeszto-javitasok-….geojson` fájlt tedd a `scripts/manual-geo/` mappába, majd futtasd: `npx tsx scripts/build-geo.ts`. A szerkesztő fájljai minden más forrást felülírnak; az eredményt a `review/geo-report.md` mutatja.

A javítások exportálásig a böngészőben maradnak, és csak `?edit=1` módban látszanak a térképen.

## Haladás mentése

Beállítások → *Haladás mentése*: az Exportálás egy `.json` fájlt ment, amit egy másik eszközön (pl. telefonon) az Importálással töltesz be. A haladás egyébként csak az adott böngészőben tárolódik.

## Közzététel

- **Netlify:** build parancs `npm run build`, publish könyvtár `dist`. SPA-átirányítás: `public/_redirects` (`/* /index.html 200`).
- **GitHub Pages:** a `.github/workflows/pages.yml` minden `main`-re küldött push után magától buildel és közzétesz. Egyszeri beállítás: a tároló *Settings → Pages → Source* értéke legyen **GitHub Actions**. A cím: `https://<felhasználónév>.github.io/<tároló neve>/`.

## Források és licencek

- Oktatási Hivatal: Földrajz részletes érettségi vizsgakövetelmény (2024) és a korábbi érettségi feladatsorok, javítási-értékelési útmutatók (oktatas.hu) – tanulási célra, a forrás megjelölésével.
- Térképadatok (3. fázistól): Natural Earth (közkincs), PB2002 – Peter Bird (2003), geoBoundaries (CC BY 4.0). Részletek: `ATTRIBUTION.md`.
- Betűtípusok: Fraunces, IBM Plex Sans (SIL Open Font License).
