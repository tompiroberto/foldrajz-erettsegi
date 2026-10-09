// Draws the PWA icons (compass rose over contour rings) as PNG without any image library.
//   node scripts/make-icons.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const TEAL = [14, 124, 134];
const PAPER = [247, 244, 236];

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x + 0.5, y + 0.5);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

// Point in the four-pointed star (compass rose) centred at 0,0 with radius 1.
function inRose(x, y, long, short) {
  const ax = Math.abs(x), ay = Math.abs(y);
  return ax / short + ay / long <= 1 || ax / long + ay / short <= 1;
}

function icon(size) {
  const s = size / 64;
  return png(size, (px, py) => {
    const x = px / s - 32, y = py / s - 32;
    const r = Math.hypot(x, y);
    if (inRose(x, y, 24, 5)) return [...PAPER, 255];
    for (const rr of [22, 14]) if (Math.abs(r - rr) < 1) return [Math.round(TEAL[0] * 0.55 + PAPER[0] * 0.45), Math.round(TEAL[1] * 0.55 + PAPER[1] * 0.45), Math.round(TEAL[2] * 0.55 + PAPER[2] * 0.45), 255];
    return [...TEAL, 255];
  });
}

mkdirSync('public/icons', { recursive: true });
writeFileSync('public/icons/icon-192.png', icon(192));
writeFileSync('public/icons/icon-512.png', icon(512));
writeFileSync(
  'public/favicon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0E7C86"/><g fill="none" stroke="#F7F4EC" stroke-opacity=".45" stroke-width="2"><circle cx="32" cy="32" r="22"/><circle cx="32" cy="32" r="14"/></g><path d="M32 8 37 32 32 56 27 32Z" fill="#F7F4EC"/><path d="M8 32 32 27 56 32 32 37Z" fill="#F7F4EC" fill-opacity=".7"/></svg>\n`,
);
console.log('icons written');
