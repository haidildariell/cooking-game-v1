// input.js — keyboard dan mouse untuk "Dapur Senja".
// Keyboard: WASD / panah gerak, E atau Spasi interaksi, Q ganti bahan pantry,
// 1-8 pilih bahan pantry, R buang bawaan, M bisu, P jeda, Enter mulai.
// Mouse: klik stasiun = jalan ke sana lalu interaksi; klik tombol bahan pantry.

export function createInput(canvas) {
  const input = {
    keys: new Set(),
    moveX: 0,
    moveY: 0,
    interactHeld: false,
    interactPressed: false,
    click: null, // {x, y} klik terakhir yang belum diproses
    mouse: { x: 0, y: 0 },
    muted: false,
  };

  const KEY_ACTIONS = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
  };

  function refreshMove() {
    input.moveX = (input.keys.has('right') ? 1 : 0) - (input.keys.has('left') ? 1 : 0);
    input.moveY = (input.keys.has('down') ? 1 : 0) - (input.keys.has('up') ? 1 : 0);
  }

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    const action = KEY_ACTIONS[event.code];
    if (action) input.keys.add(action);
    if (event.code === 'KeyE' || event.code === 'Space') {
      if (!event.repeat) input.interactPressed = true;
      input.interactHeld = true;
    }
    if (event.code === 'KeyM' && !event.repeat) input.muted = !input.muted;
    if (event.code === 'KeyQ' && !event.repeat) input.cyclePantry = true;
    if (event.code === 'KeyR' && !event.repeat) input.discardPressed = true;
    if (event.code === 'KeyP' && !event.repeat) input.pausePressed = true;
    if (event.code === 'Enter' && !event.repeat) input.confirmPressed = true;
    const digit = /^Digit([1-8])$/.exec(event.code);
    if (digit) input.pickIngredient = Number(digit[1]) - 1;
    refreshMove();
  });

  window.addEventListener('keyup', (event) => {
    const action = KEY_ACTIONS[event.code];
    if (action) input.keys.delete(action);
    if (event.code === 'KeyE' || event.code === 'Space') input.interactHeld = false;
    refreshMove();
  });

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  canvas.addEventListener('pointerdown', (event) => {
    const point = canvasPoint(event);
    input.mouse = point;
    input.click = point;
  });
  canvas.addEventListener('pointermove', (event) => {
    input.mouse = canvasPoint(event);
  });

  // Dipanggil tiap frame sesudah main.js membaca input sekali jalan.
  input.endFrame = () => {
    input.interactPressed = false;
    input.click = null;
    input.cyclePantry = false;
    input.discardPressed = false;
    input.pausePressed = false;
    input.confirmPressed = false;
    input.pickIngredient = undefined;
  };

  return input;
}
