# Tanulókártyák – 3.1 A kőzetburok földrajza (t3-1)

Fájl: `src/content/cards/t3-1.json` – 55 kártya (3.1.1: 6, 3.1.2: 16, 3.1.3: 9, 3.1.4: 11, 3.1.5: 13), minden `3-1-*` követelményhez egy.

Validálás: `npx tsx scripts/validate-content.ts cards src/content/cards/t3-1.json` → 0 hiba, 0 figyelmeztetés. A magyarázatok 93–145 szavasak.

## Önellenőrzés (javítva)
- A Kanári-szigetek kikerült a Közép-atlanti-hátság példái közül (forró pont, nem hátság).
- Az Indonéz-szigetvilág kikerült az óceáni–óceáni szigetív példái közül (vitatható besorolás); a Japán-szigetek, Mariana- és Fülöp-szigetek maradt.
- A gránitra vonatkozó „hazánk legidősebb kőzete” állítás helyett „óidei mélységi magmás kőzet” szerepel.

## Lektornak érdemes megnézni
- Számok (kerek, tankönyvi értékek): kéregvastagság 5–10 / 30–40 km, kőzetburok kb. 100 km, köpeny–mag határ kb. 2900 km, geotermikus gradiens kb. 3 °C/100 m (hazánkban kb. 5 °C/100 m), sűrűség 2,7–3 / 5,5 / 10–13 g/cm³, Richter-skálán egységenként kb. harmincszoros energia, közép-/magashegység határa kb. 1500 m.
- Besorolások: Kaledóniai (Skandináv-hegység, Skócia, Appalache É), Variszkuszi (Urál, Nagy-Vízválasztó-hegység, Velencei-hegység gránitja), magmás ércképződési szakaszok (likvid magmás, pegmatitos, hidrotermális).
- Hazai példák: Recsk, Gyöngyösoroszi, Úrkút, Mátraderecske, Kolontár (2010), Bakony karsztvíz / Hévíz.
- Egyes tankönyvi alakok a hivatalos listán szétvágva szerepelnek (pl. „távolodó” + „közeledő és elcsúszó lemezmozgás”, „álló” + „ferde és fekvő redő”, „nehéz-”); a `concepts` mezőben ezek betűre pontosan, a hivatalos alakban szerepelnek.
- `reviewed: false` minden kártyán.
