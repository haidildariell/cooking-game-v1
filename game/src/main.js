// main.js — loop dan aturan main "Dapur Senja".
// Chef jalan di lantai dapur; dekat stasiun tekan E (atau klik stasiun) untuk
// berinteraksi. Potong dan masak butuh menahan E sampai progres penuh.
// ?shot=cover|play|serve|menu menampilkan state demo deterministik untuk screenshot.

import { CANVAS_W, CANVAS_H, STATIONS, INGREDIENTS, RECIPES, CHEF_SPEED, CHEF_RADIUS, DAY_SECONDS, CHOP_SECONDS, COOK_SECONDS, COMBO_WINDOW } from './config.js';
import { createInput } from './input.js';
import { createState, buildShotState, updateRush, carriedLabel } from './state.js';
import { makeOrder, pickRecipeForOrder, shouldSpawnOrder, plateMatchesRecipe, nextMissingStep, serveScore, recipeById } from './recipes.js';
import { render } from './render.js';
import { createAudio } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const audio = createAudio();
const params = new URLSearchParams(window.location.search);
const shotKind = params.get('shot');
const state = shotKind ? buildShotState(shotKind) : createState();
// Hook debug untuk playtest otomatis (tidak memengaruhi permainan).
window.__dapur = { state, input };

let lastTime = performance.now();

function stationAt(x, y) {
  for (const st of STATIONS) {
    if (x >= st.x - 14 && x <= st.x + st.w + 14 && y >= st.y - 14 && y <= st.y + st.h + 14) return st;
  }
  return null;
}

function nearestStation() {
  let best = null;
  let bestD = 110;
  for (const st of STATIONS) {
    const cx = st.x + st.w / 2;
    const cy = st.y + st.h / 2;
    const d = Math.hypot(state.chef.x - cx, state.chef.y - cy);
    if (d < bestD) { bestD = d; best = st; }
  }
  return best;
}

function setMessage(msg, seconds = 3) {
  state.message = msg;
  state.messageTimer = seconds;
}

function startDay() {
  state.screen = 'playing';
  state.timeLeft = DAY_SECONDS;
  state.elapsed = 0;
  state.orders = [];
  state.lastSpawnAt = 0;
  state.plate = [];
  state.plateReady = null;
  state.carrying = null;
  state.work = null;
  audio.startMusic(false);
}

function endDay() {
  state.screen = 'dayover';
  audio.stopMusic();
  audio.bell();
}

function interactWith(station) {
  if (!station) return;
  const chef = state.chef;
  if (station.id === 'pantry') {
    if (state.carrying) { setMessage('Tangan sudah penuh — antar atau buang dulu.'); return; }
    const id = Object.keys(INGREDIENTS)[state.pantryIndex];
    state.carrying = { ingredient: id, state: 'raw' };
    audio.pickup();
    setMessage(`Mengambil ${INGREDIENTS[id].name}.`);
    return;
  }
  if (station.id === 'trash') {
    if (state.carrying) {
      setMessage(`Membuang ${carriedLabel(state.carrying)}.`);
      state.carrying = null;
      state.work = null;
      audio.fail();
    }
    return;
  }
  if (station.id === 'chopping' || station.id === 'stove') {
    if (!state.carrying) { setMessage('Tidak ada yang dibawa — ambil bahan dulu.'); return; }
    const ing = INGREDIENTS[state.carrying.ingredient];
    if (station.id === 'chopping') {
      if (!ing.chop) { setMessage(`${ing.name} tidak perlu dipotong.`); return; }
      if (state.carrying.state !== 'raw') { setMessage('Sudah dipotong / sudah matang.'); return; }
      state.work = { station: 'chopping', progress: 0, seconds: CHOP_SECONDS };
    } else {
      if (!ing.cook) { setMessage(`${ing.name} tidak perlu dimasak.`); return; }
      if (state.carrying.state === 'cooked') { setMessage('Sudah matang.'); return; }
      state.work = { station: 'stove', progress: 0, seconds: COOK_SECONDS };
      audio.sizzle();
    }
    return;
  }
  if (station.id === 'assembly') {
    if (state.plateReady) { setMessage('Piring sudah jadi — antar ke Jendela Saji!'); return; }
    if (!state.carrying) { setMessage('Tidak ada bahan dibawa.'); return; }
    const item = state.carrying;
    state.plate.push({ ingredient: item.ingredient, state: item.state });
    state.carrying = null;
    audio.place();
    // Cek apakah piring cocok dengan salah satu resep.
    for (const recipe of RECIPES) {
      if (plateMatchesRecipe(state.plate, recipe)) {
        state.plateReady = recipe;
        setMessage(`${recipe.name} jadi! Antar ke Jendela Saji!`, 4);
        audio.bell();
        return;
      }
    }
    // Beri petunjuk langkah berikutnya untuk resep yang paling cocok.
    let hint = null;
    for (const recipe of RECIPES) {
      const missing = nextMissingStep(state.plate, recipe);
      if (missing) { hint = { recipe, missing }; break; }
    }
    if (hint) {
      const ing = INGREDIENTS[hint.missing.ingredient];
      const need = hint.missing.state === 'chopped' ? 'iris' : hint.missing.state === 'cooked' ? 'matang' : 'mentah';
      setMessage(`Piring: ${state.plate.length} bahan. Butuh ${ing.name} ${need} untuk ${hint.recipe.name}.`);
    }
    return;
  }
  if (station.id === 'serve') {
    if (!state.plateReady) { setMessage('Belum ada hidangan jadi di piring.'); return; }
    const order = state.orders.find((o) => o.recipeId === state.plateReady.id);
    if (!order) {
      setMessage(`Tidak ada yang pesan ${state.plateReady.name} — tunggu ordernya!`);
      return;
    }
    const points = serveScore(order, state);
    state.score += points;
    state.coins += points;
    state.served += 1;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.comboTimer = COMBO_WINDOW;
    state.orders = state.orders.filter((o) => o !== order);
    setMessage(`Disajikan! ${order.recipe.name} +${points} poin`, 3);
    audio.coin();
    audio.bell();
    state.plate = [];
    state.plateReady = null;
    return;
  }
}

function finishWork() {
  const work = state.work;
  if (!work || !state.carrying) { state.work = null; return; }
  if (work.station === 'chopping') {
    state.carrying.state = 'chopped';
    setMessage(`${INGREDIENTS[state.carrying.ingredient].name} selesai dipotong.`);
    audio.chop();
  } else {
    state.carrying.state = 'cooked';
    setMessage(`${INGREDIENTS[state.carrying.ingredient].name} matang!`);
    audio.sizzle();
  }
  state.work = null;
}

function update(dt) {
  if (state.screen === 'menu') {
    if (input.confirmPressed || input.click) {
      audio.unlock();
      startDay();
    }
    return;
  }
  if (state.screen === 'dayover') {
    if (input.confirmPressed) {
      state.day += 1;
      startDay();
    }
    return;
  }
  if (state.screen !== 'playing') return;

  if (input.pausePressed) {
    state.screen = 'paused';
    return;
  }
  if (input.muted !== audio.muted) audio.muted = input.muted;

  // Klik mouse: pilih bahan pantry atau jalan ke stasiun.
  if (input.click) {
    const p = input.click;
    if (state.nearStation === 'pantry' && p.y > 600) {
      const ids = Object.keys(INGREDIENTS);
      const idx = Math.floor((p.x - 260) / 62);
      if (idx >= 0 && idx < ids.length) {
        state.pantryIndex = idx;
        interactWith(STATIONS.find((s) => s.id === 'pantry'));
      }
    } else {
      const st = stationAt(p.x, p.y);
      if (st) state.moveTarget = { x: st.x + st.w / 2, y: st.y + st.h + 60 };
    }
  }
  if (input.cyclePantry) {
    state.pantryIndex = (state.pantryIndex + 1) % Object.keys(INGREDIENTS).length;
  }
  if (input.pickIngredient !== undefined) {
    state.pantryIndex = input.pickIngredient % Object.keys(INGREDIENTS).length;
  }
  if (input.discardPressed && state.carrying) {
    setMessage(`Membuang ${carriedLabel(state.carrying)}.`);
    state.carrying = null;
    state.work = null;
  }

  // Gerakan chef: keyboard atau target klik.
  const chef = state.chef;
  let vx = input.moveX;
  let vy = input.moveY;
  if (state.moveTarget && vx === 0 && vy === 0) {
    const dx = state.moveTarget.x - chef.x;
    const dy = state.moveTarget.y - chef.y;
    const d = Math.hypot(dx, dy);
    if (d < 8) state.moveTarget = null;
    else { vx = dx / d; vy = dy / d; }
  }
  if (vx !== 0 || vy !== 0) {
    const len = Math.hypot(vx, vy);
    chef.x += (vx / len) * CHEF_SPEED * dt;
    chef.y += (vy / len) * CHEF_SPEED * dt;
    chef.moving = true;
    chef.walkPhase += dt * 10;
    chef.face = Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? 'right' : 'left') : (vy > 0 ? 'down' : 'up');
  } else {
    chef.moving = false;
  }
  chef.x = Math.max(CHEF_RADIUS + 30, Math.min(CANVAS_W - CHEF_RADIUS - 30, chef.x));
  chef.y = Math.max(300, Math.min(CANVAS_H - 60, chef.y));

  state.nearStation = nearestStation() ? nearestStation().id : null;

  // Interaksi: tekan E sekali untuk aksi instan, tahan untuk potong/masak.
  const near = nearestStation();
  if (input.interactPressed && near) interactWith(near);
  if (state.work) {
    if (input.interactHeld && near && near.id === state.work.station) {
      state.work.progress += dt / state.work.seconds;
      if (state.work.progress >= 1) finishWork();
    } else if (!input.interactHeld) {
      // Lepas tombol: progres kerja tertahan (tidak reset).
    }
  }

  // Waktu hari + order.
  state.elapsed += dt;
  state.timeLeft -= dt;
  updateRush(state);
  if (state.rush && !state.rushMusic) { state.rushMusic = true; audio.startMusic(true); }
  if (!state.rush) state.rushMusic = false;
  if (state.timeLeft <= 0) { endDay(); return; }
  if (shouldSpawnOrder(state, state.elapsed)) {
    const recipe = pickRecipeForOrder(state);
    const order = makeOrder(recipe, state.rush);
    order.bornAt = state.elapsed;
    state.orders.push(order);
    state.lastSpawnAt = state.elapsed;
    audio.bell();
    setMessage(`Order baru: ${recipe.name} (${order.customer})`, 3);
  }
  // Timer sabar order.
  for (const order of [...state.orders]) {
    order.patience -= dt;
    if (order.patience <= 0) {
      state.orders = state.orders.filter((o) => o !== order);
      state.lost += 1;
      state.combo = 0;
      setMessage(`${order.customer} pergi kecewa — ${order.recipe.name} hangus.`, 3);
      audio.fail();
    }
  }
  if (state.comboTimer > 0) {
    state.comboTimer -= dt;
    if (state.comboTimer <= 0) state.combo = 0;
  }
  if (state.messageTimer > 0) state.messageTimer -= dt;
}

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  render(ctx, state);
  input.endFrame();
  requestAnimationFrame(frame);
}

canvas.width = CANVAS_W;
canvas.height = CANVAS_H;
requestAnimationFrame(frame);
