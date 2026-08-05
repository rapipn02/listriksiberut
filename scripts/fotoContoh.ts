import { deflateSync } from "node:zlib";

const TABEL_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = TABEL_CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(tipe: string, isi: Buffer): Buffer {
  const panjang = Buffer.alloc(4);
  panjang.writeUInt32BE(isi.length);
  const badan = Buffer.concat([Buffer.from(tipe, "ascii"), isi]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(badan));
  return Buffer.concat([panjang, badan, crc]);
}

function png(
  lebar: number,
  tinggi: number,
  warna: (x: number, y: number) => [number, number, number],
): Buffer {
  const baris = Buffer.alloc(tinggi * (1 + lebar * 3));
  let o = 0;
  for (let y = 0; y < tinggi; y++) {
    baris[o++] = 0;
    for (let x = 0; x < lebar; x++) {
      const [r, g, b] = warna(x, y);
      baris[o++] = r;
      baris[o++] = g;
      baris[o++] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(lebar, 0);
  ihdr.writeUInt32BE(tinggi, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(baris, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const PALET: Array<[number, number, number]> = [
  [21, 128, 61],
  [30, 64, 175],
  [180, 83, 9],
  [126, 34, 206],
];

export function fotoContohBase64(indeks: number): string {
  const [pr, pg, pb] = PALET[indeks % PALET.length];
  const L = 480;
  const T = 320;
  const jumlahKotak = (indeks % 4) + 1;
  const sisi = 46;
  const jarak = 22;
  const totalLebar = jumlahKotak * sisi + (jumlahKotak - 1) * jarak;
  const kiri = Math.round((L - totalLebar) / 2);
  const atas = Math.round((T - sisi) / 2);

  return png(L, T, (x, y) => {
    const dalamKotak =
      y >= atas &&
      y < atas + sisi &&
      x >= kiri &&
      x < kiri + totalLebar &&
      (x - kiri) % (sisi + jarak) < sisi;
    if (dalamKotak) return [255, 255, 255];

    const f = (x / L) * 0.55 + (y / T) * 0.45;
    const campur = (c: number) => Math.round(c * (0.45 + 0.55 * f));
    return [campur(pr), campur(pg), campur(pb)];
  }).toString("base64");
}
