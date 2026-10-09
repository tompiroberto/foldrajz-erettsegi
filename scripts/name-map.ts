// How each official topography item is found in the geo sources (brief §8.1).
// Items not listed here are matched automatically by category (see build-geo.ts):
//   Országok → NE countries, Városok/Települések → NE populated places,
//   Vízrajz / Tájak → NE marine, lakes, regions, elevation points by Hungarian name.
// Everything with `manual` is drawn in scripts/manual-geo/*.geojson.

export type GeoType = 'point' | 'line' | 'polygon';

export type Rule =
  | { src: 'country'; en: string | string[] }
  | { src: 'place'; en: string | string[]; adm0?: string }
  | { src: 'river'; en: string | string[]; bbox?: Bbox }
  | { src: 'lake'; en: string | string[] }
  | { src: 'marine'; en: string | string[] }
  | { src: 'region'; en: string | string[]; cls?: string }
  | { src: 'point'; en: string | string[] }
  | { src: 'elevation'; en: string | string[] }
  | { src: 'island'; en: string | string[] }
  | { src: 'admin1'; en: string | string[]; adm0: string }
  | { src: 'plates'; codes: string[] }
  | { src: 'countries'; en: string[] }
  | { src: 'county'; name: string }
  | { src: 'counties'; names: string[]; withBudapest?: boolean }
  | { src: 'parallel'; lat: number }
  | { src: 'meridian'; lon: number }
  | { src: 'pole'; lat: 90 | -90 }
  | { src: 'manual'; type: GeoType };

export type Bbox = [number, number, number, number]; // west, south, east, north

export interface MapEntry {
  en: string;
  rule: Rule;
}

const m = (type: GeoType): Rule => ({ src: 'manual', type });

// Countries that make up the continent parts and other unions (Natural Earth ADMIN names).
const N_AFRICA = ['Morocco', 'Algeria', 'Tunisia', 'Libya', 'Egypt', 'Western Sahara'];
const AFRICA_ALL_EXCEPT_N = [
  'Mauritania', 'Mali', 'Niger', 'Chad', 'Sudan', 'South Sudan', 'Eritrea', 'Ethiopia', 'Djibouti', 'Somalia', 'Somaliland', 'Senegal', 'Gambia', 'Guinea-Bissau', 'Guinea', 'Sierra Leone', 'Liberia', 'Ivory Coast', 'Ghana', 'Togo', 'Benin', 'Burkina Faso', 'Nigeria', 'Cameroon', 'Central African Republic', 'Equatorial Guinea', 'Gabon', 'Republic of the Congo', 'Democratic Republic of the Congo', 'Uganda', 'Kenya', 'Rwanda', 'Burundi', 'United Republic of Tanzania', 'Angola', 'Zambia', 'Malawi', 'Mozambique', 'Zimbabwe', 'Namibia', 'Botswana', 'South Africa', 'Lesotho', 'eSwatini', 'Madagascar', 'Comoros', 'Mauritius', 'Seychelles', 'Cabo Verde', 'São Tomé and Principe',
];
const LATIN_AMERICA = [
  'Mexico', 'Guatemala', 'Belize', 'Honduras', 'El Salvador', 'Nicaragua', 'Costa Rica', 'Panama', 'Cuba', 'Haiti', 'Dominican Republic', 'Puerto Rico', 'Colombia', 'Venezuela', 'Ecuador', 'Peru', 'Bolivia', 'Brazil', 'Paraguay', 'Uruguay', 'Argentina', 'Chile', 'French Guiana',
];
const CENTRAL_AMERICA = ['Mexico', 'Guatemala', 'Belize', 'Honduras', 'El Salvador', 'Nicaragua', 'Costa Rica', 'Panama'];

export const NAME_MAP: Record<string, MapEntry> = {
  // ---------------- Föld ----------------
  'fold--foldrajzi-fokhalozat--bakterito': { en: 'Tropic of Capricorn', rule: { src: 'parallel', lat: -23.44 } },
  'fold--foldrajzi-fokhalozat--rakterito': { en: 'Tropic of Cancer', rule: { src: 'parallel', lat: 23.44 } },
  'fold--foldrajzi-fokhalozat--egyenlito': { en: 'Equator', rule: { src: 'parallel', lat: 0 } },
  'fold--foldrajzi-fokhalozat--eszaki-sarkkor': { en: 'Arctic Circle', rule: { src: 'parallel', lat: 66.56 } },
  'fold--foldrajzi-fokhalozat--deli-sarkkor': { en: 'Antarctic Circle', rule: { src: 'parallel', lat: -66.56 } },
  'fold--foldrajzi-fokhalozat--kezdo-hosszusagi-kor-greenwichi-delkor': { en: 'Prime Meridian', rule: { src: 'meridian', lon: 0 } },
  'fold--foldrajzi-fokhalozat--eszaki-sark': { en: 'North Pole', rule: { src: 'pole', lat: 90 } },
  'fold--foldrajzi-fokhalozat--deli-sark': { en: 'South Pole', rule: { src: 'pole', lat: -90 } },

  'fold--foldreszek--afrika': { en: 'Africa', rule: { src: 'region', en: 'AFRICA', cls: 'Continent' } },
  'fold--foldreszek--amerika': { en: 'Americas', rule: { src: 'region', en: ['NORTH AMERICA', 'SOUTH AMERICA'], cls: 'Continent' } },
  'fold--foldreszek--antarktika': { en: 'Antarctica', rule: { src: 'region', en: 'ANTARCTICA', cls: 'Continent' } },
  'fold--foldreszek--ausztralia': { en: 'Australia', rule: { src: 'region', en: 'AUSTRALIA', cls: 'Continent' } },
  'fold--foldreszek--azsia': { en: 'Asia', rule: { src: 'region', en: 'ASIA', cls: 'Continent' } },
  'fold--foldreszek--europa': { en: 'Europe', rule: { src: 'region', en: 'EUROPE', cls: 'Continent' } },
  'fold--foldreszek--eurazsia': { en: 'Eurasia', rule: { src: 'region', en: ['EUROPE', 'ASIA'], cls: 'Continent' } },

  'fold--oceanok--atlanti-ocean': { en: 'Atlantic Ocean', rule: { src: 'marine', en: ['North Atlantic Ocean', 'South Atlantic Ocean'] } },
  'fold--oceanok--csendes-ocean': { en: 'Pacific Ocean', rule: { src: 'marine', en: ['North Pacific Ocean', 'South Pacific Ocean'] } },
  'fold--oceanok--deli-ocean': { en: 'Southern Ocean', rule: { src: 'marine', en: 'SOUTHERN OCEAN' } },
  'fold--oceanok--indiai-ocean': { en: 'Indian Ocean', rule: { src: 'marine', en: 'INDIAN OCEAN' } },
  'fold--oceanok--jeges-ocean-jeges-tenger': { en: 'Arctic Ocean', rule: { src: 'marine', en: 'Arctic Ocean' } },

  // PB2002 plate codes; microplates are merged into the major plate taught in Hungarian textbooks.
  'fold--kozetlemezek--afrikai-lemez': { en: 'African Plate', rule: { src: 'plates', codes: ['AF', 'SO'] } },
  'fold--kozetlemezek--antarktiszi-lemez': { en: 'Antarctic Plate', rule: { src: 'plates', codes: ['AN'] } },
  'fold--kozetlemezek--arab-lemez': { en: 'Arabian Plate', rule: { src: 'plates', codes: ['AR'] } },
  'fold--kozetlemezek--ausztral-indiai-lemez': { en: 'Indo-Australian Plate', rule: { src: 'plates', codes: ['IN', 'AU'] } },
  'fold--kozetlemezek--csendes-oceani-lemez': { en: 'Pacific Plate', rule: { src: 'plates', codes: ['PA'] } },
  'fold--kozetlemezek--del-amerikai-lemez': { en: 'South American Plate', rule: { src: 'plates', codes: ['SA'] } },
  'fold--kozetlemezek--eszak-amerikai-lemez': { en: 'North American Plate', rule: { src: 'plates', codes: ['NA', 'OK'] } },
  'fold--kozetlemezek--eurazsiai-lemez': { en: 'Eurasian Plate', rule: { src: 'plates', codes: ['EU', 'AM', 'YA', 'ON', 'AT', 'AS'] } },
  'fold--kozetlemezek--fulop-lemez-filippino-lemez': { en: 'Philippine Sea Plate', rule: { src: 'plates', codes: ['PS'] } },
  'fold--kozetlemezek--nazca-lemez': { en: 'Nazca Plate', rule: { src: 'plates', codes: ['NZ'] } },

  'fold--nagyszerkezeti-egysegek--afrikai-osfold': { en: 'African Shield', rule: m('polygon') },
  'fold--nagyszerkezeti-egysegek--angara-osfold': { en: 'Angara Shield (Siberian Craton)', rule: m('polygon') },
  'fold--nagyszerkezeti-egysegek--antarktiszi-osfold': { en: 'East Antarctic Shield', rule: m('polygon') },
  'fold--nagyszerkezeti-egysegek--arab-osfold': { en: 'Arabian Shield', rule: m('polygon') },
  'fold--nagyszerkezeti-egysegek--balti-osfold': { en: 'Baltic Shield', rule: m('polygon') },
  'fold--nagyszerkezeti-egysegek--brazil-osfold': { en: 'Brazilian Shield', rule: m('polygon') },
  'fold--nagyszerkezeti-egysegek--dekkan-osfold': { en: 'Deccan (Indian) Shield', rule: m('polygon') },
  'fold--nagyszerkezeti-egysegek--guyanai-osfold': { en: 'Guiana Shield', rule: m('polygon') },
  'fold--nagyszerkezeti-egysegek--kanadai-osfold': { en: 'Canadian Shield', rule: m('polygon') },
  'fold--nagyszerkezeti-egysegek--kinai-osfold': { en: 'Chinese (Sino-Korean) Craton', rule: m('polygon') },
  'fold--nagyszerkezeti-egysegek--nyugat-ausztraliai-osfold': { en: 'Western Australian Shield', rule: m('polygon') },
  'fold--nagyszerkezeti-egysegek--eurazsiai-hegysegrendszer': { en: 'Alpide belt', rule: m('polygon') },
  'fold--nagyszerkezeti-egysegek--kaledoniai-hegysegrendszer': { en: 'Caledonian orogen', rule: m('polygon') },
  'fold--nagyszerkezeti-egysegek--pacifikus-hegysegrendszer': { en: 'Circum-Pacific belt', rule: m('polygon') },
  'fold--nagyszerkezeti-egysegek--variszkuszi-hegysegrendszer': { en: 'Variscan orogen', rule: m('polygon') },
  'fold--nagyszerkezeti-egysegek--japan-arok': { en: 'Japan Trench', rule: m('line') },
  'fold--nagyszerkezeti-egysegek--mariana-arok': { en: 'Mariana Trench', rule: m('line') },

  'fold--tengeraramlasok--eszak-atlanti-aramlas': { en: 'North Atlantic Current', rule: m('line') },
  'fold--tengeraramlasok--golf-aramlas': { en: 'Gulf Stream', rule: m('line') },
  'fold--tengeraramlasok--kanari-aramlas': { en: 'Canary Current', rule: m('line') },
  'fold--tengeraramlasok--labrador-aramlas': { en: 'Labrador Current', rule: m('line') },
  'fold--tengeraramlasok--nyugati-szel-aramlas': { en: 'Antarctic Circumpolar (West Wind Drift) Current', rule: m('line') },
  'fold--tengeraramlasok--benguela-aramlas': { en: 'Benguela Current', rule: m('line') },
  'fold--tengeraramlasok--braziliai-aramlas': { en: 'Brazil Current', rule: m('line') },
  'fold--tengeraramlasok--del-egyenlitoi-aramlas': { en: 'South Equatorial Current', rule: m('line') },
  'fold--tengeraramlasok--eszak-egyenlitoi-aramlas': { en: 'North Equatorial Current', rule: m('line') },
  'fold--tengeraramlasok--humboldt-aramlas': { en: 'Humboldt (Peru) Current', rule: m('line') },
  'fold--tengeraramlasok--kuro-shio-aramlas': { en: 'Kuroshio Current', rule: m('line') },
  'fold--tengeraramlasok--oja-shio-aramlas': { en: 'Oyashio Current', rule: m('line') },

  'fold--egyeb--deli-sarkvidek-antarktisz': { en: 'Antarctic (south of 60°S)', rule: m('polygon') },
  'fold--egyeb--eszaki-sarkvidek-arktisz': { en: 'Arctic (north of the Arctic Circle)', rule: m('polygon') },

  // ---------------- Afrika ----------------
  'afrika--a-foldresz-reszei--eszak-afrika': { en: 'North Africa', rule: { src: 'countries', en: N_AFRICA } },
  'afrika--a-foldresz-reszei--tropusi-afrika-szubszaharai-afrika': { en: 'Sub-Saharan Africa', rule: { src: 'countries', en: AFRICA_ALL_EXCEPT_N } },
  'afrika--tajak--afrikai-arokrendszer': { en: 'East African Rift', rule: m('line') },
  'afrika--tajak--atlasz': { en: 'Atlas Mountains', rule: { src: 'region', en: 'ATLAS MOUNTAINS' } },
  'afrika--tajak--del-afrikai-magasfold': { en: 'South African Plateau', rule: m('polygon') },
  'afrika--tajak--etiop-magasfold': { en: 'Ethiopian Highlands', rule: { src: 'region', en: 'ETHIOPIAN HIGHLANDS' } },
  'afrika--tajak--kelet-afrikai-magasfold': { en: 'East African Plateau', rule: m('polygon') },
  'afrika--tajak--kilimandzsaro-kilimandzsaro-csoport': { en: 'Kilimanjaro', rule: { src: 'elevation', en: 'Mount Kilimanjaro' } },
  'afrika--tajak--kongo-medence': { en: 'Congo Basin', rule: { src: 'region', en: 'CONGO BASIN' } },
  'afrika--tajak--madagaszkar': { en: 'Madagascar', rule: { src: 'region', en: 'MADAGASCAR', cls: 'Island' } },
  'afrika--tajak--szahara': { en: 'Sahara', rule: { src: 'region', en: 'SAHARA' } },
  'afrika--tajak--szudan': { en: 'Sudan (savanna belt)', rule: m('polygon') },
  'afrika--tajak--szahel-szahel-ov': { en: 'Sahel', rule: m('polygon') },
  'afrika--tajak--kalahari-medence': { en: 'Kalahari Basin', rule: { src: 'region', en: ['KALAHARI DESERT', 'Kalahari Desert'] } },
  'afrika--tajak--kanari-szigetek': { en: 'Canary Islands', rule: { src: 'region', en: 'ISLAS CANARIAS' } },
  'afrika--tajak--namib-sivatag': { en: 'Namib Desert', rule: { src: 'region', en: 'NAMIB DESERT' } },
  'afrika--tajak--teleki-vulkan': { en: 'Teleki volcano', rule: m('point') },
  'afrika--vizrajz--gibraltari-szoros': { en: 'Strait of Gibraltar', rule: { src: 'marine', en: 'Strait of Gibraltar' } },
  'afrika--vizrajz--guineai-obol': { en: 'Gulf of Guinea', rule: { src: 'marine', en: 'Gulf of Guinea' } },
  'afrika--vizrajz--kongo': { en: 'Congo River', rule: { src: 'river', en: 'Congo', bbox: [10, -10, 35, 6] } },
  'afrika--vizrajz--nilus': { en: 'Nile', rule: { src: 'river', en: ['Nile', 'Bahr el Jebel', 'Albert Nile', 'Victoria Nile'], bbox: [24, -4, 40, 32] } },
  'afrika--vizrajz--szuezi-csatorna': { en: 'Suez Canal', rule: m('line') },
  'afrika--vizrajz--tanganyika-to': { en: 'Lake Tanganyika', rule: { src: 'lake', en: 'Lake Tanganyika' } },
  'afrika--vizrajz--viktoria-to': { en: 'Lake Victoria', rule: { src: 'lake', en: 'Lake Victoria' } },
  'afrika--vizrajz--voros-tenger': { en: 'Red Sea', rule: { src: 'marine', en: 'Red Sea' } },
  'afrika--vizrajz--asszuani-gat-asszuani-nagy-gat': { en: 'Aswan High Dam', rule: m('point') },
  'afrika--vizrajz--csad-to': { en: 'Lake Chad', rule: { src: 'lake', en: 'Lake Chad' } },
  'afrika--vizrajz--niger': { en: 'Niger River', rule: { src: 'river', en: 'Niger', bbox: [-12, 3, 10, 18] } },
  'afrika--vizrajz--zambezi': { en: 'Zambezi', rule: { src: 'river', en: 'Zambezi', bbox: [20, -20, 37, -10] } },
  'afrika--orszagok--del-afrikai-koztarsasag': { en: 'South Africa', rule: { src: 'country', en: 'South Africa' } },
  'afrika--varosok--alexandria': { en: 'Alexandria', rule: { src: 'place', en: 'Alexandria', adm0: 'Egypt' } },
  'afrika--varosok--kairo': { en: 'Cairo', rule: { src: 'place', en: 'Cairo', adm0: 'Egypt' } },
  'afrika--varosok--fokvaros': { en: 'Cape Town', rule: { src: 'place', en: 'Cape Town' } },

  // ---------------- Amerika ----------------
  'amerika--a-foldresz-reszei--eszak-amerika': { en: 'North America', rule: { src: 'region', en: 'NORTH AMERICA', cls: 'Continent' } },
  'amerika--a-foldresz-reszei--del-amerika': { en: 'South America', rule: { src: 'region', en: 'SOUTH AMERICA', cls: 'Continent' } },
  'amerika--a-foldresz-reszei--kozep-amerika': { en: 'Central America', rule: { src: 'countries', en: CENTRAL_AMERICA } },
  'amerika--a-foldresz-reszei--latin-amerika': { en: 'Latin America', rule: { src: 'countries', en: LATIN_AMERICA } },
  'amerika--tajak--alaszka': { en: 'Alaska', rule: { src: 'admin1', en: 'Alaska', adm0: 'USA' } },
  'amerika--tajak--amazonas-medence': { en: 'Amazon Basin', rule: { src: 'region', en: 'AMAZON BASIN' } },
  'amerika--tajak--andok': { en: 'Andes', rule: { src: 'region', en: 'ANDES' } },
  'amerika--tajak--antillak': { en: 'Antilles', rule: { src: 'region', en: ['GREATER ANTILLES', 'LESSER ANTILLES', 'Greater Antilles', 'Lesser Antilles'] } },
  'amerika--tajak--appalache-hegyseg-appalache': { en: 'Appalachian Mountains', rule: { src: 'region', en: 'APPALACHIAN MTS.' } },
  'amerika--tajak--brazil-felfold': { en: 'Brazilian Highlands', rule: { src: 'region', en: 'BRAZILIAN HIGHLANDS' } },
  'amerika--tajak--floridai-felsziget': { en: 'Florida Peninsula', rule: { src: 'region', en: ['FLORIDA PEN.', 'Florida Peninsula', 'FLORIDA'] } },
  'amerika--tajak--gronland': { en: 'Greenland', rule: { src: 'region', en: 'GREENLAND', cls: 'Island' } },
  'amerika--tajak--guyanai-hegyvidek': { en: 'Guiana Highlands', rule: { src: 'region', en: ['GUIANA HIGHLANDS', 'Guiana Highlands'] } },
  'amerika--tajak--hawaii-szigetek': { en: 'Hawaiian Islands', rule: { src: 'region', en: 'HAWAIIAN ISLANDS' } },
  'amerika--tajak--kaliforniai-felsziget': { en: 'Baja California', rule: { src: 'region', en: 'BAJA CALIFORNIA' } },
  'amerika--tajak--kordillerak': { en: 'North American Cordillera', rule: m('polygon') },
  'amerika--tajak--labrador-felsziget': { en: 'Labrador Peninsula', rule: { src: 'region', en: 'LABRADOR' } },
  'amerika--tajak--mexikoi-fennsik': { en: 'Mexican Plateau', rule: { src: 'region', en: 'ALTI-PLANICIE MEXICANA' } },
  'amerika--tajak--mississippi-alfold': { en: 'Mississippi Lowland', rule: m('polygon') },
  'amerika--tajak--mount-st-helens': { en: 'Mount St. Helens', rule: m('point') },
  'amerika--tajak--parana-alfold': { en: 'Paraná Plains (Gran Chaco–Pampas)', rule: m('polygon') },
  'amerika--tajak--preri': { en: 'Prairies (Great Plains)', rule: { src: 'region', en: ['GREAT PLAINS', 'Great Plains'] } },
  'amerika--tajak--sziklas-hegyseg': { en: 'Rocky Mountains', rule: { src: 'region', en: 'ROCKY MOUNTAINS' } },
  'amerika--tajak--szilicium-volgy': { en: 'Silicon Valley', rule: m('point') },
  'amerika--tajak--atacama-sivatag': { en: 'Atacama Desert', rule: { src: 'region', en: 'DESIERTO DE ATACAMA' } },
  'amerika--tajak--bahama-szigetek': { en: 'Bahamas', rule: { src: 'region', en: 'BAHAMA ISLANDS' } },
  'amerika--tajak--orinoco-medence': { en: 'Orinoco Basin (Llanos)', rule: { src: 'region', en: ['LLANOS', 'Llanos'] } },
  'amerika--tajak--popocatepetl': { en: 'Popocatépetl', rule: { src: 'elevation', en: 'Volcán Popocatépetl' } },
  'amerika--tajak--yellowstone-nemzeti-park': { en: 'Yellowstone National Park', rule: m('polygon') },
  'amerika--vizrajz--amazonas': { en: 'Amazon River', rule: { src: 'river', en: 'Amazonas', bbox: [-80, -12, -48, 2] } },
  'amerika--vizrajz--colorado': { en: 'Colorado River (US)', rule: { src: 'river', en: 'Colorado', bbox: [-118, 30, -104, 42] } },
  'amerika--vizrajz--karib-antilla-tenger': { en: 'Caribbean Sea', rule: { src: 'marine', en: 'Caribbean Sea' } },
  'amerika--vizrajz--mexikoi-obol': { en: 'Gulf of Mexico', rule: { src: 'marine', en: 'Gulf of Mexico' } },
  'amerika--vizrajz--mississippi': { en: 'Mississippi River', rule: { src: 'river', en: 'Mississippi', bbox: [-97, 28, -88, 48] } },
  'amerika--vizrajz--nagy-tavak-erie-felso-huron-michigan-ontario-to': { en: 'Great Lakes', rule: { src: 'lake', en: ['Lake Erie', 'Lake Superior', 'Lake Huron', 'Lake Michigan', 'Lake Ontario'] } },
  'amerika--vizrajz--niagara-vizeses': { en: 'Niagara Falls', rule: { src: 'point', en: 'Niagara Falls' } },
  'amerika--vizrajz--panama-csatorna': { en: 'Panama Canal', rule: m('line') },
  'amerika--vizrajz--parana': { en: 'Paraná River', rule: { src: 'river', en: 'Paraná', bbox: [-62, -35, -44, -15] } },
  'amerika--vizrajz--szent-lorinc-folyo': { en: 'Saint Lawrence River', rule: m('line') },
  'amerika--vizrajz--hudson-obol': { en: 'Hudson Bay', rule: { src: 'marine', en: 'Hudson Bay' } },
  'amerika--vizrajz--itaipu-gat': { en: 'Itaipu Dam', rule: m('point') },
  'amerika--vizrajz--krater-to': { en: 'Crater Lake (Oregon)', rule: m('point') },
  'amerika--vizrajz--la-plata': { en: 'Río de la Plata', rule: { src: 'marine', en: ['Río de la Plata', 'Rio de la Plata'] } },
  'amerika--vizrajz--orinoco': { en: 'Orinoco', rule: { src: 'river', en: 'Orinoco', bbox: [-72, 2, -60, 10] } },
  'amerika--orszagok--amerikai-egyesult-allamok': { en: 'United States of America', rule: { src: 'country', en: 'United States of America' } },
  'amerika--orszagok--dominikai-koztarsasag': { en: 'Dominican Republic', rule: { src: 'country', en: 'Dominican Republic' } },
  'amerika--varosok--santiago': { en: 'Santiago (Chile)', rule: { src: 'place', en: 'Santiago', adm0: 'Chile' } },
  'amerika--varosok--washington': { en: 'Washington, D.C.', rule: { src: 'place', en: 'Washington, D.C.' } },
  'amerika--varosok--los-angeles': { en: 'Los Angeles', rule: { src: 'place', en: 'Los Angeles', adm0: 'United States of America' } },
  'amerika--varosok--san-francisco': { en: 'San Francisco', rule: { src: 'place', en: 'San Francisco', adm0: 'United States of America' } },
  'amerika--varosok--vancouver': { en: 'Vancouver', rule: { src: 'place', en: 'Vancouver', adm0: 'Canada' } },

  // ---------------- Ausztrália és Óceánia ----------------
  'ausztralia-es-oceania--tajak--ausztraliai-alfold': { en: 'Central Australian Lowlands', rule: m('polygon') },
  'ausztralia-es-oceania--tajak--nagy-korallzatony': { en: 'Great Barrier Reef', rule: { src: 'marine', en: 'Great Barrier Reef' } },
  'ausztralia-es-oceania--tajak--tasmania': { en: 'Tasmania', rule: { src: 'region', en: 'TASMANIA' } },
  'ausztralia-es-oceania--vizrajz--murray': { en: 'Murray River', rule: { src: 'river', en: 'Murray', bbox: [138, -38, 149, -33] } },
  'ausztralia-es-oceania--orszagok--ausztralia': { en: 'Australia', rule: { src: 'country', en: 'Australia' } },

  // ---------------- Ázsia ----------------
  'azsia--a-foldresz-reszei--del-azsia': { en: 'South Asia', rule: { src: 'countries', en: ['India', 'Pakistan', 'Bangladesh', 'Nepal', 'Bhutan', 'Sri Lanka', 'Maldives'] } },
  'azsia--a-foldresz-reszei--delkelet-azsia': { en: 'Southeast Asia', rule: { src: 'countries', en: ['Myanmar', 'Thailand', 'Laos', 'Cambodia', 'Vietnam', 'Malaysia', 'Singapore', 'Indonesia', 'Brunei', 'Philippines', 'Timor-Leste'] } },
  'azsia--a-foldresz-reszei--delnyugat-azsia': { en: 'Southwest Asia', rule: { src: 'countries', en: ['Turkey', 'Syria', 'Lebanon', 'Israel', 'Palestine', 'Jordan', 'Iraq', 'Iran', 'Saudi Arabia', 'Kuwait', 'Bahrain', 'Qatar', 'United Arab Emirates', 'Oman', 'Yemen', 'Georgia', 'Armenia', 'Azerbaijan', 'Afghanistan', 'Cyprus', 'Northern Cyprus'] } },
  'azsia--a-foldresz-reszei--eszak-azsia': { en: 'North Asia (Siberia)', rule: m('polygon') },
  'azsia--a-foldresz-reszei--kelet-azsia': { en: 'East Asia', rule: { src: 'countries', en: ['China', 'Mongolia', 'North Korea', 'South Korea', 'Japan', 'Taiwan', 'Hong Kong', 'Macao'] } },
  'azsia--a-foldresz-reszei--kozep-azsia': { en: 'Central Asia', rule: { src: 'countries', en: ['Kazakhstan', 'Uzbekistan', 'Turkmenistan', 'Kyrgyzstan', 'Tajikistan'] } },
  'azsia--a-foldresz-reszei--belso-azsia': { en: 'Inner Asia', rule: m('polygon') },
  'azsia--a-foldresz-reszei--kozel-kelet': { en: 'Near East', rule: { src: 'countries', en: ['Israel', 'Palestine', 'Lebanon', 'Syria', 'Jordan', 'Iraq', 'Turkey', 'Cyprus', 'Egypt', 'Saudi Arabia', 'Kuwait'] } },
  'azsia--tajak--csomolungma-mt-everest': { en: 'Mount Everest', rule: { src: 'elevation', en: 'Mount Everest' } },
  'azsia--tajak--del-kinai-hegyvidek': { en: 'South China Hills', rule: m('polygon') },
  'azsia--tajak--fuji-fudzsi': { en: 'Mount Fuji', rule: { src: 'elevation', en: 'Fuji' } },
  'azsia--tajak--fulop-szigetek': { en: 'Philippine Islands', rule: { src: 'region', en: 'PHILIPPINES', cls: 'Island group' } },
  'azsia--tajak--hindusztani-alfold': { en: 'Indo-Gangetic Plain', rule: { src: 'region', en: ['INDO-GANGETIC PLAIN', 'Indo-Gangetic Plain', 'GANGETIC PLAIN'] } },
  'azsia--tajak--hindusztani-felsziget': { en: 'Indian subcontinent', rule: { src: 'region', en: 'INDIA', cls: 'Pen/cape' } },
  'azsia--tajak--indonez-szigetvilag': { en: 'Malay Archipelago', rule: { src: 'region', en: ['MALAY ARCHIPELAGO', 'Malay Archipelago', 'EAST INDIES'] } },
  'azsia--tajak--japan-szigetek': { en: 'Japanese archipelago', rule: { src: 'region', en: 'JAPAN', cls: 'Island group' } },
  'azsia--tajak--kamcsatka-felsziget': { en: 'Kamchatka Peninsula', rule: { src: 'region', en: ['KAMCHATKA', 'Kamchatka Peninsula', 'KAMCHATKA PEN.'] } },
  'azsia--tajak--kinai-alfold': { en: 'North China Plain', rule: { src: 'region', en: ['NORTH CHINA PLAIN', 'North China Plain'] } },
  'azsia--tajak--kis-azsia': { en: 'Asia Minor (Anatolia)', rule: { src: 'region', en: ['ANATOLIA', 'Anatolia', 'ASIA MINOR'] } },
  'azsia--tajak--koreai-felsziget': { en: 'Korean Peninsula', rule: { src: 'region', en: 'KOREA', cls: 'Pen/cape' } },
  'azsia--tajak--pamir': { en: 'Pamir Mountains', rule: { src: 'region', en: 'PAMIRS' } },
  'azsia--tajak--tibet': { en: 'Tibetan Plateau', rule: { src: 'region', en: ['PLATEAU OF TIBET', 'TIBETAN PLATEAU', 'Tibetan Plateau', 'Plateau of Tibet'] } },
  'azsia--tajak--irani-felfold': { en: 'Iranian Plateau', rule: m('polygon') },
  'azsia--tajak--krakatau': { en: 'Krakatoa', rule: { src: 'elevation', en: 'Krakatau' } },
  'azsia--vizrajz--aral-to': { en: 'Aral Sea', rule: { src: 'lake', en: ['South Aral Sea', 'North Aral Sea'] } },
  'azsia--vizrajz--bering-szoros': { en: 'Bering Strait', rule: m('point') },
  'azsia--vizrajz--eufratesz': { en: 'Euphrates', rule: { src: 'river', en: ['Euphrates', 'Firat', 'Al Furat'], bbox: [36, 29, 48, 40] } },
  'azsia--vizrajz--gangesz': { en: 'Ganges', rule: { src: 'river', en: 'Ganges', bbox: [77, 21, 92, 31] } },
  'azsia--vizrajz--indus': { en: 'Indus', rule: { src: 'river', en: 'Indus', bbox: [66, 23, 82, 37] } },
  'azsia--vizrajz--jangce': { en: 'Yangtze', rule: { src: 'river', en: ['Chang Jiang', 'Yangtze'], bbox: [90, 24, 122, 35] } },
  'azsia--vizrajz--jenyiszej': { en: 'Yenisei', rule: { src: 'river', en: 'Yenisey', bbox: [85, 48, 95, 74] } },
  'azsia--vizrajz--lena': { en: 'Lena', rule: { src: 'river', en: 'Lena', bbox: [103, 52, 132, 74] } },
  'azsia--vizrajz--ob': { en: 'Ob', rule: { src: 'river', en: 'Ob', bbox: [60, 50, 90, 68] } },
  'azsia--vizrajz--sarga-folyo': { en: 'Yellow River', rule: { src: 'river', en: 'Huang', bbox: [95, 32, 120, 42] } },
  'azsia--vizrajz--tigris': { en: 'Tigris', rule: { src: 'river', en: 'Tigris', bbox: [38, 29, 48, 39] } },
  'azsia--vizrajz--harom-szurdok-gat': { en: 'Three Gorges Dam', rule: m('point') },
  'azsia--vizrajz--brahmaputra': { en: 'Brahmaputra', rule: { src: 'river', en: ['Brahmaputra', 'Yarlung'], bbox: [82, 22, 97, 31] } },
  'azsia--vizrajz--mekong': { en: 'Mekong', rule: { src: 'river', en: ['Mekong', 'Lancang'], bbox: [94, 8, 108, 34] } },
  'azsia--varosok--ujdelhi': { en: 'New Delhi', rule: { src: 'place', en: ['New Delhi', 'Delhi'], adm0: 'India' } },
  'azsia--varosok--tel-aviv-jaffa': { en: 'Tel Aviv-Yafo', rule: { src: 'place', en: 'Tel Aviv' } },
  'azsia--varosok--hongkong': { en: 'Hong Kong', rule: { src: 'place', en: 'Hong Kong' } },
  'azsia--orszagok--fulop-szigetek': { en: 'Philippines', rule: { src: 'country', en: 'Philippines' } },
  'azsia--orszagok--india': { en: 'India', rule: { src: 'country', en: 'India' } },
  'azsia--orszagok--japan': { en: 'Japan', rule: { src: 'country', en: 'Japan' } },
  'azsia--orszagok--szingapur': { en: 'Singapore', rule: { src: 'country', en: 'Singapore' } },

  // ---------------- Európa ----------------
  'europa--a-foldresz-reszei--del-europa': { en: 'Southern Europe', rule: { src: 'countries', en: ['Portugal', 'Spain', 'Andorra', 'Italy', 'Malta', 'San Marino', 'Vatican', 'Greece', 'Slovenia', 'Croatia', 'Bosnia and Herzegovina', 'Serbia', 'Montenegro', 'Kosovo', 'North Macedonia', 'Albania', 'Bulgaria', 'Gibraltar'] } },
  'europa--a-foldresz-reszei--eszak-europa': { en: 'Northern Europe', rule: { src: 'countries', en: ['Iceland', 'Norway', 'Sweden', 'Finland', 'Denmark', 'Estonia', 'Latvia', 'Lithuania'] } },
  'europa--a-foldresz-reszei--kelet-europa': { en: 'Eastern Europe', rule: { src: 'countries', en: ['Belarus', 'Ukraine', 'Moldova'] } },
  'europa--a-foldresz-reszei--kelet-kozep-europa': { en: 'East-Central Europe', rule: { src: 'countries', en: ['Poland', 'Czechia', 'Slovakia', 'Hungary', 'Romania', 'Slovenia', 'Croatia'] } },
  'europa--a-foldresz-reszei--kozep-europa': { en: 'Central Europe', rule: { src: 'countries', en: ['Germany', 'Poland', 'Czechia', 'Slovakia', 'Hungary', 'Austria', 'Switzerland', 'Liechtenstein', 'Slovenia'] } },
  'europa--a-foldresz-reszei--nyugat-europa': { en: 'Western Europe', rule: { src: 'countries', en: ['United Kingdom', 'Ireland', 'France', 'Belgium', 'Netherlands', 'Luxembourg', 'Monaco'] } },
  'europa--tajak--appenninek': { en: 'Apennines', rule: { src: 'region', en: 'APPENNINI' } },
  'europa--tajak--appennini-felsziget': { en: 'Italian Peninsula', rule: m('polygon') },
  'europa--tajak--becsi-medence': { en: 'Vienna Basin', rule: m('polygon') },
  'europa--tajak--csallokoz': { en: 'Žitný ostrov (Rye Island)', rule: m('polygon') },
  'europa--tajak--cseh-medence': { en: 'Bohemian Basin', rule: m('polygon') },
  'europa--tajak--deli-karpatok': { en: 'Southern Carpathians', rule: { src: 'region', en: 'Transylvanian Alps' } },
  'europa--tajak--dinari-hegyseg': { en: 'Dinaric Alps', rule: { src: 'region', en: 'Dinaric Alps' } },
  'europa--tajak--erdelyi-medence': { en: 'Transylvanian Basin', rule: m('polygon') },
  'europa--tajak--erdelyi-szigethegyseg-erdelyi-kozephegyseg': { en: 'Apuseni Mountains', rule: m('polygon') },
  'europa--tajak--eszakkeleti-karpatok': { en: 'Northeastern (Eastern Outer) Carpathians', rule: m('polygon') },
  'europa--tajak--eszaknyugati-karpatok': { en: 'Western Carpathians', rule: m('polygon') },
  'europa--tajak--german-alfold': { en: 'North German Plain', rule: m('polygon') },
  'europa--tajak--hargita': { en: 'Harghita Mountains', rule: m('polygon') },
  'europa--tajak--holland-melyfold': { en: 'Low Countries lowland', rule: m('polygon') },
  'europa--tajak--izland': { en: 'Iceland', rule: { src: 'region', en: 'ICELAND', cls: 'Island' } },
  'europa--tajak--karpat-medence-pannon-medence': { en: 'Pannonian Basin', rule: { src: 'region', en: ['PANNONIAN BASIN', 'Pannonian Basin', 'Great Hungarian Plain'] } },
  'europa--tajak--karpatok': { en: 'Carpathian Mountains', rule: { src: 'region', en: 'CARPATHIAN MOUNTAINS' } },
  'europa--tajak--kelet-europai-siksag': { en: 'East European Plain', rule: m('polygon') },
  'europa--tajak--keleti-alpok': { en: 'Eastern Alps', rule: m('polygon') },
  'europa--tajak--keleti-karpatok': { en: 'Eastern Carpathians', rule: m('polygon') },
  'europa--tajak--kreta': { en: 'Crete', rule: { src: 'region', en: 'Crete' } },
  'europa--tajak--krim-felsziget': { en: 'Crimean Peninsula', rule: { src: 'region', en: ['CRIMEA', 'Crimea', 'Krym'] } },
  'europa--tajak--lengyel-alfold': { en: 'Polish (Central European) Lowland', rule: m('polygon') },
  'europa--tajak--lengyel-kozephegyseg': { en: 'Lesser Poland Upland', rule: m('polygon') },
  'europa--tajak--lengyel-tohatsag': { en: 'Masurian–Pomeranian Lakeland', rule: m('polygon') },
  'europa--tajak--londoni-medence': { en: 'London Basin', rule: m('polygon') },
  'europa--tajak--magas-tatra': { en: 'High Tatras', rule: m('polygon') },
  'europa--tajak--mont-blanc': { en: 'Mont Blanc', rule: { src: 'elevation', en: 'Mont Blanc' } },
  'europa--tajak--morva-medence': { en: 'Moravian Basin', rule: m('polygon') },
  'europa--tajak--nemet-kozephegyseg': { en: 'Central Uplands (Germany)', rule: m('polygon') },
  'europa--tajak--nyugati-alpok': { en: 'Western Alps', rule: m('polygon') },
  'europa--tajak--parizsi-medence': { en: 'Paris Basin', rule: m('polygon') },
  'europa--tajak--pennine-hegyseg-pennine': { en: 'Pennines', rule: m('polygon') },
  'europa--tajak--pireneusi-iberiai-felsziget': { en: 'Iberian Peninsula', rule: { src: 'region', en: ['IBERIAN PENINSULA', 'Iberian Peninsula', 'IBERIAN PEN.'] } },
  'europa--tajak--pireneusok': { en: 'Pyrenees', rule: { src: 'region', en: 'PYRENEES' } },
  'europa--tajak--po-alfold': { en: 'Po Valley', rule: m('polygon') },
  'europa--tajak--roman-alfold': { en: 'Wallachian (Romanian) Plain', rule: m('polygon') },
  'europa--tajak--skandinav-felsziget': { en: 'Scandinavian Peninsula', rule: { src: 'region', en: ['SCANDINAVIA', 'Scandinavian Peninsula', 'SCANDINAVIAN PEN.'] } },
  'europa--tajak--skandinav-hegyseg': { en: 'Scandinavian Mountains', rule: { src: 'region', en: 'KJØLEN MOUNTAINS' } },
  'europa--tajak--szicilia': { en: 'Sicily', rule: { src: 'region', en: 'Sicilia' } },
  'europa--tajak--szilezia': { en: 'Silesia', rule: m('polygon') },
  'europa--tajak--szudetak': { en: 'Sudetes', rule: { src: 'region', en: 'Sudetes Mts.' } },
  'europa--tajak--ural': { en: 'Ural Mountains', rule: { src: 'region', en: 'URAL MOUNTAINS' } },
  'europa--tajak--vezuv': { en: 'Vesuvius', rule: { src: 'elevation', en: ['Vesuvio', 'Vesuvius', 'Monte Vesuvio'] } },
  'europa--tajak--ardennek': { en: 'Ardennes', rule: { src: 'region', en: 'Ardennes' } },
  'europa--tajak--korzika': { en: 'Corsica', rule: { src: 'region', en: 'Corse' } },
  'europa--tajak--stromboli': { en: 'Stromboli', rule: m('point') },
  'europa--tajak--szardinia': { en: 'Sardinia', rule: { src: 'region', en: 'Sardegna' } },
  'europa--tajak--szent-gotthard-hago': { en: 'Gotthard Pass', rule: m('point') },
  'europa--tajak--vaskapu': { en: 'Iron Gates', rule: m('point') },
  'europa--tajak--vereckei-hago': { en: 'Verecke Pass', rule: m('point') },
  'europa--vizrajz--boden-to': { en: 'Lake Constance', rule: { src: 'lake', en: 'Bodensee' } },
  'europa--vizrajz--dnyeper': { en: 'Dnieper', rule: { src: 'river', en: ['Dnepr', 'Dnepre', 'Dnieper'], bbox: [27, 45, 37, 56] } },
  'europa--vizrajz--don': { en: 'Don', rule: { src: 'river', en: 'Don', bbox: [37, 46, 45, 54] } },
  'europa--vizrajz--duna': { en: 'Danube', rule: { src: 'river', en: ['Danube', 'Donau'], bbox: [8, 43, 30, 49] } },
  'europa--vizrajz--duna-majna-rajna-vizi-ut': { en: 'Rhine–Main–Danube Canal', rule: m('line') },
  'europa--vizrajz--elba': { en: 'Elbe', rule: { src: 'river', en: 'Elbe', bbox: [8, 49, 16, 54.5] } },
  'europa--vizrajz--garda-to': { en: 'Lake Garda', rule: { src: 'lake', en: 'Lago di Garda' } },
  'europa--vizrajz--genfi-to': { en: 'Lake Geneva', rule: { src: 'lake', en: 'Lake Geneva' } },
  'europa--vizrajz--gyilkos-to': { en: 'Lacul Roșu (Killer Lake)', rule: m('point') },
  'europa--vizrajz--la-manche': { en: 'English Channel', rule: { src: 'marine', en: 'English Channel' } },
  'europa--vizrajz--ladoga-to': { en: 'Lake Ladoga', rule: { src: 'lake', en: 'Lake Ladoga' } },
  'europa--vizrajz--odera': { en: 'Oder', rule: { src: 'river', en: ['Oder', 'Odra'], bbox: [13, 49, 19, 54.5] } },
  'europa--vizrajz--olt': { en: 'Olt', rule: { src: 'river', en: 'Olt', bbox: [23, 43, 27, 47] } },
  'europa--vizrajz--po': { en: 'Po', rule: { src: 'river', en: 'Po', bbox: [6.5, 44, 13, 46] } },
  'europa--vizrajz--rajna': { en: 'Rhine', rule: { src: 'river', en: ['Rhein', 'Rhine'], bbox: [3.5, 46, 11, 52.5] } },
  'europa--vizrajz--rh-ne': { en: 'Rhône', rule: { src: 'river', en: 'Rhône', bbox: [3.5, 43, 9, 47] } },
  'europa--vizrajz--szajna': { en: 'Seine', rule: { src: 'river', en: 'Seine', bbox: [-0.5, 47, 5.5, 50] } },
  'europa--vizrajz--szava': { en: 'Sava', rule: { src: 'river', en: 'Sava', bbox: [13.5, 44, 21, 47] } },
  'europa--vizrajz--szent-anna-to': { en: 'Lake Saint Anne', rule: m('point') },
  'europa--vizrajz--tajo-tejo': { en: 'Tagus', rule: { src: 'river', en: ['Tajo', 'Tejo'], bbox: [-10, 38, -1.5, 41.5] } },
  'europa--vizrajz--temze': { en: 'Thames', rule: { src: 'river', en: 'Thames', bbox: [-2.5, 51, 1.5, 52] } },
  'europa--vizrajz--ural-folyo': { en: 'Ural River', rule: { src: 'river', en: 'Ural', bbox: [50, 46, 62, 55] } },
  'europa--vizrajz--vag': { en: 'Váh', rule: { src: 'river', en: 'Váh', bbox: [17, 47.5, 20.5, 49.5] } },
  'europa--vizrajz--visztula': { en: 'Vistula', rule: { src: 'river', en: ['Vistula', 'Wisla'], bbox: [17, 49, 24, 55] } },
  'europa--vizrajz--volga': { en: 'Volga', rule: { src: 'river', en: 'Volga', bbox: [32, 45, 52, 58.5] } },
  'europa--vizrajz--ebro': { en: 'Ebro', rule: { src: 'river', en: 'Ebro', bbox: [-4.5, 40, 1.5, 43.5] } },
  'europa--vizrajz--ijssel-to': { en: 'IJsselmeer', rule: { src: 'lake', en: 'IJsselmeer' } },
  'europa--vizrajz--loire': { en: 'Loire', rule: { src: 'river', en: 'Loire', bbox: [-2.5, 44.5, 4.5, 48] } },
  'europa--vizrajz--ohridi-to': { en: 'Lake Ohrid', rule: m('polygon') },
  'europa--vizrajz--popradi-to': { en: 'Popradské pleso', rule: m('point') },
  'europa--orszagok--nagy-britannia-anglia-skocia-wales-es-eszak-irorszag-egyesult-kiralysaga': { en: 'United Kingdom', rule: { src: 'country', en: 'United Kingdom' } },
  'europa--orszagok--bosznia-hercegovina': { en: 'Bosnia and Herzegovina', rule: { src: 'country', en: 'Bosnia and Herzegovina' } },
  'europa--tajak--ciprus': { en: 'Cyprus (island)', rule: { src: 'region', en: 'Cyprus', cls: 'Island' } },
  'europa--tortenelmi-tajnevek--burgenland-orvidek': { en: 'Burgenland', rule: { src: 'admin1', en: 'Burgenland', adm0: 'AUT' } },
  'europa--tortenelmi-tajnevek--delvidek': { en: 'Délvidék (historical)', rule: m('polygon') },
  'europa--tortenelmi-tajnevek--erdely': { en: 'Transylvania', rule: m('polygon') },
  'europa--tortenelmi-tajnevek--felvidek': { en: 'Upper Hungary (southern Slovakia)', rule: m('polygon') },
  'europa--tortenelmi-tajnevek--karpatalja': { en: 'Zakarpattia', rule: { src: 'admin1', en: 'Transcarpathia', adm0: 'UKR' } },
  'europa--tortenelmi-tajnevek--muravidek': { en: 'Prekmurje', rule: m('polygon') },
  'europa--tortenelmi-tajnevek--partium': { en: 'Partium', rule: m('polygon') },
  'europa--tortenelmi-tajnevek--szekelyfold': { en: 'Székely Land', rule: { src: 'counties', names: [], withBudapest: false } },
  'europa--tortenelmi-tajnevek--vajdasag': { en: 'Vojvodina', rule: { src: 'admin1', en: ['Severno-Backi', 'Zapadno-Backi', 'Južno-Backi', 'Severno-Banatski', 'Srednje-Banatski', 'Južno-Banatski', 'Sremski'], adm0: 'SRB' } },
  'europa--iparvidekek--donyec-medence': { en: 'Donbas', rule: m('polygon') },
  'europa--iparvidekek--kozep-angliai-iparvidek': { en: 'Midlands industrial region', rule: m('polygon') },
  'europa--iparvidekek--olasz-ipari-haromszog': { en: 'Industrial Triangle (Milan–Turin–Genoa)', rule: m('polygon') },
  'europa--iparvidekek--ruhr-videk': { en: 'Ruhr', rule: m('polygon') },
  'europa--varosok--beregszasz': { en: 'Berehove', rule: m('point') },
  'europa--varosok--munkacs': { en: 'Mukachevo', rule: m('point') },
  'europa--varosok--revkomarom': { en: 'Komárno', rule: m('point') },
  'europa--varosok--karlovy-vary': { en: 'Karlovy Vary', rule: m('point') },
  'europa--varosok--szekelyudvarhely': { en: 'Odorheiu Secuiesc', rule: m('point') },
  'europa--varosok--constan-a': { en: 'Constanța', rule: { src: 'place', en: 'Constanța' } },
  'europa--varosok--ploie-ti': { en: 'Ploiești', rule: { src: 'place', en: 'Ploiești' } },
  'europa--varosok--pri-tina': { en: 'Pristina', rule: { src: 'place', en: 'Pristina' } },
  'europa--varosok--skopje-szkopje': { en: 'Skopje', rule: { src: 'place', en: 'Skopje' } },
  'europa--varosok--thesszaloniki-szaloniki': { en: 'Thessaloniki', rule: { src: 'place', en: 'Thessaloniki' } },
  'europa--varosok--frankfurt-am-main': { en: 'Frankfurt am Main', rule: { src: 'place', en: 'Frankfurt', adm0: 'Germany' } },
  'europa--varosok--birmingham': { en: 'Birmingham (UK)', rule: { src: 'place', en: 'Birmingham', adm0: 'United Kingdom' } },
  'europa--varosok--london': { en: 'London', rule: { src: 'place', en: 'London', adm0: 'United Kingdom' } },
  'europa--varosok--manchester': { en: 'Manchester', rule: { src: 'place', en: 'Manchester', adm0: 'United Kingdom' } },
  'europa--varosok--liverpool': { en: 'Liverpool', rule: { src: 'place', en: 'Liverpool', adm0: 'United Kingdom' } },
  'europa--varosok--glasgow': { en: 'Glasgow', rule: { src: 'place', en: 'Glasgow', adm0: 'United Kingdom' } },
  'europa--varosok--dublin': { en: 'Dublin', rule: { src: 'place', en: 'Dublin', adm0: 'Ireland' } },
  'europa--varosok--roma': { en: 'Rome', rule: { src: 'place', en: 'Rome', adm0: 'Italy' } },
  'europa--varosok--gibraltar': { en: 'Gibraltar', rule: { src: 'place', en: 'Gibraltar' } },
  'europa--varosok--luxembourg': { en: 'Luxembourg (city)', rule: { src: 'place', en: 'Luxembourg' } },
  'europa--varosok--csernobil': { en: 'Chernobyl', rule: { src: 'place', en: 'Chernobyl' } },
};

// ---------------- Magyarország ----------------
// Counties (geoBoundaries ADM1 shapeName) and regions merged from them (NUTS 2 2018+).
const COUNTY = (id: string, name: string, en: string) => (NAME_MAP[`magyarorszag--megyek--${id}`] = { en, rule: { src: 'county', name } });
COUNTY('baranya-megye', 'Baranya', 'Baranya County');
COUNTY('bacs-kiskun-megye', 'Bács-Kiskun', 'Bács-Kiskun County');
COUNTY('bekes-megye', 'Békés', 'Békés County');
COUNTY('borsod-abauj-zemplen-megye', 'Borsod-Abaúj-Zemplén', 'Borsod-Abaúj-Zemplén County');
COUNTY('csongrad-csanad-megye', 'Csongrád-Csanád', 'Csongrád-Csanád County');
COUNTY('fejer-megye', 'Fejér', 'Fejér County');
COUNTY('gyor-moson-sopron-megye', 'Győr-Moson-Sopron', 'Győr-Moson-Sopron County');
COUNTY('hajdu-bihar-megye', 'Hajdú-Bihar', 'Hajdú-Bihar County');
COUNTY('heves-megye', 'Heves', 'Heves County');
COUNTY('jasz-nagykun-szolnok-megye', 'Jász-Nagykun-Szolnok', 'Jász-Nagykun-Szolnok County');
COUNTY('komarom-esztergom-megye', 'Komárom-Esztergom', 'Komárom-Esztergom County');
COUNTY('nograd-megye', 'Nógrád', 'Nógrád County');
COUNTY('pest-megye', 'Pest', 'Pest County');
COUNTY('somogy-megye', 'Somogy', 'Somogy County');
COUNTY('szabolcs-szatmar-bereg-megye', 'Szabolcs-Szatmár-Bereg', 'Szabolcs-Szatmár-Bereg County');
COUNTY('tolna-megye', 'Tolna', 'Tolna County');
COUNTY('vas-megye', 'Vas', 'Vas County');
COUNTY('veszprem-megye', 'Veszprém', 'Veszprém County');
COUNTY('zala-megye', 'Zala', 'Zala County');

const REGION = (id: string, en: string, names: string[], withBudapest = false) =>
  (NAME_MAP[`magyarorszag--nagyregiok-regiok--${id}`] = { en, rule: { src: 'counties', names, withBudapest } });
REGION('budapest-regio', 'Budapest', [], true);
REGION('pest-regio', 'Pest', ['Pest']);
REGION('kozep-magyarorszag-nagyregio', 'Central Hungary', ['Pest'], true);
REGION('kozep-dunantul-regio', 'Central Transdanubia', ['Fejér', 'Komárom-Esztergom', 'Veszprém']);
REGION('nyugat-dunantul-regio', 'Western Transdanubia', ['Győr-Moson-Sopron', 'Vas', 'Zala']);
REGION('del-dunantul-regio', 'Southern Transdanubia', ['Baranya', 'Somogy', 'Tolna']);
REGION('dunantul-nagyregio', 'Transdanubia', ['Fejér', 'Komárom-Esztergom', 'Veszprém', 'Győr-Moson-Sopron', 'Vas', 'Zala', 'Baranya', 'Somogy', 'Tolna']);
REGION('eszak-magyarorszag-regio', 'Northern Hungary', ['Borsod-Abaúj-Zemplén', 'Heves', 'Nógrád']);
REGION('eszak-alfold-regio', 'Northern Great Plain', ['Hajdú-Bihar', 'Jász-Nagykun-Szolnok', 'Szabolcs-Szatmár-Bereg']);
REGION('del-alfold-regio', 'Southern Great Plain', ['Bács-Kiskun', 'Békés', 'Csongrád-Csanád']);
REGION('alfold-es-eszak-nagyregio', 'Great Plain and North', ['Borsod-Abaúj-Zemplén', 'Heves', 'Nógrád', 'Hajdú-Bihar', 'Jász-Nagykun-Szolnok', 'Szabolcs-Szatmár-Bereg', 'Bács-Kiskun', 'Békés', 'Csongrád-Csanád']);

// Székelyföld: the historical seats lie in today's Harghita, Covasna and eastern Mureș counties.
NAME_MAP['europa--tortenelmi-tajnevek--szekelyfold'] = { en: 'Székely Land', rule: m('polygon') };

// Hungarian items drawn by hand unless found in NE (rivers, big lakes, towns are tried first).
export const HU_LAKES: Record<string, string> = {
  'magyarorszag--vizrajz--balaton': 'Lake Balaton',
  'magyarorszag--vizrajz--tisza-to': 'Lake Tisza',
  'magyarorszag--vizrajz--ferto': 'Neusiedlersee',
  'magyarorszag--nemzeti-parkok-vilagoroksegek--ferto': 'Neusiedlersee',
};
for (const [id, en] of Object.entries(HU_LAKES)) NAME_MAP[id] = { en, rule: { src: 'lake', en } };

export const HU_RIVERS: Record<string, [string, string[]]> = {
  'magyarorszag--vizrajz--duna': ['Danube', ['Danube', 'Donau']],
  'magyarorszag--vizrajz--tisza': ['Tisza', ['Tisa', 'Tisza']],
  'magyarorszag--vizrajz--maros': ['Mureș', ['Mures']],
  'magyarorszag--vizrajz--sio': ['Sió', ['Sio']],
  'magyarorszag--vizrajz--zala': ['Zala', ['Zala']],
  'magyarorszag--vizrajz--zagyva': ['Zagyva', ['Zagyva']],
  'magyarorszag--vizrajz--ipoly': ['Ipeľ', ['Ipel']],
};
for (const [id, [en, names]] of Object.entries(HU_RIVERS)) NAME_MAP[id] = { en, rule: { src: 'river', en: names, bbox: [15.5, 45.3, 26, 49.8] } };
