// SZÁMOLÁS generators (brief §6.5): random but realistic data, a worked solution and a hint.
// Every formula is the one used in Hungarian geography textbooks; see generators.test.ts.
import { clock, hu, int, latLabel, lonLabel, pick, round, type CalcGenerator, type CalcProblem } from './core';

const SCALES = [10_000, 25_000, 50_000, 100_000, 200_000, 250_000, 500_000, 1_000_000, 2_000_000, 5_000_000];

// ---------- 1. Térkép ----------

export function scaleDistance(scale: number, mapCm: number) {
  const km = (mapCm * scale) / 100_000;
  return { km };
}
export function scaleArea(scale: number, mapCm2: number) {
  // 1 cm² on the map = (scale cm)² in reality = scale² / 10^10 km²
  return { km2: (mapCm2 * scale * scale) / 1e10 };
}

const meretarany: CalcGenerator = {
  id: 'meretarany',
  title: 'Méretarány: térképi és valódi távolság',
  topic: '1.2',
  level: 'kozep',
  generate(rng) {
    const scale = pick(rng, SCALES);
    const mapCm = round(int(rng, 12, 180) / 10, 1);
    const { km } = scaleDistance(scale, mapCm);
    const reverse = rng() < 0.4;
    if (reverse) {
      return {
        type: 'meretarany',
        question: `Két város valódi távolsága ${hu(km, km < 10 ? 2 : 1)} km. Hány cm a távolságuk egy 1 : ${hu(scale)} méretarányú térképen?`,
        answers: [{ label: 'Térképi távolság', answer: { value: mapCm, unit: 'cm', tolerance: 0.05, display: `${hu(mapCm, 1)} cm` } }],
        steps: [
          `1 : ${hu(scale)} azt jelenti, hogy a térképen 1 cm a valóságban ${hu(scale)} cm = ${hu(scale / 100_000, scale < 100_000 ? 2 : 1)} km.`,
          `Térképi távolság = valódi távolság ÷ (1 cm-nek megfelelő km) = ${hu(km, 2)} ÷ ${hu(scale / 100_000, 2)}`,
          `= ${hu(mapCm, 1)} cm`,
        ],
        hint: 'Előbb számold ki, hány km-nek felel meg 1 cm a térképen (a méretarányszámból hagyj el öt nullát).',
      };
    }
    return {
      type: 'meretarany',
      question: `Egy 1 : ${hu(scale)} méretarányú térképen két pont távolsága ${hu(mapCm, 1)} cm. Mekkora a valódi távolságuk km-ben?`,
      answers: [{ label: 'Valódi távolság', answer: { value: round(km, 3), unit: 'km', tolerance: Math.max(0.01, km * 0.01), display: `${hu(km, km < 10 ? 2 : 1)} km` } }],
      steps: [
        `A térképen 1 cm a valóságban ${hu(scale)} cm.`,
        `${hu(mapCm, 1)} cm × ${hu(scale)} = ${hu(mapCm * scale)} cm`,
        `cm → km: ÷ 100 000 → ${hu(km, km < 10 ? 2 : 1)} km`,
      ],
      hint: '1 km = 100 000 cm. Szorozd meg a térképi távolságot a méretarányszámmal, majd válts km-re.',
    };
  },
};

const terulet: CalcGenerator = {
  id: 'terulet',
  title: 'Terület kiszámítása a méretarány alapján',
  topic: '1.2',
  level: 'emelt',
  generate(rng) {
    const scale = pick(rng, [50_000, 100_000, 200_000, 500_000, 1_000_000]);
    const a = int(rng, 2, 9);
    const b = int(rng, 2, 9);
    const mapCm2 = a * b;
    const { km2 } = scaleArea(scale, mapCm2);
    const side = scale / 100_000;
    return {
      type: 'terulet',
      question: `Egy 1 : ${hu(scale)} méretarányú térképen egy téglalap alakú terület oldalai ${a} cm és ${b} cm. Mekkora a valódi területe km²-ben?`,
      answers: [{ label: 'Valódi terület', answer: { value: round(km2, 3), unit: 'km²', tolerance: Math.max(0.01, km2 * 0.01), display: `${hu(km2, km2 < 10 ? 2 : 0)} km²` } }],
      steps: [
        `1 cm a térképen ${hu(side, 1)} km a valóságban, tehát 1 cm² = ${hu(side, 1)} km × ${hu(side, 1)} km = ${hu(side * side, 2)} km².`,
        `A térképi terület: ${a} cm × ${b} cm = ${mapCm2} cm².`,
        `Valódi terület: ${mapCm2} × ${hu(side * side, 2)} km² = ${hu(km2, km2 < 10 ? 2 : 0)} km².`,
      ],
      hint: 'Területnél a méretarány a négyzeten számít: előbb az oldalakat váltsd valódi hosszra, vagy emeld négyzetre a km/cm arányt.',
    };
  },
};

const relativMagassag: CalcGenerator = {
  id: 'relativ-magassag',
  title: 'Relatív (viszonylagos) magasság',
  topic: '1.2',
  level: 'kozep',
  generate(rng) {
    const top = int(rng, 350, 2600);
    const bottom = int(rng, 80, Math.min(top - 120, 900));
    return {
      type: 'relativ-magassag',
      question: `Egy hegycsúcs tengerszint feletti magassága ${hu(top)} m, a lábánál fekvő völgytalpé ${hu(bottom)} m. Mekkora a csúcs relatív magassága a völgytalphoz képest?`,
      answers: [{ label: 'Relatív magasság', answer: { value: top - bottom, unit: 'm', tolerance: 0, display: `${hu(top - bottom)} m` } }],
      steps: [
        'Relatív magasság = két pont tengerszint feletti (abszolút) magasságának különbsége.',
        `${hu(top)} m − ${hu(bottom)} m = ${hu(top - bottom)} m`,
      ],
      hint: 'Az abszolút magasság a tengerszinthez, a relatív egy másik ponthoz viszonyít.',
    };
  },
};

/** Distance of whole degrees along the Equator or a meridian (≈ 111,3 km / °). */
export const KM_PER_DEG = 40_000 / 360;
const fokhalozat: CalcGenerator = {
  id: 'fokhalozat-tavolsag',
  title: 'Távolság a fokhálózaton (Egyenlítő, hosszúsági kör)',
  topic: '1.2',
  level: 'emelt',
  generate(rng) {
    const alongEquator = rng() < 0.5;
    if (alongEquator) {
      const a = int(rng, -170, 120);
      const b = a + int(rng, 10, 60);
      const d = b - a;
      const km = d * KM_PER_DEG;
      return {
        type: 'fokhalozat-tavolsag',
        question: `Két hajó az Egyenlítőn halad: az egyik ${lonLabel(a)}, a másik ${lonLabel(b)} hosszúságon van. Hány km a távolságuk az Egyenlítő mentén? (Az Egyenlítő hossza kb. 40 000 km.)`,
        answers: [{ label: 'Távolság', answer: { value: round(km, 0), unit: 'km', tolerance: km * 0.01 + 5, display: `kb. ${hu(km, 0)} km` } }],
        steps: [
          `A két hosszúság különbsége: ${d}° (azonos félgömbön kivonunk, különbözőn összeadunk).`,
          `1° az Egyenlítőn: 40 000 km ÷ 360 ≈ ${hu(KM_PER_DEG, 1)} km.`,
          `${d} × ${hu(KM_PER_DEG, 1)} km ≈ ${hu(km, 0)} km`,
        ],
        hint: 'Az Egyenlítő mentén 1 hosszúsági fok kb. 111 km. Figyelj: ha a két pont különböző félgömbön van, a fokokat össze kell adni.',
      };
    }
    const lat1 = int(rng, -60, 40);
    const lat2 = lat1 + int(rng, 8, 45);
    const d = lat2 - lat1;
    const km = d * KM_PER_DEG;
    const lon = int(rng, -150, 150);
    return {
      type: 'fokhalozat-tavolsag',
      question: `Két város ugyanazon a hosszúsági körön (${lonLabel(lon)}) fekszik: az egyik ${latLabel(lat1)}, a másik ${latLabel(lat2)} szélességen. Mekkora a távolságuk a hosszúsági kör mentén? (A Föld kerülete kb. 40 000 km.)`,
      answers: [{ label: 'Távolság', answer: { value: round(km, 0), unit: 'km', tolerance: km * 0.01 + 5, display: `kb. ${hu(km, 0)} km` } }],
      steps: [
        `A szélességek különbsége: ${d}°.`,
        `1° a hosszúsági kör mentén: 40 000 km ÷ 360 ≈ ${hu(KM_PER_DEG, 1)} km.`,
        `${d} × ${hu(KM_PER_DEG, 1)} km ≈ ${hu(km, 0)} km`,
      ],
      hint: 'A hosszúsági körök (délkörök) mentén minden szélességi fok kb. 111 km.',
    };
  },
};

// ---------- 2. Idő ----------

/** Local time difference in minutes: 1° = 4 minutes, east is later. */
export const localTimeDiff = (lonFrom: number, lonTo: number) => (lonTo - lonFrom) * 4;

const helyiIdo: CalcGenerator = {
  id: 'helyi-ido',
  title: 'Helyi idő számítása',
  topic: '2.3',
  level: 'kozep',
  generate(rng) {
    const lonA = int(rng, -120, 140);
    let lonB = int(rng, -150, 150);
    if (Math.abs(lonB - lonA) < 10) lonB = lonA + (lonB >= lonA ? 23 : -23);
    const tA = int(rng, 6 * 60, 18 * 60);
    const diff = localTimeDiff(lonA, lonB);
    const tB = tA + diff;
    const dayShift = tB >= 1440 ? ' (másnap)' : tB < 0 ? ' (előző nap)' : '';
    return {
      type: 'helyi-ido',
      question: `${lonLabel(lonA)} hosszúságon a helyi idő ${clock(tA)}. Hány óra ekkor a helyi idő ${lonLabel(lonB)} hosszúságon?`,
      answers: [{ label: 'Helyi idő', answer: { value: clock(tB), display: `${clock(tB)}${dayShift}` } }],
      steps: [
        `A hosszúságkülönbség: ${Math.abs(lonB - lonA)}° (azonos félgömbön kivonunk, különbözőn összeadunk).`,
        `1° = 4 perc → ${Math.abs(lonB - lonA)} × 4 = ${Math.abs(diff)} perc = ${Math.floor(Math.abs(diff) / 60)} óra ${Math.abs(diff) % 60} perc.`,
        `A keresett hely ${lonB > lonA ? 'keletebbre' : 'nyugatabbra'} van, ott a helyi idő ${lonB > lonA ? 'több' : 'kevesebb'}: ${clock(tA)} ${lonB > lonA ? '+' : '−'} ${Math.floor(Math.abs(diff) / 60)} óra ${Math.abs(diff) % 60} perc = ${clock(tB)}${dayShift}.`,
      ],
      hint: 'A Föld nyugatról kelet felé forog, ezért keletebbre „később” van. 15° = 1 óra, 1° = 4 perc.',
    };
  },
};

/** Standard time zone number (−12…+12) of a longitude, by the 15° rule. */
export const zoneOf = (lon: number) => Math.max(-12, Math.min(12, Math.round(lon / 15)));

const zonaido: CalcGenerator = {
  id: 'zonaido',
  title: 'Zónaidő és a dátumválasztó vonal',
  topic: '2.3',
  level: 'emelt',
  generate(rng) {
    const cities = [
      { n: 'Budapest', lon: 19 },
      { n: 'London', lon: 0 },
      { n: 'New York', lon: -74 },
      { n: 'Los Angeles', lon: -118 },
      { n: 'Tokió', lon: 140 },
      { n: 'Peking', lon: 116 },
      { n: 'Sydney', lon: 151 },
      { n: 'Rio de Janeiro', lon: -43 },
      { n: 'Moszkva', lon: 38 },
      { n: 'Mumbai', lon: 73 },
    ];
    const a = pick(rng, cities);
    let b = pick(rng, cities);
    while (b.n === a.n) b = pick(rng, cities);
    const za = zoneOf(a.lon);
    const zb = zoneOf(b.lon);
    const day = int(rng, 2, 27);
    const t = int(rng, 0, 23) * 60;
    const tb = t + (zb - za) * 60;
    const dayB = tb >= 1440 ? day + 1 : tb < 0 ? day - 1 : day;
    return {
      type: 'zonaido',
      question: `${a.n} (${lonLabel(a.lon)}) zónaideje szerint március ${day}. ${clock(t)} van. Mennyi ekkor a zónaidő ${b.n} (${lonLabel(b.lon)}) településen? (Tételezd fel, hogy mindkét hely a 15°-os szabály szerinti zónaidőt használja, nyári időszámítás nélkül.)`,
      answers: [
        { label: 'Időpont', answer: { value: clock(tb), display: clock(tb) } },
        { label: 'Nap (március …)', answer: { value: dayB, tolerance: 0, display: `március ${dayB}.` } },
      ],
      steps: [
        `Zónaszám = hosszúság ÷ 15, egészre kerekítve: ${a.n}: ${a.lon} ÷ 15 → ${za >= 0 ? '+' : ''}${za}; ${b.n}: ${b.lon} ÷ 15 → ${zb >= 0 ? '+' : ''}${zb}.`,
        `Időkülönbség: ${zb - za} óra (keletre több, nyugatra kevesebb).`,
        `${clock(t)} ${zb - za >= 0 ? '+' : '−'} ${Math.abs(zb - za)} óra = ${clock(tb)}, március ${dayB}.`,
      ],
      hint: 'Egy időzóna 15° széles, a zónaidő a zóna középső délkörének helyi ideje. Ha átlépsz éjfélt, a dátum is változik.',
    };
  },
};

const datumvalaszto: CalcGenerator = {
  id: 'datumvalaszto',
  title: 'A dátumválasztó vonal átlépése',
  topic: '2.3',
  level: 'emelt',
  generate(rng) {
    const eastward = rng() < 0.5; // from Asia to America
    const day = int(rng, 3, 26);
    const hours = int(rng, 6, 14);
    const dep = int(rng, 6, 20) * 60;
    // Departure zone +12 (e.g. Fiji/NZ side) → arrival zone −10 (Hawaii), or reverse.
    const zFrom = eastward ? 12 : -10;
    const zTo = eastward ? -10 : 12;
    const arrUtc = dep - zFrom * 60 + hours * 60;
    const arrLocal = arrUtc + zTo * 60;
    const dayArr = day + Math.floor(arrLocal / 1440);
    return {
      type: 'datumvalaszto',
      question: `Egy repülőgép ${eastward ? 'Új-Zélandról (zónaidő: UTC+12) kelet felé Hawaiira (UTC−10)' : 'Hawaiiról (UTC−10) nyugat felé Új-Zélandra (UTC+12)'} repül, átlépve a dátumválasztó vonalat. Indulás helyi idő szerint július ${day}. ${clock(dep)}, a repülési idő ${hours} óra. Mikor érkezik helyi idő szerint?`,
      answers: [
        { label: 'Érkezés ideje', answer: { value: clock(arrLocal), display: clock(arrLocal) } },
        { label: 'Nap (július …)', answer: { value: dayArr, tolerance: 0, display: `július ${dayArr}.` } },
      ],
      steps: [
        `Indulás világidőben (UTC): ${clock(dep)} − (${zFrom > 0 ? '+' : ''}${zFrom} óra) = ${clock(dep - zFrom * 60)}${dep - zFrom * 60 < 0 ? ' (előző nap)' : ''}.`,
        `Plusz ${hours} óra repülés: ${clock(arrUtc)} UTC.`,
        `Érkezési zónaidő: ${clock(arrUtc)} ${zTo >= 0 ? '+' : '−'} ${Math.abs(zTo)} óra = ${clock(arrLocal)}, július ${dayArr}.`,
        eastward
          ? 'Kelet felé átlépve a dátumválasztó vonalat a naptárat egy nappal vissza kell lapozni – ezért érkezhetsz „korábbi” napon.'
          : 'Nyugat felé átlépve a dátumválasztó vonalat a naptárat egy nappal előre kell lapozni.',
      ],
      hint: 'Számolj át világidőre (UTC), add hozzá a repülési időt, majd válts az érkezési zónaidőre. Nyugat felé lépve +1 nap, kelet felé −1 nap.',
    };
  },
};

/** Noon solar altitude: h = 90° − |φ − δ|; δ = 0° (equinox), ±23,5° (solstices). */
export function noonAltitude(lat: number, decl: number) {
  return 90 - Math.abs(lat - decl);
}
const DATES = [
  { n: 'március 21-én (tavaszi nap-éj egyenlőség)', d: 0 },
  { n: 'június 21-én (nyári napforduló)', d: 23.5 },
  { n: 'szeptember 23-án (őszi nap-éj egyenlőség)', d: 0 },
  { n: 'december 21-én (téli napforduló)', d: -23.5 },
];
const delelesi: CalcGenerator = {
  id: 'delelesi-magassag',
  title: 'A Nap delelési magassága a nevezetes napokon',
  topic: '2.3',
  level: 'emelt',
  generate(rng) {
    const when = pick(rng, DATES);
    let lat = int(rng, -64, 64);
    if (lat === 0) lat = 12;
    const h = noonAltitude(lat, when.d);
    const where = lat > when.d ? 'déli' : lat < when.d ? 'északi' : 'zenit (fejünk fölött)';
    return {
      type: 'delelesi-magassag',
      question: `Milyen magasan delel a Nap ${when.n} ${latLabel(lat)} szélességen? Melyik égtáj felett látjuk delelni?`,
      answers: [
        { label: 'Delelési magasság', answer: { value: round(h, 1), unit: '°', tolerance: 0.6, display: `${hu(h, 1)}°` } },
        { label: 'Égtáj (északi / déli)', answer: { value: where === 'zenit (fejünk fölött)' ? 'zenit' : where, display: where } },
      ],
      steps: [
        `A merőleges napsugarak ezen a napon ${when.d === 0 ? 'az Egyenlítőre (0°)' : when.d > 0 ? 'a Ráktérítőre (é. sz. 23,5°)' : 'a Baktérítőre (d. sz. 23,5°)'} esnek.`,
        `A hely és a merőleges sugarak szélességének távolsága: |${hu(lat, 0)} − (${hu(when.d, 1)})| = ${hu(Math.abs(lat - when.d), 1)}°.`,
        `Delelési magasság = 90° − ${hu(Math.abs(lat - when.d), 1)}° = ${hu(h, 1)}°.`,
        `A Nap a merőleges sugarak felé, azaz ${where === 'déli' ? 'dél' : where === 'északi' ? 'észak' : 'a zenit'} felé látszik delelni.`,
      ],
      hint: 'Delelési magasság = 90° − (a hely és a „merőleges sugarak szélességi köre” közti fokkülönbség). Ellentétes félgömbön a fokokat összeadod.',
    };
  },
};

// ---------- 3. Légkör ----------

const gradiens: CalcGenerator = {
  id: 'homersekleti-gradiens',
  title: 'Hőmérséklet-változás a magassággal (0,6 °C / 100 m)',
  topic: '3.2.2',
  level: 'kozep',
  generate(rng) {
    const h0 = int(rng, 1, 12) * 100;
    const h1 = h0 + int(rng, 8, 30) * 100;
    const t0 = int(rng, 8, 30);
    const t1 = t0 - ((h1 - h0) / 100) * 0.6;
    return {
      type: 'homersekleti-gradiens',
      question: `A ${hu(h0)} m magasan fekvő völgyben ${t0} °C van. Mekkora a hőmérséklet a ${hu(h1)} m magas csúcson, ha a hőmérséklet 100 méterenként 0,6 °C-kal csökken?`,
      answers: [{ label: 'Hőmérséklet a csúcson', answer: { value: round(t1, 1), unit: '°C', tolerance: 0.1, display: `${hu(t1, 1)} °C` } }],
      steps: [
        `Szintkülönbség: ${hu(h1)} − ${hu(h0)} = ${hu(h1 - h0)} m.`,
        `Lehűlés: ${hu(h1 - h0)} ÷ 100 × 0,6 = ${hu(((h1 - h0) / 100) * 0.6, 1)} °C.`,
        `${t0} − ${hu(((h1 - h0) / 100) * 0.6, 1)} = ${hu(t1, 1)} °C`,
      ],
      hint: 'A troposzférában átlagosan 100 méterenként 0,6 °C-kal csökken a hőmérséklet.',
    };
  },
};

/** Foehn: dry adiabatic 1 °C/100 m, saturated (wet) 0.5 °C/100 m. */
export function foehn(t0: number, base: number, cloudBase: number, top: number, leeBase: number) {
  const tCloud = t0 - (cloudBase - base) / 100;
  const tTop = tCloud - ((top - cloudBase) / 100) * 0.5;
  const tLee = tTop + (top - leeBase) / 100;
  return { tCloud, tTop, tLee };
}
const fon: CalcGenerator = {
  id: 'fonszel',
  title: 'Főnszél: száraz és nedves adiabatikus hőmérséklet-változás',
  topic: '3.2.3',
  level: 'emelt',
  generate(rng) {
    const base = int(rng, 2, 6) * 100;
    const cloudBase = base + int(rng, 5, 12) * 100;
    const top = cloudBase + int(rng, 10, 20) * 100;
    const leeBase = base;
    const t0 = int(rng, 14, 26);
    const r = foehn(t0, base, cloudBase, top, leeBase);
    return {
      type: 'fonszel',
      question: `A ${hu(base)} m magasan ${t0} °C-os levegő átbukik egy ${hu(top)} m magas hegységen. ${hu(cloudBase)} m-en eléri a harmatpontot, onnan a gerincig felhő képződik és csapadék hullik. A túloldalon ${hu(leeBase)} m-re ereszkedik le. Mekkora a hőmérséklete a szélárnyékos oldalon? (Száraz levegő: 1 °C/100 m, telített levegő: 0,5 °C/100 m.)`,
      answers: [{ label: 'Hőmérséklet a szélárnyékban', answer: { value: round(r.tLee, 1), unit: '°C', tolerance: 0.1, display: `${hu(r.tLee, 1)} °C` } }],
      steps: [
        `Emelkedés a felhőalapig (száraz): ${hu(cloudBase - base)} m → −${hu((cloudBase - base) / 100, 1)} °C → ${hu(r.tCloud, 1)} °C.`,
        `Emelkedés a gerincig (telített, 0,5 °C/100 m): ${hu(top - cloudBase)} m → −${hu(((top - cloudBase) / 100) * 0.5, 1)} °C → ${hu(r.tTop, 1)} °C.`,
        `Leszállás a túloldalon (száraz, 1 °C/100 m): ${hu(top - leeBase)} m → +${hu((top - leeBase) / 100, 1)} °C → ${hu(r.tLee, 1)} °C.`,
        `A szélárnyékos oldalon ${hu(r.tLee - t0, 1)} °C-kal melegebb a levegő, mint a kiinduláskor: ez a főn.`,
      ],
      hint: 'Felfelé a felhőalapig 1 °C, a felhőben csak 0,5 °C hűl 100 m-enként (a kicsapódás hőt szabadít fel), lefelé végig 1 °C-kal melegszik.',
    };
  },
};

export function means(values: number[]) {
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return { avg, range: Math.max(...values) - Math.min(...values) };
}
const MONTHS = ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.'];
const homerseklet: CalcGenerator = {
  id: 'kozephomerseklet',
  title: 'Napi és évi középhőmérséklet, hőingás',
  topic: '3.2.2',
  level: 'kozep',
  generate(rng) {
    if (rng() < 0.5) {
      const base = int(rng, -4, 22);
      const vals = [base - int(rng, 3, 6), base + int(rng, 2, 7), base + int(rng, 0, 4), base - int(rng, 0, 4)];
      const { avg, range } = means(vals);
      return {
        type: 'kozephomerseklet',
        question: 'Egy állomáson a nap folyamán négyszer mértek hőmérsékletet. Számítsd ki a napi középhőmérsékletet és a napi hőingást!',
        data: [
          ['1 órakor', `${hu(vals[0]!)} °C`],
          ['7 órakor', `${hu(vals[3]!)} °C`],
          ['13 órakor', `${hu(vals[1]!)} °C`],
          ['19 órakor', `${hu(vals[2]!)} °C`],
        ],
        answers: [
          { label: 'Napi középhőmérséklet', answer: { value: round(avg, 1), unit: '°C', tolerance: 0.1, display: `${hu(avg, 1)} °C` } },
          { label: 'Napi hőingás', answer: { value: range, unit: '°C', tolerance: 0, display: `${hu(range)} °C` } },
        ],
        steps: [
          `Napi középhőmérséklet = a mért értékek átlaga: (${vals.map((v) => hu(v)).join(' + ')}) ÷ 4 = ${hu(avg, 1)} °C.`,
          `Napi hőingás = legmagasabb − legalacsonyabb érték: ${hu(Math.max(...vals))} − (${hu(Math.min(...vals))}) = ${hu(range)} °C.`,
        ],
        hint: 'Az átlaghoz add össze a mért értékeket és oszd el a mérések számával. A hőingás mindig a legnagyobb és a legkisebb érték különbsége.',
      };
    }
    const cont = rng() < 0.5;
    const summer = int(rng, 18, 26);
    const winter = cont ? int(rng, -12, -1) : int(rng, 2, 8);
    const monthly = MONTHS.map((_, i) => round(winter + ((summer - winter) * (1 - Math.cos(((i - 0.5) / 12) * 2 * Math.PI))) / 2, 1));
    const { avg, range } = means(monthly);
    return {
      type: 'kozephomerseklet',
      question: 'Egy éghajlati állomás havi középhőmérsékletei alapján számítsd ki az évi középhőmérsékletet és az évi közepes hőingást!',
      data: MONTHS.map((m, i) => [m, `${hu(monthly[i]!, 1)} °C`] as [string, string]),
      answers: [
        { label: 'Évi középhőmérséklet', answer: { value: round(avg, 1), unit: '°C', tolerance: 0.15, display: `${hu(avg, 1)} °C` } },
        { label: 'Évi közepes hőingás', answer: { value: round(range, 1), unit: '°C', tolerance: 0.1, display: `${hu(range, 1)} °C` } },
      ],
      steps: [
        `Évi középhőmérséklet = a 12 havi középhőmérséklet átlaga: ${hu(monthly.reduce((a, b) => a + b, 0), 1)} ÷ 12 = ${hu(avg, 1)} °C.`,
        `Évi közepes hőingás = a legmelegebb és a leghidegebb hónap középhőmérsékletének különbsége: ${hu(Math.max(...monthly), 1)} − (${hu(Math.min(...monthly), 1)}) = ${hu(range, 1)} °C.`,
      ],
      hint: 'Az évi közepes hőingás a havi középhőmérsékletekből számol; az abszolút hőingás a valaha mért legmagasabb és legalacsonyabb érték különbsége.',
    };
  },
};

const paratartalom: CalcGenerator = {
  id: 'relativ-paratartalom',
  title: 'Viszonylagos (relatív) vízgőztartalom',
  topic: '3.2.4',
  level: 'emelt',
  generate(rng) {
    // Saturation vapour content (g/m³) at whole-degree temperatures, rounded textbook values.
    const SAT: Record<number, number> = { 0: 4.8, 5: 6.8, 10: 9.4, 15: 12.8, 20: 17.3, 25: 23.0, 30: 30.4 };
    const t = pick(rng, [0, 5, 10, 15, 20, 25, 30]);
    const sat = SAT[t]!;
    const rel = int(rng, 35, 95);
    const abs = round((sat * rel) / 100, 1);
    const relCalc = (abs / sat) * 100;
    return {
      type: 'relativ-paratartalom',
      question: `${t} °C-os levegő 1 m³-ében ${hu(abs, 1)} g vízgőz van. Ezen a hőmérsékleten 1 m³ levegő legfeljebb ${hu(sat, 1)} g vízgőzt tartalmazhat. Mekkora a viszonylagos (relatív) vízgőztartalom?`,
      answers: [{ label: 'Relatív vízgőztartalom', answer: { value: round(relCalc, 0), unit: '%', tolerance: 1, display: `kb. ${hu(relCalc, 0)}%` } }],
      steps: [
        'Relatív vízgőztartalom = tényleges vízgőztartalom ÷ telítettségi (maximális) vízgőztartalom × 100.',
        `${hu(abs, 1)} ÷ ${hu(sat, 1)} × 100 ≈ ${hu(relCalc, 0)}%`,
      ],
      hint: 'A tényleges vízgőztartalom g/m³-ben mérhető, a viszonylagos azt mutatja meg, hány százalékban telített a levegő.',
    };
  },
};

const vizhozam: CalcGenerator = {
  id: 'vizhozam',
  title: 'A folyó vízhozama',
  topic: '3.3.2',
  level: 'kozep',
  generate(rng) {
    const width = int(rng, 40, 400);
    const depth = round(int(rng, 15, 90) / 10, 1);
    const v = round(int(rng, 3, 25) / 10, 1);
    const area = width * depth;
    const q = area * v;
    return {
      type: 'vizhozam',
      question: `Egy folyó egyik szelvényében a meder szélessége ${width} m, átlagos mélysége ${hu(depth, 1)} m, a víz átlagos sebessége ${hu(v, 1)} m/s. Mekkora a vízhozam? (A szelvényt tekintsd téglalapnak.)`,
      answers: [{ label: 'Vízhozam', answer: { value: round(q, 0), unit: 'm³/s', tolerance: Math.max(1, q * 0.01), display: `${hu(q, 0)} m³/s` } }],
      steps: [
        `A keresztmetszet területe: ${width} m × ${hu(depth, 1)} m = ${hu(area, 0)} m².`,
        `Vízhozam = keresztmetszet × sebesség = ${hu(area, 0)} m² × ${hu(v, 1)} m/s = ${hu(q, 0)} m³/s.`,
      ],
      hint: 'A vízhozam az egy másodperc alatt az adott szelvényen átfolyó víz térfogata (m³/s).',
    };
  },
};

const lefolyas: CalcGenerator = {
  id: 'lefolyas',
  title: 'Csapadék és lefolyás',
  topic: '3.3.1',
  level: 'kozep',
  generate(rng) {
    const p = int(rng, 40, 140) * 10;
    const pct = int(rng, 8, 45);
    const runoff = (p * pct) / 100;
    const evap = p - runoff;
    return {
      type: 'lefolyas',
      question: `Egy vízgyűjtő területre évente átlagosan ${hu(p)} mm csapadék hullik, ennek ${pct}%-a folyik le a felszínen és a felszín alatt a folyókba. Hány mm a lefolyás, és mennyi párolog el (a beszivárgást és a tározást most elhanyagolva)?`,
      answers: [
        { label: 'Lefolyás', answer: { value: round(runoff, 0), unit: 'mm', tolerance: 1, display: `${hu(runoff, 0)} mm` } },
        { label: 'Párolgás', answer: { value: round(evap, 0), unit: 'mm', tolerance: 1, display: `${hu(evap, 0)} mm` } },
      ],
      steps: [`Lefolyás: ${hu(p)} mm × ${pct}% = ${hu(runoff, 0)} mm.`, `Vízháztartás: csapadék = lefolyás + párolgás → párolgás = ${hu(p)} − ${hu(runoff, 0)} = ${hu(evap, 0)} mm.`],
      hint: 'A vízháztartási egyenlet: csapadék = párolgás + lefolyás (+ készletváltozás).',
    };
  },
};

// ---------- 5–6. Népesség, gazdaság ----------

const nepsuruseg: CalcGenerator = {
  id: 'nepsuruseg',
  title: 'Népsűrűség',
  topic: '5.1',
  level: 'kozep',
  generate(rng) {
    const pop = int(rng, 200, 9_000) * 1000;
    const area = int(rng, 1_000, 90_000);
    const d = pop / area;
    return {
      type: 'nepsuruseg',
      question: `Egy ország népessége ${hu(pop)} fő, területe ${hu(area)} km². Mekkora a népsűrűsége?`,
      answers: [{ label: 'Népsűrűség', answer: { value: round(d, 1), unit: 'fő/km²', tolerance: Math.max(0.5, d * 0.01), display: `${hu(d, 1)} fő/km²` } }],
      steps: [`Népsűrűség = népesség ÷ terület = ${hu(pop)} fő ÷ ${hu(area)} km² ≈ ${hu(d, 1)} fő/km².`],
      hint: 'A népsűrűség az egy km²-re jutó lakosok száma.',
    };
  },
};

/** Natural increase in ‰: (births − deaths) / population × 1000. */
export const naturalIncrease = (births: number, deaths: number, pop: number) => ((births - deaths) / pop) * 1000;
const szaporodas: CalcGenerator = {
  id: 'termeszetes-szaporodas',
  title: 'Természetes szaporodás / fogyás és vándorlási különbözet',
  topic: '5.1',
  level: 'kozep',
  generate(rng) {
    const pop = int(rng, 800, 12_000) * 1000;
    const birthRate = int(rng, 8, 38);
    const deathRate = int(rng, 6, 16);
    const births = Math.round((pop * birthRate) / 1000);
    const deaths = Math.round((pop * deathRate) / 1000);
    const immig = int(rng, 2, 60) * 1000;
    const emig = int(rng, 2, 60) * 1000;
    const ni = naturalIncrease(births, deaths, pop);
    const change = births - deaths + immig - emig;
    return {
      type: 'termeszetes-szaporodas',
      question: 'Egy ország egy évének népmozgalmi adatai alapján számítsd ki a természetes szaporodást (fogyást) ezrelékben, a vándorlási különbözetet és a népességváltozást!',
      data: [
        ['Népesség az év elején', `${hu(pop)} fő`],
        ['Élveszületések', `${hu(births)} fő`],
        ['Halálozások', `${hu(deaths)} fő`],
        ['Bevándorlók', `${hu(immig)} fő`],
        ['Kivándorlók', `${hu(emig)} fő`],
      ],
      answers: [
        { label: 'Természetes szaporodás (‰)', answer: { value: round(ni, 1), unit: '‰', tolerance: 0.15, display: `${hu(ni, 1)}‰` } },
        { label: 'Vándorlási különbözet', answer: { value: immig - emig, unit: 'fő', tolerance: 0, display: `${hu(immig - emig)} fő` } },
        { label: 'Népességváltozás', answer: { value: change, unit: 'fő', tolerance: 0, display: `${hu(change)} fő` } },
      ],
      steps: [
        `Természetes szaporodás = (élveszületés − halálozás) ÷ népesség × 1000 = (${hu(births)} − ${hu(deaths)}) ÷ ${hu(pop)} × 1000 ≈ ${hu(ni, 1)}‰${ni < 0 ? ' (természetes fogyás)' : ''}.`,
        `Vándorlási különbözet = bevándorlók − kivándorlók = ${hu(immig)} − ${hu(emig)} = ${hu(immig - emig)} fő.`,
        `Népességváltozás = természetes szaporodás + vándorlási különbözet = ${hu(births - deaths)} + (${hu(immig - emig)}) = ${hu(change)} fő.`,
      ],
      hint: 'Az ezrelék (‰) az 1000 lakosra jutó érték. A népesség a természetes szaporodással és a vándorlási különbözettel együtt változik.',
    };
  },
};

const gdpFo: CalcGenerator = {
  id: 'gdp-fo',
  title: 'Egy főre jutó GDP és összehasonlítás',
  topic: '6.1',
  level: 'kozep',
  generate(rng) {
    const a = { n: 'A ország', gdp: int(rng, 20, 900) * 1e9, pop: int(rng, 2, 80) * 1e6 };
    const b = { n: 'B ország', gdp: int(rng, 20, 900) * 1e9, pop: int(rng, 2, 80) * 1e6 };
    const pa = a.gdp / a.pop;
    const pb = b.gdp / b.pop;
    const ratio = Math.max(pa, pb) / Math.min(pa, pb);
    const richer = pa > pb ? a.n : b.n;
    return {
      type: 'gdp-fo',
      question: 'Számítsd ki a két ország egy főre jutó GDP-jét (USD/fő), és add meg, hányszorosa a nagyobb érték a kisebbnek!',
      data: [
        [`${a.n} GDP`, `${hu(a.gdp / 1e9)} milliárd USD`],
        [`${a.n} népesség`, `${hu(a.pop / 1e6)} millió fő`],
        [`${b.n} GDP`, `${hu(b.gdp / 1e9)} milliárd USD`],
        [`${b.n} népesség`, `${hu(b.pop / 1e6)} millió fő`],
      ],
      answers: [
        { label: `${a.n} (USD/fő)`, answer: { value: Math.round(pa), unit: 'USD/fő', tolerance: Math.max(5, pa * 0.01), display: `${hu(pa, 0)} USD/fő` } },
        { label: `${b.n} (USD/fő)`, answer: { value: Math.round(pb), unit: 'USD/fő', tolerance: Math.max(5, pb * 0.01), display: `${hu(pb, 0)} USD/fő` } },
        { label: 'Hányszoros?', answer: { value: round(ratio, 1), tolerance: 0.1, display: `${hu(ratio, 1)}-szeres (${richer})` } },
      ],
      steps: [
        `Egy főre jutó GDP = GDP ÷ népesség. ${a.n}: ${hu(a.gdp / 1e9)} milliárd ÷ ${hu(a.pop / 1e6)} millió ≈ ${hu(pa, 0)} USD/fő.`,
        `${b.n}: ${hu(b.gdp / 1e9)} milliárd ÷ ${hu(b.pop / 1e6)} millió ≈ ${hu(pb, 0)} USD/fő.`,
        `Arány: ${hu(Math.max(pa, pb), 0)} ÷ ${hu(Math.min(pa, pb), 0)} ≈ ${hu(ratio, 1)}.`,
      ],
      hint: 'A milliárdot és a milliót ugyanúgy válts át (1 milliárd = 1000 millió), mielőtt osztasz.',
    };
  },
};

const kulker: CalcGenerator = {
  id: 'kulkereskedelmi-egyenleg',
  title: 'Külkereskedelmi egyenleg',
  topic: '6.1',
  level: 'kozep',
  generate(rng) {
    const exp = int(rng, 20, 400);
    const imp = int(rng, 20, 400);
    const bal = exp - imp;
    return {
      type: 'kulkereskedelmi-egyenleg',
      question: `Egy ország kivitele (exportja) ${hu(exp)} milliárd euró, behozatala (importja) ${hu(imp)} milliárd euró. Mekkora a külkereskedelmi egyenleg, és milyen a mérleg?`,
      answers: [
        { label: 'Egyenleg (milliárd euró)', answer: { value: bal, tolerance: 0, display: `${hu(bal)} milliárd euró` } },
        { label: 'A mérleg (aktív / passzív)', answer: { value: bal >= 0 ? 'aktív' : 'passzív', display: bal >= 0 ? 'aktív (pozitív)' : 'passzív (negatív)' } },
      ],
      steps: [`Egyenleg = export − import = ${hu(exp)} − ${hu(imp)} = ${hu(bal)} milliárd euró.`, bal >= 0 ? 'Pozitív egyenleg: aktív (többletes) külkereskedelmi mérleg.' : 'Negatív egyenleg: passzív (hiányos) külkereskedelmi mérleg.'],
      hint: 'Ha többet adunk el, mint amennyit veszünk, a mérleg aktív (pozitív).',
    };
  },
};

const valuta: CalcGenerator = {
  id: 'valutavaltas',
  title: 'Valutaváltás és az árfolyam változásának hatása',
  topic: '6.4',
  level: 'kozep',
  generate(rng) {
    const rate1 = int(rng, 360, 420);
    const rate2 = rate1 + pick(rng, [-20, -12, -8, 8, 12, 20, 25]);
    const eur = int(rng, 2, 40) * 50;
    const huf1 = eur * rate1;
    const huf2 = eur * rate2;
    return {
      type: 'valutavaltas',
      question: `Nyaraláshoz ${hu(eur)} eurót szeretnél venni. Ma 1 euró ${rate1} forint. Mennyibe kerül forintban? Mennyivel fizetnél ${rate2 > rate1 ? 'többet' : 'kevesebbet'}, ha egy hónap múlva 1 euró ${rate2} forint lenne?`,
      answers: [
        { label: 'Ma (Ft)', answer: { value: huf1, unit: 'Ft', tolerance: 1, display: `${hu(huf1)} Ft` } },
        { label: 'Különbség (Ft)', answer: { value: Math.abs(huf2 - huf1), unit: 'Ft', tolerance: 1, display: `${hu(Math.abs(huf2 - huf1))} Ft` } },
      ],
      steps: [
        `${hu(eur)} € × ${rate1} Ft/€ = ${hu(huf1)} Ft.`,
        `Egy hónap múlva: ${hu(eur)} € × ${rate2} Ft/€ = ${hu(huf2)} Ft.`,
        `Különbség: ${hu(Math.abs(huf2 - huf1))} Ft – a forint ${rate2 > rate1 ? 'gyengült (leértékelődött), az euró drágább lett' : 'erősödött, az euró olcsóbb lett'}.`,
      ],
      hint: 'Ha egy euróért több forintot kell adni, a forint gyengült.',
    };
  },
};

const devizahitel: CalcGenerator = {
  id: 'arfolyam-kamat',
  title: 'Az árfolyam- és a kamatváltozás hatása a törlesztőre',
  topic: '6.4',
  level: 'emelt',
  generate(rng) {
    const instEur = int(rng, 100, 400);
    const r1 = int(rng, 300, 340);
    const r2 = r1 + int(rng, 20, 90);
    const huf1 = instEur * r1;
    const huf2 = instEur * r2;
    const pct = ((huf2 - huf1) / huf1) * 100;
    return {
      type: 'arfolyam-kamat',
      question: `Egy euróalapú devizahitel havi törlesztőrészlete ${instEur} euró. A hitelfelvételkor 1 euró ${r1} forint volt, most ${r2} forint. Hány forint volt a havi törlesztő a felvételkor és most, és hány százalékkal nőtt?`,
      answers: [
        { label: 'Felvételkor (Ft)', answer: { value: huf1, unit: 'Ft', tolerance: 1, display: `${hu(huf1)} Ft` } },
        { label: 'Most (Ft)', answer: { value: huf2, unit: 'Ft', tolerance: 1, display: `${hu(huf2)} Ft` } },
        { label: 'Növekedés (%)', answer: { value: round(pct, 1), unit: '%', tolerance: 0.15, display: `${hu(pct, 1)}%` } },
      ],
      steps: [
        `Felvételkor: ${instEur} € × ${r1} = ${hu(huf1)} Ft.`,
        `Most: ${instEur} € × ${r2} = ${hu(huf2)} Ft.`,
        `Növekedés: (${hu(huf2)} − ${hu(huf1)}) ÷ ${hu(huf1)} × 100 ≈ ${hu(pct, 1)}%. Ugyanakkora euróban, mégis drágább forintban: ez az árfolyamkockázat.`,
      ],
      hint: 'Devizahitelnél a törlesztő devizában fix, a forintban fizetendő összeg az árfolyammal együtt változik.',
    };
  },
};

export const GENERATORS: CalcGenerator[] = [
  meretarany,
  terulet,
  relativMagassag,
  fokhalozat,
  helyiIdo,
  zonaido,
  datumvalaszto,
  delelesi,
  gradiens,
  fon,
  homerseklet,
  paratartalom,
  vizhozam,
  lefolyas,
  nepsuruseg,
  szaporodas,
  gdpFo,
  kulker,
  valuta,
  devizahitel,
];

export const generatorById = (id: string) => GENERATORS.find((g) => g.id === id);
export type { CalcProblem };
