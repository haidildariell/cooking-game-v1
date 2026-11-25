// state.js — state game "Dapur Senja": chef, bawaan, piring, order, skor, hari.
// Juga membangun state deterministik untuk screenshot (?shot=cover|play|serve|menu).

import { DAY_SECONDS, RUSH_SECONDS, RECIPES, INGREDIENTS } from './config.js';
import { makeOrder } from './recipes.js';

export function createState() {
  return {
    screen: 'menu', // menu | playing | paused | dayover
    chef: { x: 640, y: 430, face: 'down', moving: false, walkPhase: 0 },
    carrying: null, // {ingredient, state} atau null
    plate: [], // langkah yang sudah dirakit di piring
    plateReady: null, // recipe yang sudah jadi di piring
    orders: [],
    lastSpawnAt: 0,
    timeLeft: DAY_SECONDS,
    elapsed: 0,
    score: 0,
    coins: 0,
    served: 0,
    combo: 0,
    comboTimer: 0,
    rush: false,
    day: 1,
    work: null, // {station, progress, seconds} pekerjaan potong/masak yang berjalan
    moveTarget: null,
    pantryIndex: 0,
    message: '',
    messageTimer: 0,
    bestCombo: 0,
    lost: 0,
  };
}

// Item bawaan yang sudah diproses: {ingredient, state}
export function makeCarried(ingredientId, state) {
  return { ingredient: ingredientId, state };
}

export function ingredientOf(item) {
  return INGREDIENTS[item.ingredient];
}

export function carriedLabel(item) {
  if (!item) return '';
  const ing = INGREDIENTS[item.ingredient];
  const suffix = item.state === 'chopped' ? ' (iris)' : item.state === 'cooked' ? ' (matang)' : '';
  return `${ing.name}${suffix}`;
}

// ---- Mode screenshot deterministik: dipakai ?shot=cover|play|serve|menu ----

function demoOrder(recipeIdx, patienceLeft, patienceMax) {
  const recipe = RECIPES[recipeIdx];
  const order = makeOrder(recipe, false);
  order.patience = patienceLeft;
  order.patienceMax = patienceMax;
  return order;
}

export function buildShotState(kind) {
  const s = createState();
  s.screen = 'playing';
  if (kind === 'menu') {
    s.screen = 'menu';
    return s;
  }
  if (kind === 'serve') {
    s.elapsed = 96;
    s.timeLeft = 84;
    s.score = 1240;
    s.coins = 1240;
    s.served = 7;
    s.combo = 3;
    s.chef = { x: 1000, y: 430, face: 'up', moving: false, walkPhase: 0 };
    s.plateReady = RECIPES[1];
    s.plate = RECIPES[1].steps.map((st) => ({ ingredient: st.ingredient, state: st.state }));
    s.orders = [demoOrder(1, 18, 60), demoOrder(0, 41, 55), demoOrder(3, 52, 65)];
    s.message = 'Mie Ayam Kecap siap! Antar ke Jendela Saji!';
    s.messageTimer = 5;
    return s;
  }
  if (kind === 'play') {
    s.elapsed = 58;
    s.timeLeft = 122;
    s.score = 640;
    s.coins = 640;
    s.served = 4;
    s.combo = 2;
    s.chef = { x: 520, y: 460, face: 'right', moving: true, walkPhase: 2 };
    s.carrying = makeCarried('ayam', 'chopped');
    s.work = { station: 'stove', progress: 0.45, seconds: 2.6 };
    s.plate = [{ ingredient: 'mie', state: 'cooked' }, { ingredient: 'ayam', state: 'cooked' }];
    s.orders = [demoOrder(1, 33, 60), demoOrder(2, 22, 50), demoOrder(0, 47, 55)];
    return s;
  }
  // cover: dapur paling ramai — 4 order, hidangan mid-assembly + piring siap saji.
  s.elapsed = 112;
  s.timeLeft = 68;
  s.rush = true;
  s.score = 1890;
  s.coins = 1890;
  s.served = 11;
  s.combo = 4;
  s.bestCombo = 4;
  s.chef = { x: 640, y: 480, face: 'right', moving: true, walkPhase: 1 };
  s.carrying = makeCarried('tomat', 'chopped');
  s.plate = [{ ingredient: 'nasi', state: 'raw' }, { ingredient: 'telur', state: 'cooked' }];
  s.plateReady = RECIPES[3];
  s.orders = [demoOrder(0, 12, 55), demoOrder(3, 28, 65), demoOrder(1, 44, 60), demoOrder(2, 19, 50)];
  s.message = 'RUSH! Pesanan datang lebih cepat!';
  s.messageTimer = 5;
  return s;
}

export function updateRush(state) {
  state.rush = state.timeLeft <= RUSH_SECONDS && state.timeLeft > 0;
}
