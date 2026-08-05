#!/usr/bin/env bash
# Deploy IslandGrid Web di VPS.
# Jalankan dari dalam folder web/:  bash deploy.sh
set -euo pipefail

PORT="${PORT:-3010}"
APP="${APP:-islandgrid-web}"

if [ ! -f .env.local ]; then
  echo "❌ .env.local tidak ada. Buat dulu (lihat .env.example), baru jalankan lagi."
  exit 1
fi

echo "==> memasang dependensi"
npm install

echo "==> build"
npm run build

echo "==> menyalin aset ke standalone"
# rm -rf dulu: 'cp -r src dst/' akan MENYARANGKAN folder kalau tujuan sudah ada,
# sehingga aset lama tetap tersaji. Ini sumber bug 'perubahan tidak muncul'.
rm -rf .next/standalone/.next/static .next/standalone/public
cp -r .next/static .next/standalone/.next/
[ -d public ] && cp -r public .next/standalone/
cp .env.local .next/standalone/

# sanity check: jangan sampai ada .next/static/static
if [ -d .next/standalone/.next/static/static ]; then
  echo "❌ aset tersarang (static/static). Hentikan."
  exit 1
fi

echo "==> restart pm2"
if pm2 describe "$APP" > /dev/null 2>&1; then
  pm2 restart "$APP" --update-env
else
  PORT="$PORT" pm2 start .next/standalone/server.js --name "$APP"
fi
pm2 save

echo "==> cek"
sleep 3
CODE=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/login")
echo "HTTP ${CODE} di port ${PORT}"
[ "$CODE" = "200" ] && echo "✅ selesai" || { echo "❌ gagal — cek: pm2 logs $APP --lines 30"; exit 1; }
