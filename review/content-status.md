# Tartalom állapota – összesítő

Minden itt felsorolt tartalom **AI-generált** (`generated: true`, `reviewed: false`), és az alkalmazásban
„AI-generált – ellenőrizd a tankönyvvel” jelzést kap. Az alábbi fájlok sorolják fel tételesen, mit érdemes
tanárnak vagy tankönyvvel ellenőrizni. Az összesítőt a `node scripts/content-status.mjs` frissíti.

| Tartalom | Darab |
| --- | --- |
| Fogalomtár-szócikkek | 1261 (mind az 1021 hivatalos címke lefedve) |
| Tanulókártyák | 647 / 647 követelmény |
| Folyamatok (lépések + esszé) | 41 / 41 |
| Helyek fekvésleírással | 802 / 802 |
| Ábrakomponensek | 35 |

Az érettségi feladatok ellenőrzendő tételei külön: [exam-status.md](exam-status.md). A térképi geometria: [geo-report.md](geo-report.md).

## Fogalmak

- [concepts-t1-2.md](content-status/concepts-t1-2.md) – 10 listatétel
- [concepts-t3-1.md](content-status/concepts-t3-1.md) – 11 listatétel
- [concepts-t3-2.md](content-status/concepts-t3-2.md) – 10 listatétel
- [concepts-t3-3.md](content-status/concepts-t3-3.md) – 6 listatétel
- [concepts-t4-1.md](content-status/concepts-t4-1.md) – 7 listatétel
- [concepts-t4-2.md](content-status/concepts-t4-2.md) – 9 listatétel
- [concepts-t5-10.md](content-status/concepts-t5-10.md) – 6 listatétel
- [concepts-t6-1.md](content-status/concepts-t6-1.md) – 6 listatétel
- [concepts-t6-2.md](content-status/concepts-t6-2.md) – 6 listatétel

## Tanulókártyák

- [cards-t1-2.md](content-status/cards-t1-2.md) – 10 listatétel
- [cards-t10.md](content-status/cards-t10.md) – 9 listatétel
- [cards-t3-1.md](content-status/cards-t3-1.md) – 8 listatétel
- [cards-t3-2.md](content-status/cards-t3-2.md) – 10 listatétel
- [cards-t3-3.md](content-status/cards-t3-3.md) – 12 listatétel
- [cards-t4.md](content-status/cards-t4.md) – 12 listatétel
- [cards-t5-6.md](content-status/cards-t5-6.md) – 10 listatétel
- [cards-t7.md](content-status/cards-t7.md) – 12 listatétel
- [cards-t8.md](content-status/cards-t8.md) – 10 listatétel
- [cards-t9.md](content-status/cards-t9.md) – 10 listatétel

## Folyamatok

- [processes-1.md](content-status/processes-1.md) – 8 listatétel
- [processes-2.md](content-status/processes-2.md) – 12 listatétel
- [processes-3.md](content-status/processes-3.md) – 6 listatétel

## Helyek (fekvés + tények)

- [places-azsia-ausztralia.md](content-status/places-azsia-ausztralia.md) – 30 listatétel
- [places-europa-1.md](content-status/places-europa-1.md) – 3 listatétel
- [places-europa-2.md](content-status/places-europa-2.md) – 20 listatétel
- [places-fold-afrika-amerika.md](content-status/places-fold-afrika-amerika.md) – 27 listatétel
- [places-magyarorszag.md](content-status/places-magyarorszag.md) – 20 listatétel

## Ismert geoadat-pontatlanságok (a helyleíró ügynökök jelezték)

A `public/data/places.json` horgonypontja/befoglaló téglalapja néhány elemnél a tengerentúli területek miatt félrevezető
(Franciaország, Hollandia, Norvégia, Egyesült Királyság, Portugália, Spanyolország, Oroszország, Nyugat- és Észak-Európa,
USA, Chile, Ecuador, Amerika, Ausztrália, Új-Zéland, Melanézia, Polinézia). Csíkszereda horgonya kb. 0,3°-kal nyugatabbra
van, a Kárpát-medence téglalapja csak az Alföldet fedi. A térképi rajz jó, csak a „középpontja kb.” koordináta pontatlan.
