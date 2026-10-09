# Build prompt: "Földrajz emelt érettségi" study website (topography + theory)

You are a senior front-end engineer, a cartographic/data-visualisation specialist and a geography teacher preparing Hungarian students for the **advanced-level (emelt szintű) geography matura**. Build a complete, polished study web app from this brief inside this VS Code workspace.

- The whole **user interface is in Hungarian**. This prompt is in English only so it stays precise.
- Work in the phases listed in §12. After each phase, run the app and the build, and fix every error before you continue.
- Never invent requirement items. The official lists are already extracted for you in `starter-data/`.
- Where you have to *generate* content (definitions, explanations, quiz distractors, coordinates), follow the quality and verification rules in §8 and mark it as generated.

---

## 0. What is in this folder

```
PROMPT.md                         ← this brief
docs/foldrajz_reszletes_vizsgakovetelmeny_2024.pdf   ← official detailed exam requirements (64 p.)
docs/topografia_gyakorlo_terkepek_NAT2020.pdf        ← practice workbook: numbered blank maps per topic
starter-data/
  topography.json   ← 802 official topographic names: {id, name, region, regionNo, category, level}
  requirements.json ← 10 main topics → subtopics → "kozep" and "emelt" learning objectives (sentences)
  concepts.json     ← 1,025 official concepts (általános és egyedi fogalmak) per topic/subtopic and level
  exam-format.txt   ← exam structure and scoring (pages 50–64 of the requirements PDF)
```

- `level: "kozep"` means the item is required at both levels. `level: "emelt"` means it is required **only** at advanced level.
- **The student takes the advanced exam, so everything (kozep + emelt) is in scope by default.** Show a small "EMELT" badge on emelt-only items and offer a filter, but do not hide anything by default.
- Topography regions: Föld, Afrika, Amerika, Ausztrália és Óceánia, Ázsia, Európa, Magyarország. Each has categories such as Tájak, Vízrajz, Országok, Városok, Megyék, Nemzeti parkok, …
- Open both PDFs and study them. The workbook shows the exam-style **blank contour maps (kontúrtérkép) with numbered markers**, and the app's map quiz must imitate that style.

## 1. Tech stack

- **Vite + React 18 + TypeScript (strict)** as a client-side SPA, built static. Use React Router with real URLs (`/topografia/...`, `/elmelet/...`) so every view can be linked and bookmarked.
- State: **Zustand** with `persist` (localStorage) for progress, settings and spaced-repetition data. Add export/import of progress as a JSON file in the settings, so the student can move it to a phone.
- Maps: **d3-geo, d3-zoom, d3-selection, topojson-client** rendering SVG (canvas for dense layers if needed). Do not use a tile/basemap service: exam maps are blank contour maps.
- Search and answer checking: **Fuse.js** plus a Hungarian-aware normaliser (case-, accent- and hyphen-insensitive, alias-aware), see §6.4.
- Diagrams and animations: SVG + **Framer Motion**.
- **PWA** (`vite-plugin-pwa`): installable on a phone and fully usable offline after the first load, which is good for studying on the bus.
- Testing: **Vitest** for the answer normaliser, the spaced-repetition scheduler and the calculation generators. A **Playwright** smoke test opens each main route.
- Deploy: static hosting (Netlify or GitHub Pages). Document both in the README.

## 2. Information architecture

Two **modes**, chosen in the header (see §3.2). Everything else lives inside a mode.

```
/                         Kezdőlap: choose a mode, today's review queue, overall progress, exam countdown
/topografia               Topography mode home: region cards with progress rings
  /topografia/terkep      TÉRKÉP (learn): interactive atlas with filters
  /topografia/kviz        KVÍZ: quiz setup → quiz session → results
/elmelet                  Theory mode home: 10 topic cards with progress
  /elmelet/tananyag       TANANYAG (learn): topics → subtopics → learning cards (requirements explained)
  /elmelet/fogalomtar     FOGALOMTÁR: dictionary of all 1,025 concepts, search + hashtag filters
  /elmelet/folyamatok     FOLYAMATOK: animated step-by-step processes
  /elmelet/szamolas       SZÁMOLÁS: calculation practice (generated tasks with worked solutions)
  /elmelet/kviz           KVÍZ: quiz setup → session → results
/haladas                  Progress dashboard (both modes), weak spots, streak
/vizsga                   Exam info (from exam-format.txt) + "próbavizsga" mixed timed test
/beallitasok              Settings: level filter, quiz defaults, sound, animations, export/import, reset
```

Global features: a search bar in the header with the `/` shortcut, which searches places, concepts, processes and requirement cards across both modes and shows the mode as a coloured chip. There is also a "Mai ismétlés" (today's review) button with a badge count.

## 3. Visual design (design it with care; this is what makes the student want to open it)

### 3.1 Concept: "Atlas & Strata"
- **Topography mode = the atlas.** It is cool, sea-and-paper coloured, with contour lines, a graticule and numbered markers. It should feel like a modern, living version of a school atlas.
- **Theory mode = the strata.** It is warm and earthy (magma, sediment, sky) and built from layered cross-sections of the geospheres. It feels like flipping through a beautiful textbook diagram.
- Both modes share the same layout, typography and components, so switching only changes the colour world and the background animation.

### 3.2 Header (split by mode)
- A full-width header split into **two halves**, with a **diagonal seam** like a map fold. The left half is **TOPOGRÁFIA**, with a small compass-rose icon and a teal tint. The right half is **ELMÉLET**, with a small layered-strata icon and a terracotta tint.
- The **active** half expands to ~70% of the width with a smooth spring animation (Framer Motion `layout`). Its sub-navigation then appears inside it as pill tabs:
  - Topography: Térkép · Kvíz
  - Theory: Tananyag · Fogalomtár · Folyamatok · Számolás · Kvíz
- The inactive half shrinks to a slim clickable label. Clicking it swaps modes and the seam animates across.
- On the right edge: global search, the "Mai ismétlés" badge, the progress ring and settings.
- Mobile: the header becomes a two-segment toggle at the top, and the sub-navigation becomes a bottom tab bar.
- The current mode is also reflected in the browser theme colour (`<meta name="theme-color">`) and the favicon tint.

### 3.3 Colour tokens (CSS variables, swapped per mode via `data-mode` on `<html>`)
```css
:root {
  --paper: #F7F4EC;  --ink: #1B2430;  --muted: #5B6573;  --line: #D9D3C3;
  --ok: #2E9E5B;  --bad: #D64545;  --warn: #E0A100;
}
[data-mode="topo"]   { --accent: #0E7C86; --accent-2: #F2C14E; --tint: #E3F1F1; --sea: #CFE6EA; --land: #F7F4EC; --contour: #9CC9C9; }
[data-mode="theory"] { --accent: #D9572B; --accent-2: #3D5A80; --tint: #FBEAE2; --sky: #DCE9F5; --rock: #C9B79C; --magma: #E4572E; }
```
- All text must have ≥ 4.5:1 contrast.
- The "correct" and "wrong" colours always come with an icon (✓ / ✕) and never rely on colour alone.
- Provide a dark theme too (deep navy paper `#0F1620`, same accents slightly lighter), following `prefers-color-scheme` with a manual toggle.

### 3.4 Typography
- Headings: **Fraunces** (variable; optical size; 600–800). It has an elegant atlas/serif feel.
- UI and body: **IBM Plex Sans** (400/500/600). It has full Hungarian `ő ű` support. Numbers use `font-variant-numeric: tabular-nums`.
- Map labels: **IBM Plex Sans Condensed**, with the classic atlas convention of italic for water names and letter-spaced caps for regions.

### 3.5 Dynamic backgrounds (these must be visible but calm, and must never hurt readability)
- **Topography mode:** an animated **contour-line field (szintvonalak)** generated with `d3-contour` from slowly evolving 2D simplex noise. Thin `--contour` lines drift and morph very slowly, as if the terrain breathes. A faint graticule sits on top, rotating slowly in an orthographic projection behind the hero areas. On the map pages the background calms down to static contours.
- **Theory mode:** a slow **parallax cross-section of the geospheres**. At the bottom are mantle and magma with a gentle glowing convection flow, above that rock strata, soil, the sea surface with a slight wave, then the troposphere with drifting clouds. As the user scrolls, the view moves *upwards* through the layers (from the lithosphere to the atmosphere). The theory home hero has a small **real-time day–night globe**: an orthographic Earth with the current **terminator** and **subsolar point** computed from the actual date and time (`solar declination` + `equation of time`). It ties directly to topic 2 (Föld mozgásai). The globe has a tooltip: "Most itt delel a Nap".
- Use `canvas` for the noise and contour background (requestAnimationFrame, paused when the tab is hidden, max ~30 fps). Respect `prefers-reduced-motion` with static versions.
- Cards sit on frosted `--paper` panels (backdrop blur) above the backgrounds.

### 3.6 Components
Cards with 16px radius and a 1px `--line` border, with a soft lift on hover. Pill tabs. Chips for hashtags. A progress ring (SVG). A big quiz answer button with keyboard shortcuts 1–4. Toasts. Skeleton loaders. Every icon comes from **Lucide**.

## 4. Topography mode – TÉRKÉP (learning atlas)

### 4.1 Layout
- On the left (or as a bottom sheet on mobile) is the **filter panel**:
  - **Region:** Föld, Afrika, Amerika, Ausztrália és Óceánia, Ázsia, Európa, Magyarország. Selecting one zooms the map to it.
  - **Drill-down:** for Európa, Ázsia, Afrika and Amerika also allow **"Ország szerint"**, which shows only the items located in or along a chosen country (spatial filter using the country polygon with a small buffer).
  - **Category** multi-select, based on the categories present in the data: Tájak, Vízrajz, Országok, Városok/Települések, A földrész részei, Kőzetlemezek, Nagyszerkezeti egységek, Tengeráramlások, Megyék, Nemzeti parkok & világörökségek, Történelmi tájnevek, Iparvidékek, Nagyrégiók…
  - **Level:** all · only emelt.
  - **Learning state:** all · new · learning · mastered.
- In the centre is the **map**, filling the screen.
- On the right is a **detail drawer** that opens when a feature is clicked. It shows:
  - the name, with aliases in parentheses as in the data;
  - region, category and level badge;
  - a short **"fekvés"** text: actual and relative location, as the exam requires;
  - 2–4 **key facts** linking it to theory (e.g. Kilimandzsáró → rétegvulkán, Kelet-afrikai-árok, éghajlati övezetesség a hegyen), with links to concepts and processes;
  - a "Gyakorold" button that starts a quiz with this item and its neighbours.

### 4.2 Map rendering
- Exam-like blank map: sea `--sea`, land `--land`, thin coastlines, optional country borders. No name labels by default. A toggle switches between **"Feliratok: be / ki / csak a kiválasztott"**.
- Each item is drawn as its correct geometry type with **numbered markers**, imitating the workbook. A side list maps numbers to names. Clicking a number or a name highlights the other.
  - **Point:** cities and towns, peaks and volcanoes, dams, caves, small islands, straits. Draw a circle; capitals get a square-in-circle.
  - **Line:** rivers, canals, ocean currents (an animated arrow flow along the path, warm currents red and cold currents blue), the graticule lines (Egyenlítő, térítők, sarkkörök, kezdő hosszúsági kör), plate boundaries, trenches. Draw a stroked path, with a wider invisible hit area.
  - **Polygon:** countries, counties, lakes, seas and gulfs, deserts, basins, plains, mountain ranges, plates, shields and mountain systems, regions, national parks. Use a fill with a hatch pattern; for large landforms use a soft-edged area.
- The map has zoom and pan, a "fit to selection" button, and a mini-map inset for Magyarország showing where you are.
- Use projections that suit each view: Equal Earth for the world, Lambert azimuthal equal-area for Europe, and a Mercator-like conformal projection for Magyarország. Each region view has a sensible default extent.

### 4.3 Learn modes inside TÉRKÉP
- **Böngészés:** free exploring as described above.
- **Kártyák:** a flashcard flow over the filtered set. The card shows the map zoomed to the item, highlighted and unnamed. The student tries to recall the name, then flips the card and rates it Nem tudtam / Nehéz / Jó / Könnyű, which feeds the spaced repetition (§7).
- **Felfedező séta:** a guided tour of a region. Items appear one by one in a sensible geographic order (e.g. rivers from source to mouth, cities along them), each with its one-line "fekvés" text.

## 5. Topography mode – KVÍZ

### 5.1 Setup screen
Choose the region, the country drill-down, the categories and the level (same filters as TÉRKÉP), the number of questions (10 / 20 / 40 / all), the timer (off / 10 s per question / exam-like), and a **question type** (several can be selected):
1. **"Hol van?" (kattintós):** the name is shown and the student clicks on the blank map. Points and lines are correct within a tolerance radius in screen pixels that scales with zoom. Polygons are correct if the click is inside, or within a tolerance of small features. After answering, the correct feature is shown with the distance error.
2. **"Mi ez?" (beírós):** a feature is highlighted on the blank map and the student types the name. Answer checking follows §6.4. Show the correct spelling afterwards.
3. **"Mi ez?" (feleletválasztós):** the same, with 4 options. The distractors are the *same category* and *nearby*, so they are genuinely confusable.
4. **Kontúrtérképes feladatlap (exam style):** a blank map region with 8–15 numbered markers, exactly like the workbook pages, and an answer table next to it. The student fills in the whole table and submits it at once. Scoring is per row, like the written exam.
5. **Fekvés-kérdés:** "Melyik ország fővárosa / melyik folyó partján / melyik hegységben…" questions generated from spatial relations (point in polygon, nearest river or coast).

### 5.2 Session and results
- One question per screen with a progress bar and a streak flame. Keyboard: Enter submits, 1–4 choose an option, Space flips.
- Immediate feedback with the correct answer, a one-line "fekvés" and a link to open the item in TÉRKÉP.
- The results page shows the score, the accuracy per category, a map of the mistakes (all missed items numbered on one map), "Csak a hibásakat újra", and the time taken.

## 6. Theory mode

### 6.1 TANANYAG (learning)
- 10 topic cards come from `requirements.json`; the topic titles are in `topics`. Inside each topic, the subtopics are listed with their objectives, split into **Középszint** and **Emelt szint (csak emelten)**.
- For **every objective sentence**, create a **learning card** containing:
  - the objective as the heading;
  - an exam-quality explanation in Hungarian (concise, 80–200 words, with bullet points where natural);
  - a **diagram** wherever the topic is visual (SVG, built from components: cross-sections, block diagrams, climate charts, sketches of the Earth's orbit, plate boundaries…);
  - **"Kulcsfogalmak"** chips linking to the dictionary;
  - **"Kapcsolódó folyamat"** links;
  - a **"Vizsgatipp"** box with a typical exam phrasing or a common mistake;
  - 2–3 self-check questions that reveal their answers on click.
- Each card has a "Megértettem / Még gyakorolnom kell" control, which feeds the progress tracking.
- The reading view has a table of contents per topic, a reading-progress bar and "previous / next".

### 6.2 FOGALOMTÁR (dictionary of every concept)
- Build entries for **all 1,025 concepts** in `concepts.json`. Split combined items sensibly. For example, `"holdfázisok (újhold, első negyed, holdtölte/telihold, utolsó negyed)"` becomes a main entry plus sub-entries; keep the original string as `sourceLabel`.
- Each entry has:
  - the term, with aliases from parentheses;
  - a **definition** (1–3 precise sentences, exam level);
  - an example (preferably with a real place from `topography.json`, linked to the map);
  - related terms;
  - the topic and subtopic;
  - the level badge;
  - **hashtags**.
- **Hashtags:** every entry gets 2–5 tags drawn from a controlled vocabulary that you define and document in `src/content/tags.ts`. It should include, for example: `#térkép #csillagászat #Föld-mozgásai #kőzetburok #lemeztektonika #vulkanizmus #hegységképződés #kőzetek #ásványkincsek #légkör #időjárás #éghajlat #vízburok #felszínformálás #talaj #övezetesség #népesség #település #gazdaság #ipar #mezőgazdaság #szolgáltatás #pénzügyek #globalizáció #EU #Magyarország #Európa #környezetvédelem #fenntarthatóság #űrkutatás #számolás`. Use the topic numbers as tags as well (`#1-témakör` … `#10-témakör`).
- **UI:**
  - an alphabetical index (A–Zs Hungarian collation via `Intl.Collator('hu')`) with a sticky letter rail;
  - instant fuzzy search;
  - clickable hashtag chips (selecting several combines them with AND, with an OR toggle);
  - topic and level filters;
  - result counts.
- Each entry has its own URL (`/elmelet/fogalomtar/<slug>`).
- Everywhere in the app, concept names inside explanations are auto-linked (the first occurrence per card) and show a hover preview card with the definition.

### 6.3 FOLYAMATOK (processes)
A dedicated section for processes, because these are what the essay questions (kifejtős feladatok) ask about. Each process is an **interactive, step-by-step animated diagram**: a stepper with play/pause, previous/next, and a scrubbable timeline. Each step has a short caption. Each process page also has:
- **Okok → Lefolyás → Következmények** blocks;
- real-world examples linked to the map;
- related concepts;
- a **"Sorbarendezés" mini-game**: drag the shuffled steps into the right order.

Build at least these processes, and check `requirements.json` for others that are explicitly required, adding them too:
- **Astronomy:**
  - Föld forgása és keringése, the seasons (the axis tilt animation with the solstices and equinoxes);
  - nappalok és éjszakák hossza;
  - holdfázisok;
  - nap- és holdfogyatkozás;
  - helyi idő és zónaidő and the dateline (an interactive globe).
- **Lithosphere:**
  - lemezmozgások (távolodó, közeledő in its 3 variants, elcsúszó);
  - hegységképződés szakaszai;
  - vulkáni működés (rétegvulkán vs. pajzsvulkán vs. hasadékvulkán);
  - földrengés and cunami;
  - kőzetanyag-körforgás;
  - magmás and üledékes ércképződés;
  - forró pont.
- **Atmosphere:**
  - a levegő felmelegedése and the greenhouse effect;
  - felhő- és csapadékképződés;
  - ciklon and anticiklon;
  - meleg- és hidegfront átvonulása;
  - általános légkörzés (passzát, nyugati szelek, sarki szelek);
  - monszun;
  - főnszél;
  - ózonréteg elvékonyodása.
- **Hydrosphere:**
  - a víz körforgása;
  - tengeráramlások kialakulása;
  - a folyó munkája (erózió → szállítás → lerakás, kanyarulatok, delta and tölcsértorkolat);
  - árvíz;
  - a karsztosodás (oldás, cseppkőképződés);
  - a jég munkája (gleccser);
  - a tó feltöltődése and eutrofizáció.
- **Surface & soil:**
  - aprózódás és mállás;
  - a szél felszínformálása;
  - talajképződés;
  - talajpusztulás and sivatagosodás.
- **Society & economy:**
  - demográfiai átmenet;
  - városodás szakaszai (urbanizáció, szuburbanizáció, dezurbanizáció, reurbanizáció);
  - globalizáció and the relocation of production;
  - telephelyválasztás tényezői;
  - a pénz és tőke áramlása;
  - savas eső;
  - globális felmelegedés feedbacks.

### 6.4 Answer checking and search (shared)
`normalizeHu()` lowercases, trims, collapses spaces, treats hyphens/en-dashes/spaces as equal, and strips articles at the start ("a", "az").
- **Accents:** an answer *without* accents is accepted but marked "ékezet!" (the exam requires correct spelling, so show the correct form prominently).
- **Aliases:** every name in parentheses in the data is an accepted alias (`Csomolungma (Mt. Everest)` → both). You may add common, unambiguous aliases.
- **Typos:** Damerau–Levenshtein ≤ 1 for answers of 5+ characters and ≤ 2 for 10+ characters is accepted, but marked "elírás – helyesen: …". Anything further away is wrong.
- Cover all of this with unit tests, including tricky pairs that must NOT match (e.g. *Niger* vs *Nigéria*, *Szlovákia* vs *Szlovénia*, *Duna* vs *Dunaj*, *Kis-Balaton* vs *Balaton*).

### 6.5 SZÁMOLÁS (calculation practice)
Generators with random but realistic values, a worked step-by-step solution, and a hint button. Cover every calculation named in the requirements, at least:
- méretarány ↔ valós távolság ↔ terület;
- relatív magasság;
- távolság fokhálózaton (along the Equator or a meridian);
- **helyi idő** (15° = 1 óra, 1° = 4 perc);
- **zónaidő** and the dateline;
- **delelési magasság** on the equinoxes and solstices, anywhere;
- hőmérsékleti gradiens (0.6 °C / 100 m and the dry/wet adiabatic rates as required);
- napi/évi közép- és hőingás from data;
- csapadék and lefolyás;
- népsűrűség;
- természetes szaporodás / fogyás ‰, vándorlási különbözet;
- GDP/fő and comparisons;
- export–import egyenleg.

Check `requirements.json` for any others and add them. Validate the inputs (e.g. no impossible latitudes). Unit-test every generator against hand-computed cases.

### 6.6 Theory KVÍZ
- **Setup:** topics, subtopics, hashtags, level, number of questions, and the types.
- **Types:**
  - fogalom → definíció (4 options);
  - definíció → fogalom (typed, or 4 options);
  - igaz/hamis with a correction ("Mi a hiba?");
  - kakukktojás;
  - párosítás (drag lines between two columns);
  - folyamat sorbarendezése;
  - ábraelemzés (label the parts of a diagram);
  - számolós (from §6.5);
  - "Magyarázd el!" open questions: the student writes 3–6 sentences, then sees a model answer with **tartalmi elemek checkboxes** and self-scores like the official rubric in `exam-format.txt`.
- **Results:** accuracy per topic and tag, weak concepts with links, and "Hibásak újra".

## 7. Learning engine (shared by both modes)
- **Spaced repetition:** an SM-2-style scheduler (or FSRS-lite) for every topography item, concept, process and calculation type. Every quiz answer and flashcard rating updates it. A correct answer that was accepted with a spelling warning counts as "hard".
- **Mai ismétlés:** a mixed daily queue of the due items plus a few new ones, with a daily goal configurable in the settings (default 40 items, about 20 minutes).
- **Progress per item:** new → learning → mastered. Show progress rings per region/category and per topic/tag. "Gyenge pontok" lists the most-missed items.
- **Exam countdown:** the date of the next May–June written exam period, editable in the settings, with a suggested weekly plan that spreads the remaining items over the remaining days.
- **Próbavizsga** (`/vizsga`): a timed mixed test modelled on the advanced written exam structure in `exam-format.txt`, with a topography part first and then the theory and calculation tasks. Summarise the format on the same page, including the advanced written and oral durations and points as given in the file.

## 8. Generating geometry and content (data pipeline) – do this carefully

### 8.1 Geometry for the 802 topography items
Write a Node script, `scripts/build-geo.ts`, that produces `public/data/geo/<region>.topo.json` plus `public/data/places.json`. `places.json` maps each `topography.json` id to its geometry type, geometry, a label anchor point, its aliases, an English name and `geoSource`.
- **Sources** (all free; record each one's licence in `ATTRIBUTION.md` and in the app footer):
  - **Natural Earth 1:10m:** countries; populated places; rivers + lake centerlines, with the Europe supplement; lakes; geography regions (polygons, points, elevation points); geography marine polygons.
  - **Plate boundaries:** PB2002 (Peter Bird), the GitHub `fraxen/tectonicplates` GeoJSON.
  - **Magyarország counties and regions:** geoBoundaries HUN ADM1 (CC BY 4.0) or KSH data. Build the regions by merging counties according to the official list.
- **Matching:** for each item, write an English/international name and a type in `scripts/name-map.ts` (e.g. `Kanári-áramlás → Canary Current, line`), then match it to the source by name and type, with fuzzy matching inside the item's region bbox.
- **Items with no source feature** (many Hungarian landscapes, ocean currents, some landforms, the historical regions, the industrial regions): create a hand-authored geometry in `scripts/manual-geo/*.geojson`.
  - Use a simplified polygon or line with sensible accuracy: a landscape polygon should cover the right area, and a current should follow its real path and direction.
  - Never place a feature in the wrong country or on the wrong side of a river or ridge.
- Every item gets `geoSource: "naturalearth" | "pb2002" | "geoboundaries" | "manual"` and `confidence: "high" | "medium" | "low"`.
- The script outputs `review/geo-report.md`, which lists every unmatched, manual or low-confidence item for human review. Coverage must be **100%**: the build fails if any of the 802 ids lacks geometry.
- **Built-in correction tool:** a hidden **"Térképszerkesztő"** (enabled with `?edit=1`) where the student can drag a point, redraw a line or polygon over the map, and export the corrected `places.json` patch.

### 8.2 Text content (explanations, definitions, facts, distractors)
- Write all generated content as **versioned JSON or MDX files** in `src/content/` and never hard-code it inside components: `concepts/*.json`; `cards/<topic>/<subtopic>.mdx`; `processes/*.mdx`; `places-facts/<region>.json`.
- **Accuracy rules:** standard Hungarian geography-textbook terminology matching the official concept names exactly; correct Hungarian spelling and place-name spelling (never anglicise); no numbers you are not sure of — prefer qualitative statements or well-established round figures.
- Every generated item carries `generated: true` and `reviewed: false`. The UI shows a small "AI-generált – ellenőrizd a tankönyvvel" marker until the student ticks **"Ellenőriztem"** on it (stored in local state). Add a "Hibát találtam" button that opens a note field and saves the note to an exportable list.
- **Generate in batches:** one topic or region at a time. After each batch, run a self-review pass that re-reads the batch against the requirements and fixes errors. Record the batch status in `review/content-status.md`.

## 9. Accessibility, performance, quality
- WCAG 2.1 AA: full keyboard support, including the map quiz. For keyboard users, the "Hol van?" quiz offers a grid-cell or arrow-key cursor alternative and the typed variants.
- Visible focus rings, `aria-live` feedback in quizzes, and labels on every control.
- Performance: code-split per route; lazy-load the region topology; simplify geometry per zoom level (topojson-simplify at build time); keep the initial JS under ~250 kB gzipped; aim for Lighthouse ≥ 90 on mobile.
- Responsive from 360px up. On phones the map quiz uses tap with pinch-zoom, and confirms with a "Ide jelölöm" button so mis-taps don't count.
- Everything works offline after the first visit (PWA precache of the app shell + data).
- README (in Hungarian): how to run it, how to deploy it, how to correct map data with the Térképszerkesztő, how to edit content, how progress export/import works, and the attributions.

## 10. Home page
- Hero: the mode split as two large cards. **Topográfia** shows an animated contour background with the 802-item progress ring. **Elmélet** shows the strata background with the 1,025-concept progress ring.
- Below: the "Mai ismétlés" call to action, the exam countdown, the streak, "Gyenge pontok", and a "Folytasd ott, ahol abbahagytad" link.

## 11. Copy and tone
- Use the student-friendly informal "te" form in Hungarian, short and encouraging, never childish. Examples: "Szép! 12/15 – a Vízrajz még csiszolható.", "Ékezet hiányzik: **Csád-tó**.", "Ma 38 elem vár ismétlésre (~18 perc)."
- Use the official Hungarian terms exactly as in `concepts.json` and `topography.json`.

## 12. Build in these phases (run, test and fix after each)
1. Scaffold the project (Vite, React, TS, Router, Zustand, PWA, Vitest, Playwright). Add the design tokens, fonts, the header with the mode split and its animation, the routing skeleton and the dark mode.
2. Data loading: types for `topography.json`, `requirements.json` and `concepts.json`; `normalizeHu` and the answer checker with tests; the spaced-repetition engine with tests; the persistent store with export/import.
3. Geo pipeline (§8.1): download the sources, write the name map, author the manual geometries, reach 100% coverage, and produce `review/geo-report.md`.
4. TÉRKÉP: the map renderer, filters, the country drill-down, numbered markers, the detail drawer, and Kártyák and Felfedező séta.
5. Topography KVÍZ: all 5 question types, the results page and the mistakes map.
6. Content generation (§8.2) batch by batch: concepts → learning cards → processes → place facts, with the self-review after each batch.
7. Theory: TANANYAG, FOGALOMTÁR (search, hashtags, index), FOLYAMATOK (animated steppers and the ordering game) and SZÁMOLÁS generators with tests.
8. Theory KVÍZ, Mai ismétlés, the progress dashboard, the exam page and Próbavizsga.
9. The dynamic backgrounds (contour field, strata parallax, day–night globe), motion polish and reduced motion.
10. Accessibility, performance, offline and responsive passes; Lighthouse; README; deploy instructions.

When you finish, give a short summary covering: what was built and how to run it; the coverage numbers (places with geometry, concepts with definitions, processes, calculation types); the list of items in `review/geo-report.md` and `review/content-status.md` that most need a human check.
