# Dapur Senja — Warung Kilat

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![make.fun rank](https://make.fun/badge/best-cooking-game-20261125-0137/haidildariell/cooking-game-v1/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![make.fun reward](https://make.fun/badge/best-cooking-game-20261125-0137/haidildariell/cooking-game-v1/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

https://make.fun/bounty/best-cooking-game-20261125-0137

Game masak 2D original yang jalan offline di browser desktop dari file statis.
Satu koki di warung senja: ambil bahan di pantry, potong di talenen, masak di
kompor, rakit di piring, antar ke Jendela Saji sebelum pelanggan kehabisan sabar.

## Cara main

- Gerak: WASD / tombol panah, atau klik stasiun untuk jalan ke sana.
- Interaksi: E / Spasi. Potong dan masak butuh menahan E sampai progres penuh.
- Pantry: Q ganti bahan, tombol 1-8 pilih bahan, atau klik bahan di panel.
- R: buang bawaan. P: jeda. M: bisu. Enter: mulai / hari berikutnya.
- Hari cuma 3 menit; 30 detik terakhir masuk mode RUSH — order datang lebih
  cepat. Antar beruntun untuk combo dan bonus kecepatan.

## Resep

- Nasi Goreng Senja — nasi, telur matang, cabai iris.
- Mie Ayam Kecap — mie matang, ayam matang, sayur iris, kecap.
- Sup Tomat Telur — tomat iris, telur matang, sayur iris.
- Ayam Bakar Rimba — ayam matang, cabai iris, tomat iris, kecap.

## Struktur

- `game/index.html` — halaman game.
- `game/src/config.js` — konstanta, bahan, resep, stasiun.
- `game/src/input.js` — keyboard dan mouse.
- `game/src/recipes.js` — order, pencocokan resep, skor.
- `game/src/state.js` — state game dan state demo screenshot.
- `game/src/render.js` — semua gambar canvas 2D.
- `game/src/audio.js` — suara dan musik disintesis WebAudio.
- `game/src/main.js` — loop game dan aturan main.
- `main.ts` — program hand-in: menyalin `game/` dan `screenshots/` ke output
  dan menulis `dossier.json` via `vendor/makefun-game.ts`.

Jalankan lokal: sajikan folder `game/` dengan server statis apa pun, lalu buka
`index.html`. Screenshot demo: buka `index.html?shot=cover` (atau `play`,
`serve`, `menu`).

Lisensi: MIT. Dibuat untuk kompetisi make.fun "Make the best cooking game".
