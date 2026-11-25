// recipes.js — order pelanggan, pencocokan resep, dan skor "Dapur Senja".
// Order: satu resep + pelanggan + timer sabar. Piring rakitan dicocokkan langkah
// demi langkah; hidangan jadi hanya bila semua langkah terpenuhi.

import { RECIPES, MAX_ORDERS, ORDER_SPAWN_EVERY, ORDER_SPAWN_RUSH } from './config.js';

let orderCounter = 0;

export function makeOrder(recipe, rush) {
  orderCounter += 1;
  const patience = recipe.patience * (rush ? 0.8 : 1);
  return {
    id: orderCounter,
    recipeId: recipe.id,
    recipe,
    customer: pickCustomer(orderCounter),
    patience,
    patienceMax: patience,
    bornAt: 0,
  };
}

const CUSTOMERS = ['👵 Bu Ratna', '🧑 Budi', '👩 Sari', '👨 Pak Dedi', '🧕 Aisyah', '👴 Mbah Jo', '👧 Lila', '🧔 Bang Ozi'];

function pickCustomer(seed) {
  return CUSTOMERS[seed % CUSTOMERS.length];
}

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

// Apakah isi piring (array langkah {ingredient, state}) sama persis dengan resep?
export function plateMatchesRecipe(plateSteps, recipe) {
  if (plateSteps.length !== recipe.steps.length) return false;
  const want = recipe.steps.map((s) => `${s.ingredient}:${s.state}`).sort().join('|');
  const have = plateSteps.map((s) => `${s.ingredient}:${s.state}`).sort().join('|');
  return want === have;
}

// Langkah berikutnya yang masih kurang di piring untuk resep tertentu.
export function nextMissingStep(plateSteps, recipe) {
  const have = plateSteps.map((s) => `${s.ingredient}:${s.state}`);
  for (const step of recipe.steps) {
    const key = `${step.ingredient}:${step.state}`;
    const idx = have.indexOf(key);
    if (idx >= 0) have.splice(idx, 1);
    else return step;
  }
  return null;
}

// Skor antar: harga resep + bonus kecepatan + bonus combo.
export function serveScore(order, state) {
  const speedBonus = Math.round((order.patience / order.patienceMax) * 40);
  const comboBonus = state.combo * 10;
  return order.recipe.price + speedBonus + comboBonus;
}

// Spawner order: interval makin cepat saat rush.
export function spawnInterval(rush) {
  return rush ? ORDER_SPAWN_RUSH : ORDER_SPAWN_EVERY;
}

export function shouldSpawnOrder(state, now) {
  if (state.orders.length >= MAX_ORDERS) return false;
  if (state.orders.length === 0) return true;
  return now - state.lastSpawnAt >= spawnInterval(state.rush);
}

export function pickRecipeForOrder(state) {
  // Hindari tiga order berturut-turut resep yang sama; pilih acak berbobot harga.
  const recent = state.orders.slice(-2).map((o) => o.recipeId);
  const pool = RECIPES.filter((r) => !recent.includes(r.id));
  const list = pool.length > 0 ? pool : RECIPES;
  return list[Math.floor(Math.random() * list.length)];
}
