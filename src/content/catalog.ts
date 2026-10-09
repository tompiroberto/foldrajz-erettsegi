// Catalogue of the animated processes (brief §6.3) and of the diagram components that
// learning cards may reference. Generated content (src/content/processes/*.json and
// src/content/cards/*.json) must only use ids from here.

/** Bespoke animated diagrams have a fixed step outline; the content fills in the text. */
export interface ProcessDef {
  id: string;
  title: string;
  group: 'Csillagászat' | 'Kőzetburok' | 'Légkör' | 'Vízburok' | 'Felszín és talaj' | 'Társadalom és gazdaság';
  /** Bespoke diagram component id, or 'flow' for the generic animated step chain. */
  diagram: string;
  /** Required step titles (in order) for bespoke diagrams. */
  outline?: string[];
  topicNo: number;
}

export const PROCESSES: ProcessDef[] = [
  // Csillagászat
  { id: 'evszakok', title: 'A Föld forgása és keringése, az évszakok', group: 'Csillagászat', diagram: 'seasons', topicNo: 2, outline: ['Tavaszi nap-éj egyenlőség (március 20–21.)', 'Nyári napforduló (június 21–22.)', 'Őszi nap-éj egyenlőség (szeptember 22–23.)', 'Téli napforduló (december 21–22.)'] },
  { id: 'nappalok-hossza', title: 'A nappalok és éjszakák hossza', group: 'Csillagászat', diagram: 'daylength', topicNo: 2, outline: ['Nap-éj egyenlőség: mindenhol 12 óra', 'Északi nyár: az északi félgömbön hosszabbak a nappalok', 'Sarkkörök: sarki nappal és sarki éjszaka', 'Északi tél: a déli félgömbön hosszabbak a nappalok'] },
  { id: 'holdfazisok', title: 'A holdfázisok', group: 'Csillagászat', diagram: 'moon-phases', topicNo: 2, outline: ['Újhold', 'Növekvő sarló', 'Első negyed', 'Növekvő hold', 'Holdtölte (telihold)', 'Fogyó hold', 'Utolsó negyed', 'Fogyó sarló'] },
  { id: 'fogyatkozasok', title: 'Nap- és holdfogyatkozás', group: 'Csillagászat', diagram: 'eclipse', topicNo: 2, outline: ['A Nap, a Föld és a Hold helyzete', 'Napfogyatkozás: a Hold árnyéka a Földre esik (újholdkor)', 'Teljes és részleges napfogyatkozás', 'Holdfogyatkozás: a Hold a Föld árnyékába kerül (holdtöltekor)', 'Miért nincs minden hónapban fogyatkozás?'] },
  { id: 'helyi-ido-zonaido', title: 'Helyi idő, zónaidő és a dátumválasztó vonal', group: 'Csillagászat', diagram: 'time-zones', topicNo: 2, outline: ['A Föld 24 óra alatt fordul körbe: 15° = 1 óra', 'Helyi idő: a delelés pillanata 12 óra', 'Zónaidő: 24 időzóna, a zóna középső délkörének ideje', 'Dátumválasztó vonal: nyugat felé átlépve egy napot előre lapozunk'] },
  { id: 'hold-mozgasa', title: 'A Hold mozgása és a tengerjárás', group: 'Vízburok', diagram: 'tides', topicNo: 3, outline: ['A Hold vonzása dagályhullámot emel', 'A Föld túloldalán is dagály van', 'Szökőár: a Nap és a Hold egy irányba húz', 'Vakár: a Nap és a Hold derékszögben áll'] },

  // Kőzetburok
  { id: 'lemezmozgasok', title: 'Lemezmozgások: távolodó, közeledő és elcsúszó lemezszegélyek', group: 'Kőzetburok', diagram: 'plate-boundaries', topicNo: 3, outline: ['Távolodó lemezszegély: óceánközépi hátság, hasadékvölgy', 'Közeledő óceáni–kontinentális: alábukás, mélytengeri árok, vulkáni hegység', 'Közeledő óceáni–óceáni: vulkáni szigetív', 'Közeledő kontinentális–kontinentális: gyűrthegység', 'Elcsúszó lemezszegély: földrengések, törésvonal'] },
  { id: 'hegysegkepzodes', title: 'A hegységképződés szakaszai', group: 'Kőzetburok', diagram: 'flow', topicNo: 3 },
  { id: 'vulkani-mukodes', title: 'Vulkáni működés: rétegvulkán, pajzsvulkán, hasadékvulkán', group: 'Kőzetburok', diagram: 'volcano', topicNo: 3, outline: ['Magmakamra és kürtő', 'Rétegvulkán: savanyú, sűrűn folyó magma, robbanásos kitörés', 'Pajzsvulkán: bázisos, hígan folyó láva, csendes kiömlés', 'Hasadékvulkán: lávaömlés hosszú hasadék mentén', 'Utóműködés: gejzír, fumarola, szolfatára, mofetta'] },
  { id: 'foldrenges-cunami', title: 'Földrengés és cunami', group: 'Kőzetburok', diagram: 'flow', topicNo: 3 },
  { id: 'kozetanyag-korforgas', title: 'A kőzetanyag-körforgás', group: 'Kőzetburok', diagram: 'rock-cycle', topicNo: 3, outline: ['Magma → magmás kőzet (kihűlés)', 'Mállás, lepusztulás, szállítás', 'Lerakódás, üledékes kőzet (kőzetté válás)', 'Átalakulás nagy nyomáson és hőmérsékleten', 'Beolvadás: újra magma'] },
  { id: 'erckepzodes', title: 'Magmás és üledékes ércképződés', group: 'Kőzetburok', diagram: 'flow', topicNo: 3 },
  { id: 'forro-pont', title: 'Forró pont feletti vulkánosság', group: 'Kőzetburok', diagram: 'hotspot', topicNo: 3, outline: ['A köpenyből feláramló forró anyag (forró pont)', 'A lemez fölötte vulkánt hoz létre', 'A lemez továbbcsúszik, a vulkán kialszik', 'Vulkánlánc: a szigetek kora a forró ponttól távolodva nő'] },
  { id: 'szenhidrogen-szenkepzodes', title: 'A szén, a kőolaj és a földgáz keletkezése', group: 'Kőzetburok', diagram: 'flow', topicNo: 3 },

  // Légkör
  { id: 'uveghazhatas', title: 'A levegő felmelegedése és az üvegházhatás', group: 'Légkör', diagram: 'greenhouse', topicNo: 3, outline: ['Rövidhullámú napsugárzás érkezik', 'Visszaverődés (albedó) és elnyelődés', 'A felszín felmelegszik és hosszúhullámú sugárzást bocsát ki', 'Az üvegházgázok elnyelik és visszasugározzák a hőt', 'Fokozódó üvegházhatás: több üvegházgáz, melegebb légkör'] },
  { id: 'felho-csapadek', title: 'Felhő- és csapadékképződés', group: 'Légkör', diagram: 'flow', topicNo: 3 },
  { id: 'ciklon-anticiklon', title: 'Ciklon és anticiklon', group: 'Légkör', diagram: 'cyclone', topicNo: 3, outline: ['Anticiklon: leszálló, felmelegedő levegő, magas nyomás', 'Az északi félgömbön az óramutató járásával megegyezően kiáramlik', 'Ciklon: felszálló, lehűlő levegő, alacsony nyomás', 'Az északi félgömbön az óramutatóval ellentétesen beáramlik', 'Időjárás: anticiklonban derült, ciklonban felhős, csapadékos'] },
  { id: 'frontok', title: 'Meleg- és hidegfront átvonulása', group: 'Légkör', diagram: 'fronts', topicNo: 3, outline: ['Melegfront: a meleg levegő lassan felsiklik a hidegre', 'Réteges felhőzet, tartós csendes eső', 'Hidegfront: a hideg levegő ék alakban a meleg alá nyomul', 'Gomolyfelhők, zivatar, zápor, széllökések, lehűlés'] },
  { id: 'altalanos-legkorzes', title: 'Az általános légkörzés: passzát, nyugatias és sarki szelek', group: 'Légkör', diagram: 'circulation', topicNo: 3, outline: ['Egyenlítői alacsony nyomás: felszálló levegő', 'Térítői magas nyomás: leszálló levegő', 'Passzátszelek a térítőktől az Egyenlítő felé', 'Nyugatias szelek a mérsékelt övezetben', 'Sarki magas nyomás és sarki szelek', 'Az eltérítő erő hatása a szélirányra'] },
  { id: 'monszun', title: 'A monszun', group: 'Légkör', diagram: 'monsoon', topicNo: 3, outline: ['Nyáron a szárazföld jobban felmelegszik: alacsony nyomás', 'Nyári monszun: nedves szél a tenger felől, esős évszak', 'Télen a szárazföld lehűl: magas nyomás', 'Téli monszun: száraz szél a szárazföld felől'] },
  { id: 'fonszel', title: 'A főnszél', group: 'Légkör', diagram: 'foehn', topicNo: 3, outline: ['A légáramlás eléri a hegységet és felemelkedik', 'Szélhatás oldal: lehűlés, kicsapódás, csapadék', 'A gerincen átbukó levegő már szárazabb', 'Szélárnyékos oldal: leszálló, gyorsan felmelegedő, száraz, meleg szél'] },
  { id: 'ozonreteg', title: 'Az ózonréteg elvékonyodása', group: 'Légkör', diagram: 'flow', topicNo: 3 },

  // Vízburok
  { id: 'viz-korforgasa', title: 'A víz körforgása', group: 'Vízburok', diagram: 'water-cycle', topicNo: 3, outline: ['Párolgás a tengerekből és a szárazföldről', 'Kicsapódás, felhőképződés', 'A szél a szárazföld fölé szállítja a nedvességet', 'Csapadék', 'Lefolyás és beszivárgás', 'A víz visszajut a tengerbe'] },
  { id: 'tengeraramlasok', title: 'A tengeráramlások kialakulása', group: 'Vízburok', diagram: 'flow', topicNo: 3 },
  { id: 'folyo-munkaja', title: 'A folyó munkája: bevágódás, oldalazás, feltöltés', group: 'Vízburok', diagram: 'river', topicNo: 4, outline: ['Felső szakasz: bevágódás, V alakú völgy', 'Középső szakasz: oldalazás, kanyarulatok', 'Alsó szakasz: feltöltés, zátonyok, holtágak', 'Torkolat: delta vagy tölcsértorkolat'] },
  { id: 'arviz', title: 'Az árvíz kialakulása és a védekezés', group: 'Vízburok', diagram: 'flow', topicNo: 3 },
  { id: 'karsztosodas', title: 'A karsztosodás: oldás és cseppkőképződés', group: 'Felszín és talaj', diagram: 'karst', topicNo: 4, outline: ['A csapadékvíz szén-dioxidot old: szénsavas víz', 'A szénsavas víz oldja a mészkövet (karr, töbör, víznyelő)', 'Barlangok, barlangi patakok alakulnak ki', 'Cseppkőképződés: a szén-dioxid távozik, a mész kiválik'] },
  { id: 'jeg-munkaja', title: 'A jég munkája: a gleccser', group: 'Felszín és talaj', diagram: 'flow', topicNo: 4 },
  { id: 'to-feltoltodese', title: 'A tó feltöltődése és az eutrofizáció', group: 'Vízburok', diagram: 'flow', topicNo: 3 },
  { id: 'tenger-munkaja', title: 'A tenger munkája: pusztuló és épülő part', group: 'Felszín és talaj', diagram: 'flow', topicNo: 4 },

  // Felszín és talaj
  { id: 'aprozodas-malas', title: 'Aprózódás és mállás', group: 'Felszín és talaj', diagram: 'flow', topicNo: 4 },
  { id: 'szel-munkaja', title: 'A szél felszínformálása', group: 'Felszín és talaj', diagram: 'flow', topicNo: 4 },
  { id: 'talajkepzodes', title: 'A talajképződés', group: 'Felszín és talaj', diagram: 'soil', topicNo: 4, outline: ['Anyakőzet (C-szint): aprózódás, mállás', 'Élőlények megtelepedése, szerves anyag', 'Humuszképződés (A-szint)', 'Kilúgozás és felhalmozódás (B-szint)', 'Érett talajszelvény'] },
  { id: 'talajpusztulas-sivatagosodas', title: 'Talajpusztulás és elsivatagosodás', group: 'Felszín és talaj', diagram: 'flow', topicNo: 4 },

  // Társadalom és gazdaság
  { id: 'demografiai-atmenet', title: 'A demográfiai (népesedési) átmenet', group: 'Társadalom és gazdaság', diagram: 'demographic', topicNo: 5, outline: ['1. szakasz: magas születési és halálozási arány', '2. szakasz: a halálozás csökken – népességrobbanás', '3. szakasz: a születések száma is csökkenni kezd', '4. szakasz: alacsony születés és halálozás', '5. szakasz: népességfogyás, öregedés'] },
  { id: 'varosodas-szakaszai', title: 'A városfejlődés szakaszai', group: 'Társadalom és gazdaság', diagram: 'urbanization', topicNo: 5, outline: ['Urbanizáció: a népesség a városokba áramlik', 'Szuburbanizáció: kiköltözés az elővárosokba', 'Dezurbanizáció: a nagyvárosok népessége csökken', 'Reurbanizáció: visszaáramlás a megújuló belvárosokba'] },
  { id: 'globalizacio', title: 'A globalizáció és a termelés áttelepülése', group: 'Társadalom és gazdaság', diagram: 'flow', topicNo: 6 },
  { id: 'telephelyvalasztas', title: 'A telephelyválasztás tényezői', group: 'Társadalom és gazdaság', diagram: 'flow', topicNo: 6 },
  { id: 'toke-aramlasa', title: 'A pénz és a tőke áramlása', group: 'Társadalom és gazdaság', diagram: 'flow', topicNo: 6 },
  { id: 'savas-eso', title: 'A savas eső', group: 'Társadalom és gazdaság', diagram: 'flow', topicNo: 3 },
  { id: 'globalis-felmelegedes', title: 'A globális felmelegedés visszacsatolásai', group: 'Társadalom és gazdaság', diagram: 'flow', topicNo: 10 },
];

/** Diagrams a learning card may show (rendered by src/components/diagrams). */
export const DIAGRAMS: Record<string, string> = {
  seasons: 'A Föld keringése és a tengelyferdeség, az évszakok',
  daylength: 'Megvilágítás a napfordulókon és nap-éj egyenlőségkor',
  'moon-phases': 'Holdfázisok',
  eclipse: 'Nap- és holdfogyatkozás',
  'time-zones': 'Időzónák és a dátumválasztó vonal',
  tides: 'Tengerjárás: szökőár és vakár',
  'solar-angle': 'A napsugarak hajlásszöge és a delelési magasság',
  'earth-layers': 'A Föld gömbhéjas szerkezete',
  'plate-boundaries': 'Lemezszegélyek keresztmetszetben',
  volcano: 'Vulkántípusok keresztmetszetben',
  hotspot: 'Forró pont és vulkánlánc',
  'rock-cycle': 'A kőzetanyag-körforgás',
  folds: 'Gyűrődés és vetődés (redők, rögök, árkok)',
  'atmosphere-layers': 'A légkör szerkezete és hőmérsékleti görbéje',
  greenhouse: 'A levegő felmelegedése és az üvegházhatás',
  cyclone: 'Ciklon és anticiklon',
  fronts: 'Meleg- és hidegfront keresztmetszete',
  circulation: 'Az általános légkörzés',
  monsoon: 'A monszun nyáron és télen',
  foehn: 'A főnszél kialakulása',
  'climate-chart': 'Éghajlati diagram (hőmérséklet és csapadék)',
  'water-cycle': 'A víz körforgása',
  river: 'A folyó szakaszjellegei és torkolattípusai',
  karst: 'Karsztformák keresztmetszetben',
  glacier: 'Gleccser és glaciális formák',
  soil: 'Talajszelvény (A-, B-, C-szint)',
  zonation: 'Függőleges övezetesség egy hegység lejtőjén',
  'contour-section': 'Szintvonalas térkép és keresztmetszete',
  projections: 'Sík-, henger- és kúpvetület',
  demographic: 'A demográfiai átmenet modellje',
  'age-pyramid': 'Korfák: fiatalodó, stagnáló, öregedő társadalom',
  urbanization: 'A városfejlődés szakaszai',
  'city-zones': 'A város övezetei',
  'economic-sectors': 'A gazdasági szektorok arányának változása',
  integration: 'Az integráció szintjei',
};

/** Icons the generic 'flow' process diagram can show (lucide names). */
export const FLOW_ICONS = [
  'sun', 'cloud', 'cloud-rain', 'droplet', 'droplets', 'waves', 'wind', 'snowflake', 'thermometer', 'flame', 'mountain', 'mountain-snow',
  'layers', 'gem', 'pickaxe', 'factory', 'fuel', 'zap', 'leaf', 'trees', 'sprout', 'tractor', 'wheat', 'fish', 'users', 'baby', 'building',
  'building-2', 'home', 'truck', 'ship', 'plane', 'coins', 'banknote', 'landmark', 'globe', 'arrow-down', 'arrow-up', 'arrow-right', 'shield',
  'alert-triangle', 'activity', 'recycle', 'trash-2', 'skull', 'heart-pulse',
] as const;
