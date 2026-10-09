# Tanulókártyák – 5–6. témakör (t5-6.json)

Fájl: `src/content/cards/t5-6.json` – 81 kártya (5.1: 21, 5.2: 11, 6.1: 19, 6.2: 3, 6.3: 12, 6.4: 15), minden követelmény-id lefedve.
Validátor (`npx tsx scripts/validate-content.ts cards src/content/cards/t5-6.json`): 0 hiba, 0 figyelmeztetés. Magyarázatok 80–200 szó.

## Felhasznált ábrák / folyamatok
- Ábrák: demographic, age-pyramid, urbanization, city-zones, economic-sectors, integration; a többi kártyán null.
- Folyamatok: demografiai-atmenet, varosodas-szakaszai, globalizacio, telephelyvalasztas, toke-aramlasa.

## Önellenőrzés (self-review)
- Számítási kártyák (5.1 k7, 6.1 k3/k7, 6.4 k4/k5/e1/e8) példái újraszámolva, helyesek; a valuta/kamat példák számai kifejezetten kitaláltként jelölve.
- Aktuális statisztika helyett minőségi állítások; csak jól ismert tények (pl. 1973 olajár-robbanás, Ratkó-korszak, 1982 mexikói adósságválság, IMF/Világbank 1944, NATO 1949).
- Javítva a review során: 6.4 e6 megfogalmazás („forintosítva”), 6.3 k6 Stellantis székhelye pótolva.

## Ellenőrzésre javasolt pontok (reviewer)
- 6.1 k4 / k12: jövedelmi besorolási példák (Világbank-kategóriák változhatnak; Nepál ma alsó-közepes jövedelmű, de perifériapéldaként szerepel).
- 6.1 k6: a bányászat szektorbesorolása tankönyvenként eltér – a kártya ezt jelzi.
- 5.1 e8: a kulturális régiók felosztása szerzőnként eltér – a kártya ezt jelzi.
- 6.3 k6: TNC-példák rangsora évről évre változik (a kártya ezt jelzi).
- Néhány hivatalos címke PDF-ből szétvágott alakban szerepel a concepts mezőben, mert a validátor ezt követeli: „bokor-”, „sor- és szórt tanya”, „alacsony”, „közepes és magas jövedelmű ország”, „hagyományos”, „állami”, „Tudományos és Kulturális Szervezete (UNESCO)”.
