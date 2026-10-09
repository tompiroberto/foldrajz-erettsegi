# Fogalomtár – t3-1 (3.1.1–3.1.5, kőzetburok)

- Fájl: `src/content/concepts/t3-1.json` – 167 szócikk (128 címkés fő szócikk + 39 al-szócikk `parent`-tel).
- Lefedettség: a 3.1-es csoportok mind a 135 különböző címkéje lefedve („óceánközépi hátság” és „mélytengeri árok” a 3.1.2-ben és 3.1.5-ben is szerepel → egy-egy szócikk, subtopic 3.1.2).
- Összevont, PDF által szétvágott címkék: lemezmozgások (távolodó/közeledő/elcsúszó), redőtípusok (álló/ferde/fekvő), üledékes kőzetek (törmelékes/vegyi/szerves), tufák (andezit/bazalt/riolit), ércásványok (nehéz/színes/nemes), magmás kőzetek összetétel szerint (bázisos/semleges/savanyú) – mind fő szócikk + al-szócikkek.
- Zárójeles listák al-szócikkekkel: szénfajták (5), hegységképződés típusai (3), hegységképződési szakaszok (3); páros: külső/belső mag, fedett/fedetlen ősmasszívum, feltöltött/lepusztult síkság, gyarapodó/fölemésztődő szegély, laterit/karsztbauxit.
- Validátor: `npx tsx scripts/validate-content.ts concepts src/content/concepts/t3-1.json` → 0 hiba, 0 figyelmeztetés. Minden `related` és `parent` a fájlon belüli id-re mutat.
- Önellenőrzés után javítva: Ural kivéve a gyűrthegység-példából (tankönyvenként eltérő besorolás), Badacsony-kürtő példa törölve, bazalttufa-példa pontosítva (Tihany), savanyúvíz-példa (Borszék nem a Hargitán), „szökőár” alias törölve (árapály-jelentés miatt).

## Szakmai ellenőrzésre javasolt
- SiO₂-határértékek (kb. 52% / 65%) a magmás kőzetek csoportosításánál – tankönyvenként 1–2% eltérés lehet.
- Nehézfém-fogalom: a földrajzi (vas + vasötvöző fémek) értelmezést használtam, nem a kémiait.
- Mélységi számok: óceáni kéreg 5–10 km, kontinentális 30–40 km, köpenyhatár ~2900 km, külső/belső mag határa ~5100 km, kőzetburok ~100 km.
- Példák: lépcsővidék (Budai-hegység keleti pereme), állóredő általános példája, Witwatersrand „ősi torlatos” eredete, Mátra érctelérei (Recsk, Gyöngyösoroszi).
- A subtopic mező a forráscsoport szövegét követi; a 3.1.1-nél ez „3.1. A kőzetburok földrajza 3.1.1. …” (PDF-kivonat szerint).
