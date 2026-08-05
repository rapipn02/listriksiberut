import { describe, expect, it } from "vitest";
import { dataUrlFoto, tebakMime, totalUkuranKb, ukuranKb } from "./photo";

const JPEG = "/9j/4AAQSkZJRgABAQEAYABgAAD/2Q==";
const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("tebakMime", () => {
  it("mengenali JPEG, PNG, GIF, WebP", () => {
    expect(tebakMime(JPEG)).toBe("image/jpeg");
    expect(tebakMime(PNG)).toBe("image/png");
    expect(tebakMime("R0lGODlhAQABAA==")).toBe("image/gif");
    expect(tebakMime("UklGRiQAAABXRUJQ")).toBe("image/webp");
  });

  it("menolak isi yang bukan gambar", () => {
    expect(tebakMime("aGFsbG8gZHVuaWE=")).toBeNull();
  });
});

describe("dataUrlFoto", () => {
  it("membungkus Base64 mentah dengan MIME yang benar", () => {
    expect(dataUrlFoto(JPEG)).toBe(`data:image/jpeg;base64,${JPEG}`);
    expect(dataUrlFoto(PNG)?.startsWith("data:image/png;base64,")).toBe(true);
  });

  it("meneruskan data URL yang sudah lengkap", () => {
    const url = "data:image/webp;base64,UklGRiQAAABXRUJQ";
    expect(dataUrlFoto(url)).toBe(url);
  });

  it("membuang spasi dan baris baru yang terbawa", () => {
    expect(dataUrlFoto(`/9j/4AAQ\nSkZJRg\r\n`)).toBe(
      "data:image/jpeg;base64,/9j/4AAQSkZJRg",
    );
  });

  it("menerima URL http bila mobile pindah ke Storage", () => {
    expect(dataUrlFoto("https://x/y.jpg")).toBe("https://x/y.jpg");
  });

  it("mengembalikan null untuk isi kosong, bukan string, atau bukan gambar", () => {
    expect(dataUrlFoto("")).toBeNull();
    expect(dataUrlFoto("   ")).toBeNull();
    expect(dataUrlFoto(null)).toBeNull();
    expect(dataUrlFoto(42)).toBeNull();
    expect(dataUrlFoto("aGFsbG8=")).toBeNull();
    expect(dataUrlFoto("data:text/html;base64,PHNjcmlwdD4=")).toBeNull();
  });
});

describe("ukuranKb", () => {
  it("menghitung dari panjang Base64, mengabaikan padding", () => {
    // 1024 byte → 1 KB (1368 karakter Base64 dengan padding)
    const b64 = Buffer.alloc(1024).toString("base64");
    expect(ukuranKb(b64)).toBe(1);
  });

  it("mengabaikan awalan data URL", () => {
    const b64 = Buffer.alloc(2048).toString("base64");
    expect(ukuranKb(`data:image/jpeg;base64,${b64}`)).toBe(2);
  });

  it("menjumlah semua foto satu pengajuan", () => {
    const satu = Buffer.alloc(1024).toString("base64");
    expect(totalUkuranKb([satu, satu, satu])).toBe(3);
    expect(totalUkuranKb(undefined)).toBe(0);
  });
});
