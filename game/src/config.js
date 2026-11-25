// config.js — konstanta dapur, bahan, dan resep "Dapur Senja — Warung Kilat".
// Semua nama, resep, dan harga adalah karangan asli untuk game ini.

export const CANVAS_W = 1280;
export const CANVAS_H = 720;
export const DAY_SECONDS = 180;
export const RUSH_SECONDS = 30;
export const MAX_ORDERS = 4;
export const CHEF_SPEED = 250;
export const CHEF_RADIUS = 22;

// Bahan mentah: id, nama, emoji, warna, butuh potong?, butuh masak?
export const INGREDIENTS = {
  nasi:   { id: 'nasi',   name: 'Nasi',      emoji: '🍚', color: '#f5f0dc', chop: false, cook: false },
  telur:  { id: 'telur',  name: 'Telur',     emoji: '🥚', color: '#fff3c4', chop: false, cook: true },
  ayam:   { id: 'ayam',   name: 'Ayam',      emoji: '🍗', color: '#f2b879', chop: true,  cook: true },
  tomat:  { id: 'tomat',  name: 'Tomat',     emoji: '🍅', color: '#e4572e', chop: true,  cook: false },
  mie:    { id: 'mie',    name: 'Mie',       emoji: '🍜', color: '#f7d774', chop: false, cook: true },
  sayur:  { id: 'sayur',  name: 'Sayur',     emoji: '🥬', color: '#7dc383', chop: true,  cook: false },
  cabai:  { id: 'cabai',  name: 'Cabai',     emoji: '🌶️', color: '#c0392b', chop: true,  cook: false },
  kecap:  { id: 'kecap',  name: 'Kecap',     emoji: '🧂', color: '#5b3a1e', chop: false, cook: false },
};

// Satu langkah resep: bahan + keadaan yang dibutuhkan.
export function recipeStep(ingredientId, state) {
  return { ingredient: ingredientId, state }; // state: 'raw' | 'chopped' | 'cooked'
}

// Resep: id, nama hidangan, emoji, langkah-langkah, harga, waktu sabar pelanggan.
export const RECIPES = [
  {
    id: 'nasi-goreng-senja', name: 'Nasi Goreng Senja', emoji: '🍳', price: 120, patience: 55,
    steps: [recipeStep('nasi', 'raw'), recipeStep('telur', 'cooked'), recipeStep('cabai', 'chopped')],
    blurb: 'Nasi, telur mata sapi, cabai iris — khas warung senja.',
  },
  {
    id: 'mie-ayam-kecap', name: 'Mie Ayam Kecap', emoji: '🍜', price: 140, patience: 60,
    steps: [recipeStep('mie', 'cooked'), recipeStep('ayam', 'cooked'), recipeStep('sayur', 'chopped'), recipeStep('kecap', 'raw')],
    blurb: 'Mie kenyal, ayam kecap manis, sayur segar.',
  },
  {
    id: 'sup-tomat-telur', name: 'Sup Tomat Telur', emoji: '🍲', price: 100, patience: 50,
    steps: [recipeStep('tomat', 'chopped'), recipeStep('telur', 'cooked'), recipeStep('sayur', 'chopped')],
    blurb: 'Sup hangat tomat dan telur, penenang lapar.',
  },
  {
    id: 'ayam-bakar-rimba', name: 'Ayam Bakar Rimba', emoji: '🍖', price: 160, patience: 65,
    steps: [recipeStep('ayam', 'cooked'), recipeStep('cabai', 'chopped'), recipeStep('tomat', 'chopped'), recipeStep('kecap', 'raw')],
    blurb: 'Ayam bakar pedas manis, juara warung.',
  },
];

// Stasiun dapur: id, label, posisi (x, y, w, h), warna, emoji.
export const STATIONS = [
  { id: 'pantry',  label: 'PANTRY',   sub: 'ambil bahan',   x: 40,  y: 150, w: 190, h: 110, color: '#8a6d3b', emoji: '🧺' },
  { id: 'chopping', label: 'TALENEN', sub: 'potong (tahan E)', x: 270, y: 150, w: 190, h: 110, color: '#a1887f', emoji: '🔪' },
  { id: 'stove',   label: 'KOMPOR',   sub: 'masak (tahan E)', x: 500, y: 150, w: 190, h: 110, color: '#37474f', emoji: '🔥' },
  { id: 'assembly', label: 'RAKIT',    sub: 'rakit di piring', x: 730, y: 150, w: 190, h: 110, color: '#6a4c93', emoji: '🍽️' },
  { id: 'serve',   label: 'JENDELA SAJI', sub: 'antar pesanan', x: 960, y: 150, w: 280, h: 110, color: '#2e7d32', emoji: '🛎️' },
  { id: 'trash',   label: 'TEMPAT SAMPAH', sub: 'buang bawaan', x: 40, y: 540, w: 190, h: 110, color: '#616161', emoji: '🗑️' },
];

export const CHOP_SECONDS = 1.4;
export const COOK_SECONDS = 2.6;
export const COMBO_WINDOW = 12;
export const ORDER_SPAWN_EVERY = 14;
export const ORDER_SPAWN_RUSH = 9;
