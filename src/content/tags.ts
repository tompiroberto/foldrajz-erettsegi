// Controlled hashtag vocabulary for the Fogalomtár, the learning cards and the quizzes
// (brief §6.2). Every generated entry uses 2–5 tags from this list only.

export interface TagDef {
  tag: string;
  /** What belongs under the tag. */
  desc: string;
}

export const TAGS: TagDef[] = [
  { tag: 'térkép', desc: 'térképek, méretarány, vetületek, domborzatábrázolás, fokhálózat' },
  { tag: 'távérzékelés', desc: 'műholdfelvételek, GPS, GIS' },
  { tag: 'csillagászat', desc: 'Világegyetem, csillagok, Naprendszer, égitestek' },
  { tag: 'Föld-mozgásai', desc: 'forgás, keringés, évszakok, időszámítás, időzónák' },
  { tag: 'űrkutatás', desc: 'űreszközök, űrkutatás története és haszna' },
  { tag: 'kőzetburok', desc: 'a Föld szerkezete, kőzetburok, földkéreg' },
  { tag: 'lemeztektonika', desc: 'kőzetlemezek, lemezmozgások, lemezszegélyek' },
  { tag: 'vulkanizmus', desc: 'vulkánok, magmatizmus, utóműködés' },
  { tag: 'földrengés', desc: 'földrengések, cunami, mérésük' },
  { tag: 'hegységképződés', desc: 'gyűrődés, vetődés, hegységrendszerek' },
  { tag: 'kőzetek', desc: 'ásványok, kőzetek, kőzetanyag-körforgás' },
  { tag: 'ásványkincsek', desc: 'ércek, energiahordozók, nyersanyagok' },
  { tag: 'nagyszerkezet', desc: 'ősföldek, táblák, nagyszerkezeti egységek' },
  { tag: 'földtörténet', desc: 'földtörténeti idők, kormeghatározás, őskontinensek' },
  { tag: 'légkör', desc: 'a légkör anyaga, szerkezete, felmelegedése' },
  { tag: 'légkörzés', desc: 'légnyomás, szelek, ciklonok, frontok, monszun' },
  { tag: 'időjárás', desc: 'időjárási elemek, felhő, csapadék, veszélyhelyzetek' },
  { tag: 'éghajlat', desc: 'éghajlati elemek, éghajlattípusok, éghajlatváltozás' },
  { tag: 'vízburok', desc: 'tengerek, óceánok, tengeráramlások, a víz körforgása' },
  { tag: 'felszíni-vizek', desc: 'folyók, tavak, vízjárás, árvíz' },
  { tag: 'felszín-alatti-vizek', desc: 'talajvíz, karsztvíz, hévíz, ásványvíz' },
  { tag: 'vízgazdálkodás', desc: 'vízellátás, szennyvíz, ár- és belvízvédelem' },
  { tag: 'felszínformálás', desc: 'külső és belső erők, felszínformák' },
  { tag: 'karszt', desc: 'karsztosodás, karsztformák, barlangok' },
  { tag: 'jég-munkája', desc: 'gleccserek, jégtakarók, glaciális formák' },
  { tag: 'talaj', desc: 'talajképződés, talajtípusok, talajpusztulás' },
  { tag: 'övezetesség', desc: 'földrajzi övezetek, övek, vízszintes és függőleges övezetesség' },
  { tag: 'népesség', desc: 'népesedés, korfa, migráció, népsűrűség' },
  { tag: 'település', desc: 'településtípusok, urbanizáció, városszerkezet' },
  { tag: 'társadalom', desc: 'állam, nemzet, nyelv, vallás, kultúra' },
  { tag: 'gazdaság', desc: 'nemzetgazdaság, szektorok, fejlettség, mutatók' },
  { tag: 'ipar', desc: 'ipari ágazatok, telephely, iparvidékek' },
  { tag: 'mezőgazdaság', desc: 'gazdálkodási formák, termesztés, állattartás' },
  { tag: 'szolgáltatás', desc: 'kereskedelem, közlekedés, turizmus, K+F' },
  { tag: 'pénzügyek', desc: 'pénz, hitel, tőke, árfolyam, államháztartás' },
  { tag: 'globalizáció', desc: 'TNC-k, világgazdaság, nemzetközi szervezetek' },
  { tag: 'integráció', desc: 'gazdasági integrációk, EU' },
  { tag: 'EU', desc: 'az Európai Unió intézményei és politikái' },
  { tag: 'Magyarország', desc: 'hazai vonatkozású fogalmak' },
  { tag: 'Európa', desc: 'Európa földrajza' },
  { tag: 'környezetvédelem', desc: 'környezetszennyezés, természetvédelem' },
  { tag: 'fenntarthatóság', desc: 'fenntartható fejlődés, fogyasztás, energia' },
  { tag: 'globális-problémák', desc: 'éhezés, túlnépesedés, klímaválság, konfliktusok' },
  { tag: 'számolás', desc: 'számítási feladathoz kapcsolódó fogalom' },
  ...Array.from({ length: 10 }, (_, i) => ({ tag: `${i + 1}-témakör`, desc: `a ${i + 1}. témakörhöz tartozik` })),
];

export const TAG_SET = new Set(TAGS.map((t) => t.tag));
