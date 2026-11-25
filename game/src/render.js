// render.js — semua gambar "Dapur Senja" digambar di canvas 2D, tanpa aset luar.
// Prioritas keterbacaan saat dikecilkan: label besar, emoji besar, kontras tinggi.

import { CANVAS_W, CANVAS_H, STATIONS, INGREDIENTS, RECIPES } from './config.js';
import { carriedLabel, ingredientOf } from './state.js';
import { plateMatchesRecipe } from './recipes.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight = 'bold', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}

function patienceColor(frac) {
  if (frac > 0.5) return '#43a047';
  if (frac > 0.25) return '#fb8c00';
  return '#e53935';
}

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function drawBackground(ctx) {
  // Dinding hangat + lantai ubin kotak-kotak.
  ctx.fillStyle = '#f7d9a0';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#e8b96f';
  ctx.fillRect(0, 128, CANVAS_W, 8);
  ctx.fillStyle = '#c98f4e';
  for (let y = 140; y < CANVAS_H; y += 46) {
    for (let x = ((y / 46) % 2 === 0 ? 0 : 46); x < CANVAS_W; x += 92) {
      ctx.fillRect(x, y, 44, 44);
    }
  }
  // Karpet tengah dapur.
  ctx.fillStyle = '#b33939';
  roundRect(ctx, 420, 300, 440, 300, 18);
  ctx.fill();
  ctx.strokeStyle = '#f5d76e';
  ctx.lineWidth = 4;
  roundRect(ctx, 436, 316, 408, 268, 12);
  ctx.stroke();
  // Jendela senja di dinding.
  ctx.fillStyle = '#ff9d5c';
  roundRect(ctx, 560, 18, 160, 92, 10);
  ctx.fill();
  ctx.fillStyle = '#ffd54f';
  ctx.beginPath();
  ctx.arc(640, 66, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7e57c2';
  ctx.fillRect(560, 92, 160, 18);
}

function drawOrderBoard(ctx, state) {
  ctx.fillStyle = '#3e2723';
  roundRect(ctx, 16, 8, CANVAS_W - 32, 120, 14);
  ctx.fill();
  text(ctx, '📋 PAPAN ORDER', 32, 40, 20, '#ffd54f');
  text(ctx, 'DAPUR SENJA', 32, 66, 13, '#d7ccc8');
  text(ctx, 'WARUNG KILAT', 32, 86, 13, '#d7ccc8');
  if (state.orders.length === 0) {
    text(ctx, 'Belum ada pesanan — bersiap!', 220, 70, 20, '#fff8e1');
    return;
  }
  state.orders.forEach((order, i) => {
    const x = 210 + i * 208;
    const frac = order.patience / order.patienceMax;
    ctx.fillStyle = frac < 0.25 ? '#ffebee' : '#fff8e1';
    roundRect(ctx, x, 18, 196, 100, 10);
    ctx.fill();
    text(ctx, `${order.recipe.emoji} ${order.recipe.name}`, x + 10, 42, 15, '#3e2723');
    text(ctx, order.customer, x + 10, 62, 13, '#6d4c41');
    // Checklist langkah resep.
    const done = state.plateReady && state.plateReady.id === order.recipeId
      ? order.recipe.steps.length : 0;
    text(ctx, `${order.recipe.steps.length} bahan  •  Rp${order.recipe.price}`, x + 10, 82, 13, '#4e342e');
    ctx.fillStyle = '#e0d6c8';
    roundRect(ctx, x + 10, 92, 176, 12, 6);
    ctx.fill();
    ctx.fillStyle = patienceColor(frac);
    roundRect(ctx, x + 10, 92, Math.max(8, 176 * frac), 12, 6);
    ctx.fill();
    text(ctx, `${Math.ceil(order.patience)} dtk`, x + 10, 116, 11, patienceColor(frac));
    if (done > 0) text(ctx, '✅ SIAP SAJI', x + 108, 116, 11, '#2e7d32');
  });
}

function drawStations(ctx, state) {
  for (const st of STATIONS) {
    const near = state.nearStation === st.id;
    const working = state.work && state.work.station === st.id;
    ctx.fillStyle = near ? '#ffe082' : st.color;
    roundRect(ctx, st.x, st.y, st.w, st.h, 12);
    ctx.fill();
    ctx.lineWidth = near ? 5 : 3;
    ctx.strokeStyle = near ? '#ff6f00' : 'rgba(0,0,0,0.35)';
    ctx.stroke();
    text(ctx, st.emoji, st.x + st.w / 2, st.y + 52, 40, '#fff', 'bold', 'center');
    text(ctx, st.label, st.x + st.w / 2, st.y + 82, 17, '#ffffff', 'bold', 'center');
    text(ctx, st.sub, st.x + st.w / 2, st.y + 102, 12, '#ffe0b2', 'normal', 'center');
    if (working) {
      // Bar progres di bawah kotak stasiun supaya tidak menutupi labelnya.
      const barY = st.y + st.h + 8;
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      roundRect(ctx, st.x + 12, barY, st.w - 24, 10, 5);
      ctx.fill();
      ctx.fillStyle = '#76ff03';
      roundRect(ctx, st.x + 12, barY, (st.w - 24) * state.work.progress, 10, 5);
      ctx.fill();
    }
  }
}

function drawPlate(ctx, state) {
  const st = STATIONS.find((s) => s.id === 'assembly');
  const px = st.x + st.w / 2;
  const py = st.y + st.h + 78;
  // Piring di meja rakit.
  ctx.fillStyle = '#eceff1';
  ctx.beginPath();
  ctx.ellipse(px, py, 62, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#90a4ae';
  ctx.lineWidth = 3;
  ctx.stroke();
  if (state.plateReady && plateMatchesRecipe(state.plate, state.plateReady)) {
    // Piring berisi hidangan yang sudah jadi.
    ctx.fillStyle = '#fff176';
    ctx.beginPath();
    ctx.arc(px, py - 26, 34, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, state.plateReady.emoji, px, py - 12, 34, '#000', 'bold', 'center');
    text(ctx, '✨ SIAP SAJI ✨', px, py + 52, 16, '#2e7d32', 'bold', 'center');
  } else if (state.plate.length > 0) {
    // Hidangan masih dirakit: tunjukkan bahan yang sudah diletakkan.
    state.plate.forEach((step, i) => {
      const ing = INGREDIENTS[step.ingredient];
      text(ctx, ing.emoji, px - 34 + i * 34, py - 8, 28, '#000', 'bold', 'center');
    });
    text(ctx, `Rakit: ${state.plate.length} bahan di piring`, px, py + 52, 14, '#3e2723', 'bold', 'center');
  } else {
    text(ctx, 'Piring kosong — rakit hidangan di sini', px, py + 52, 13, '#5d4037', 'normal', 'center');
  }
}

// Nampan hidangan jadi di meja samping: piring siap antar, terpisah dari
// piring rakitan yang masih mid-assembly.
function drawReadyTray(ctx, state) {
  if (!state.plateReady) return;
  const x = 300;
  const y = 400;
  ctx.fillStyle = '#8d6e63';
  roundRect(ctx, x - 110, y - 8, 220, 96, 12);
  ctx.fill();
  ctx.fillStyle = '#eceff1';
  ctx.beginPath();
  ctx.ellipse(x, y + 34, 58, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#90a4ae';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#fff176';
  ctx.beginPath();
  ctx.arc(x, y + 10, 30, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, state.plateReady.emoji, x, y + 22, 32, '#000', 'bold', 'center');
  text(ctx, `✅ ${state.plateReady.name} SIAP ANTAR`, x, y + 76, 15, '#ffffff', 'bold', 'center');
}

function drawChef(ctx, state) {
  const c = state.chef;
  const bob = c.moving ? Math.sin(c.walkPhase) * 3 : 0;
  // Bayangan.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(c.x, c.y + 26, 26, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Badan koki.
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, c.x - 22, c.y - 14 + bob, 44, 44, 14);
  ctx.fill();
  ctx.strokeStyle = '#b0bec5';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Kepala + topi koki.
  ctx.fillStyle = '#ffcc9e';
  ctx.beginPath();
  ctx.arc(c.x, c.y - 24 + bob, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(c.x, c.y - 38 + bob, 15, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(c.x - 15, c.y - 40 + bob, 30, 8);
  // Mata sesuai arah hadap.
  const dx = c.face === 'left' ? -5 : c.face === 'right' ? 5 : 0;
  ctx.fillStyle = '#212121';
  ctx.beginPath();
  ctx.arc(c.x - 6 + dx, c.y - 24 + bob, 2.5, 0, Math.PI * 2);
  ctx.arc(c.x + 6 + dx, c.y - 24 + bob, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // Bawaan di atas kepala.
  if (state.carrying) {
    const ing = ingredientOf(state.carrying);
    ctx.fillStyle = '#fffde7';
    ctx.beginPath();
    ctx.arc(c.x, c.y - 66 + bob, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f9a825';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, ing.emoji, c.x, c.y - 54 + bob, 24, '#000', 'bold', 'center');
    text(ctx, carriedLabel(state.carrying), c.x, c.y - 88 + bob, 12, '#3e2723', 'bold', 'center');
  }
}

function drawPantryPicker(ctx, state) {
  if (state.nearStation !== 'pantry') return;
  const ids = Object.keys(INGREDIENTS);
  const x0 = 260;
  const y = 600;
  ctx.fillStyle = 'rgba(62,39,35,0.92)';
  roundRect(ctx, x0 - 16, y - 34, ids.length * 62 + 32, 92, 12);
  ctx.fill();
  text(ctx, 'Pilih bahan (klik / tombol 1-8 / Q):', x0, y - 12, 14, '#ffd54f');
  ids.forEach((id, i) => {
    const ing = INGREDIENTS[id];
    const x = x0 + i * 62;
    ctx.fillStyle = state.pantryIndex === i ? '#ffe082' : '#fff8e1';
    roundRect(ctx, x, y + 2, 54, 46, 8);
    ctx.fill();
    text(ctx, ing.emoji, x + 27, y + 32, 24, '#000', 'bold', 'center');
    text(ctx, `${i + 1}`, x + 27, y + 44, 10, '#6d4c41', 'bold', 'center');
  });
}

function drawHud(ctx, state) {
  // Timer hari besar di kanan atas dapur.
  const rush = state.rush;
  const pulse = rush ? 1 + Math.sin(state.elapsed * 8) * 0.08 : 1;
  ctx.save();
  ctx.translate(1180, 330);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = rush ? '#c62828' : '#3e2723';
  roundRect(ctx, -86, -34, 172, 76, 12);
  ctx.fill();
  text(ctx, rush ? '🔥 RUSH!' : '⏱️ WAKTU', 0, -8, 15, '#ffd54f', 'bold', 'center');
  text(ctx, formatTime(state.timeLeft), 0, 28, 30, '#ffffff', 'bold', 'center');
  ctx.restore();
  // Skor, koin, combo.
  ctx.fillStyle = 'rgba(62,39,35,0.92)';
  roundRect(ctx, 1060, 420, 204, 132, 12);
  ctx.fill();
  text(ctx, `⭐ Skor: ${state.score}`, 1076, 452, 17, '#fffde7');
  text(ctx, `🪙 Koin: Rp${state.coins}`, 1076, 478, 17, '#fffde7');
  text(ctx, `🍽️ Disajikan: ${state.served}`, 1076, 504, 15, '#fffde7');
  text(ctx, state.combo > 1 ? `🔥 Combo x${state.combo}` : 'Combo: —', 1076, 530, 15, state.combo > 1 ? '#ffab40' : '#bcaaa4');
  text(ctx, `Hari ${state.day}  •  Order: ${state.orders.length}/${4}`, 1076, 548, 12, '#bcaaa4');
  // Pesan toast.
  if (state.messageTimer > 0 && state.message) {
    ctx.fillStyle = 'rgba(46,125,50,0.95)';
    const w = Math.min(560, 40 + state.message.length * 9);
    roundRect(ctx, (CANVAS_W - w) / 2, 624, w, 40, 20);
    ctx.fill();
    text(ctx, state.message, CANVAS_W / 2, 651, 17, '#ffffff', 'bold', 'center');
  }
  // Bantuan kontrol.
  text(ctx, 'Gerak: WASD / panah   •   Interaksi: E / Spasi (tahan untuk potong & masak)   •   Q: ganti bahan   •   R: buang   •   P: jeda   •   M: bisu', 40, 700, 13, '#4e342e');
}

function drawMenu(ctx, state) {
  ctx.fillStyle = 'rgba(62,39,35,0.55)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#fff8e1';
  roundRect(ctx, 290, 90, 700, 500, 20);
  ctx.fill();
  text(ctx, '🍜 DAPUR SENJA 🍜', 640, 170, 52, '#bf360c', 'bold', 'center');
  text(ctx, 'WARUNG KILAT — game masak kilat satu koki', 640, 208, 20, '#6d4c41', 'bold', 'center');
  text(ctx, 'Ambil bahan di pantry, potong di talenen, masak di kompor,', 640, 268, 18, '#3e2723', 'normal', 'center');
  text(ctx, 'rakit di piring, lalu antar ke Jendela Saji sebelum pelanggan', 640, 294, 18, '#3e2723', 'normal', 'center');
  text(ctx, 'kehabisan sabar. Hari cuma 3 menit — makin sore makin ramai!', 640, 320, 18, '#3e2723', 'normal', 'center');
  text(ctx, '🍚 Nasi Goreng Senja    🍜 Mie Ayam Kecap', 640, 372, 18, '#4e342e', 'bold', 'center');
  text(ctx, '🍲 Sup Tomat Telur    🍖 Ayam Bakar Rimba', 640, 400, 18, '#4e342e', 'bold', 'center');
  text(ctx, 'Tekan ENTER atau klik untuk mulai memasak', 640, 470, 20, '#2e7d32', 'bold', 'center');
  text(ctx, 'WASD / panah gerak  •  E interaksi  •  Q ganti bahan  •  P jeda', 640, 510, 15, '#6d4c41', 'normal', 'center');
  text(ctx, 'Game asli — resep, nama, dan gambar dibuat untuk Dapur Senja.', 640, 552, 13, '#8d6e63', 'normal', 'center');
}

function drawDayOver(ctx, state) {
  ctx.fillStyle = 'rgba(62,39,35,0.6)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#fff8e1';
  roundRect(ctx, 340, 150, 600, 380, 20);
  ctx.fill();
  text(ctx, '🌇 WARUNG TUTUP 🌇', 640, 230, 40, '#bf360c', 'bold', 'center');
  text(ctx, `Hari ${state.day} selesai!`, 640, 280, 22, '#3e2723', 'bold', 'center');
  text(ctx, `⭐ Skor akhir: ${state.score}`, 640, 330, 22, '#3e2723', 'bold', 'center');
  text(ctx, `🍽️ Pesanan disajikan: ${state.served}   •   Pesanan hangus: ${state.lost}`, 640, 366, 17, '#4e342e', 'normal', 'center');
  text(ctx, `🔥 Combo terbaik: x${Math.max(1, state.bestCombo)}`, 640, 396, 17, '#4e342e', 'normal', 'center');
  text(ctx, 'Tekan ENTER untuk hari berikutnya — order makin cepat!', 640, 460, 18, '#2e7d32', 'bold', 'center');
}

export function render(ctx, state) {
  drawBackground(ctx);
  drawOrderBoard(ctx, state);
  drawStations(ctx, state);
  drawPlate(ctx, state);
  drawReadyTray(ctx, state);
  drawChef(ctx, state);
  drawPantryPicker(ctx, state);
  if (state.screen === 'playing' || state.screen === 'paused') {
    drawHud(ctx, state);
    if (state.screen === 'paused') {
      ctx.fillStyle = 'rgba(62,39,35,0.55)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      text(ctx, '⏸️ JEDA — tekan P untuk lanjut', 640, 360, 32, '#ffffff', 'bold', 'center');
    }
  }
  if (state.screen === 'menu') drawMenu(ctx, state);
  if (state.screen === 'dayover') drawDayOver(ctx, state);
}
