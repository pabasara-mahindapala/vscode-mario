// ─── Canvas setup ─────────────────────────────────────────────────────────────
const canvas = document.getElementById('game');
const ctx    = canvas.getContext('2d');

const W = 240;
const H = 224; // 14 tiles × 16px
canvas.width  = W;
canvas.height = H;
ctx.imageSmoothingEnabled = false;

// ─── Input ────────────────────────────────────────────────────────────────────
const keys = new Set();
window.addEventListener('keydown', e => { keys.add(e.code); e.preventDefault(); });
window.addEventListener('keyup',   e => keys.delete(e.code));

// ─── Pause on focus loss ──────────────────────────────────────────────────────
let paused = false;
let last   = performance.now();
let acc    = 0;
const STEP = 1000 / 60;

const pauseOverlay = document.getElementById('pause-overlay');
window.addEventListener('blur',  () => { paused = true;  pauseOverlay.classList.add('visible'); });
window.addEventListener('focus', () => { paused = false; last = performance.now(); acc = 0; pauseOverlay.classList.remove('visible'); });
pauseOverlay.addEventListener('click', () => window.focus());

// ─── Game instance ────────────────────────────────────────────────────────────
let game;
function initGame() {
  game = new window.Game(window.LEVEL, window.ENEMY_SPAWNS);
}

// ─── Procedural drawing helpers ───────────────────────────────────────────────
const S = 16;

function drawGround(dx, dy) {
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(dx, dy, S, S);
  ctx.fillStyle = '#228B22';
  ctx.fillRect(dx, dy, S, 4);
  ctx.fillStyle = '#6B3410';
  ctx.strokeStyle = '#5a2d0c';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(dx + 0.5, dy + 0.5, S - 1, S - 1);
}

function drawBrick(dx, dy) {
  ctx.fillStyle = '#C8622E';
  ctx.fillRect(dx, dy, S, S);
  ctx.fillStyle = '#E07040';
  ctx.fillRect(dx + 1, dy + 1, S - 2, 6);
  ctx.fillRect(dx + 1, dy + 9, S - 2, 6);
  ctx.fillStyle = '#A0502A';
  ctx.fillRect(dx, dy + 7, S, 2);
  ctx.fillRect(dx + 7, dy, 2, 7);
  ctx.fillRect(dx + 3, dy + 9, 2, 6);
}

function drawCoin(dx, dy) {
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(dx + 8, dy + 8, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFA500';
  ctx.beginPath();
  ctx.arc(dx + 7, dy + 7, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawCloud(dx, dy) {
  ctx.fillStyle = '#fff';
  // Three overlapping circles
  ctx.beginPath(); ctx.arc(dx + 8, dy + 10, 6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(dx + 14, dy + 11, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(dx + 2, dy + 11, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(dx - 2, dy + 11, 22, 5);
}

function drawPipeTop(dx, dy) {
  ctx.fillStyle = '#228B22';
  ctx.fillRect(dx - 1, dy, S + 2, S);
  ctx.fillStyle = '#1a6b1a';
  ctx.fillRect(dx, dy + 2, S, S - 2);
  ctx.fillStyle = '#33aa33';
  ctx.fillRect(dx + 1, dy, 3, S);
}

function drawPipeBody(dx, dy) {
  ctx.fillStyle = '#228B22';
  ctx.fillRect(dx, dy, S, S);
  ctx.fillStyle = '#33aa33';
  ctx.fillRect(dx + 1, dy, 3, S);
  ctx.fillStyle = '#1a6b1a';
  ctx.fillRect(dx + S - 3, dy, 3, S);
}

function drawFlag(dx, dy) {
  // Pole
  ctx.fillStyle = '#888';
  ctx.fillRect(dx + 13, dy, 3, S * 5);
  // Flag
  ctx.fillStyle = '#e00';
  ctx.beginPath();
  ctx.moveTo(dx + 16, dy + 2);
  ctx.lineTo(dx + 16, dy + 12);
  ctx.lineTo(dx + 6,  dy + 7);
  ctx.closePath();
  ctx.fill();
}

function drawPlayer(dx, dy, frame, onGround, facing) {
  const flip = facing === -1;
  if (flip) { ctx.save(); ctx.scale(-1, 1); dx = -dx - S; }

  // Hat
  ctx.fillStyle = '#e00';
  ctx.fillRect(dx + 2, dy, 12, 5);
  // Face
  ctx.fillStyle = '#f5c07a';
  ctx.fillRect(dx + 1, dy + 5, 14, 7);
  // Eyes
  ctx.fillStyle = '#000';
  ctx.fillRect(dx + 3, dy + 6, 2, 2);
  ctx.fillRect(dx + 10, dy + 6, 2, 2);
  // Mustache
  ctx.fillStyle = '#a0522d';
  ctx.fillRect(dx + 2, dy + 9, 12, 2);
  // Body
  ctx.fillStyle = '#1a5fd4';
  ctx.fillRect(dx + 2, dy + 12, 12, 4);
  // Legs — animate when walking
  ctx.fillStyle = '#e00';
  if (!onGround) {
    // Jump pose — legs spread
    ctx.fillRect(dx, dy + 13, 6, 3);
    ctx.fillRect(dx + 10, dy + 13, 6, 3);
  } else if (frame === 1) {
    ctx.fillRect(dx + 1, dy + 13, 5, 3);
    ctx.fillRect(dx + 9, dy + 12, 6, 3);
  } else if (frame === 2) {
    ctx.fillRect(dx + 1, dy + 12, 6, 3);
    ctx.fillRect(dx + 9, dy + 13, 5, 3);
  } else {
    ctx.fillRect(dx + 2, dy + 12, 5, 3);
    ctx.fillRect(dx + 9, dy + 12, 5, 3);
  }

  if (flip) ctx.restore();
}

function drawGoomba(dx, dy, squished) {
  if (squished) {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(dx, dy + 10, S, 4);
    ctx.fillStyle = '#000';
    ctx.fillRect(dx + 3, dy + 9, 4, 4);
    ctx.fillRect(dx + 9, dy + 9, 4, 4);
    return;
  }
  // Body
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(dx + 2, dy + 2, 12, 12);
  // Head bump
  ctx.beginPath();
  ctx.arc(dx + 8, dy + 5, 6, 0, Math.PI * 2);
  ctx.fill();
  // Eyes
  ctx.fillStyle = '#fff';
  ctx.fillRect(dx + 3, dy + 3, 4, 3);
  ctx.fillRect(dx + 9, dy + 3, 4, 3);
  ctx.fillStyle = '#000';
  ctx.fillRect(dx + 4, dy + 4, 2, 2);
  ctx.fillRect(dx + 10, dy + 4, 2, 2);
  // Feet
  ctx.fillStyle = '#000';
  ctx.fillRect(dx + 1, dy + 12, 5, 4);
  ctx.fillRect(dx + 10, dy + 12, 5, 4);
}

// ─── Render ───────────────────────────────────────────────────────────────────
function renderWorld() {
  const map      = game.map;
  const camX     = game.cameraX;
  const startCol = Math.floor(camX / S);
  const endCol   = Math.min(startCol + Math.ceil(W / S) + 2, map[0].length);

  for (let r = 0; r < map.length; r++) {
    for (let c = startCol; c < endCol; c++) {
      const id = map[r][c];
      if (id === 0) continue;

      const dx = c * S - camX;
      const dy = r * S;

      if (id === 1) { drawGround(dx, dy); continue; }
      if (id === 2) { drawBrick(dx, dy); continue; }
      if (id === 7) { drawPipeTop(dx, dy); continue; }
      if (id === 8) { drawPipeBody(dx, dy); continue; }
      if (id === 4) { drawFlag(dx, dy); continue; }

      if (id === 6) {
        // Only draw cloud once (at the leftmost cell of a cloud run)
        const leftId = map[r]?.[c - 1];
        if (leftId !== 6) drawCloud(dx, dy);
        continue;
      }

      if (id === 3) {
        const coin = game.coins.find(
          co => Math.floor((co.x + 3) / S) === c && Math.floor((co.y + 3) / S) === r
        );
        if (!coin || !coin.taken) drawCoin(dx, dy);
      }
    }
  }
}

function renderGoombas() {
  const camX  = game.cameraX;
  for (const g of game.goombas) {
    if (g.dead) continue;
    const dx = g.x - camX;
    if (dx < -S || dx > W + S) continue;
    drawGoomba(Math.round(dx), Math.round(g.y), g.squished);
  }
}

function renderPlayer() {
  const p  = game.player;
  const dx = Math.round(p.x - game.cameraX);
  const dy = Math.round(p.y);
  drawPlayer(dx, dy, p.frame, p.onGround, p.facing);
}

function renderHUD() {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, W, 14);
  ctx.fillStyle = '#fff';
  ctx.font = '8px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE: ${game.score}`, 4, 10);
  const taken = game.coins.filter(c => c.taken).length;
  const total = game.coins.length;
  ctx.fillText(`COINS: ${taken}/${total}`, W / 2 - 20, 10);
}

function renderOverlay(line1, line2) {
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(20, 70, W - 40, 80);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(line1, W / 2, 105);
  if (line2) { ctx.font = '9px monospace'; ctx.fillText(line2, W / 2, 120); }
  ctx.font = '8px monospace';
  ctx.fillStyle = '#aaa';
  ctx.fillText('press R to restart', W / 2, 136);
  ctx.textAlign = 'left';
}

function render() {
  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#5bb8f5');
  sky.addColorStop(1, '#9bd4f0');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  renderWorld();
  renderGoombas();
  renderPlayer();
  renderHUD();

  if (game.state === 'won')  renderOverlay('YOU WIN! 🎉', `Score: ${game.score}`);
  if (game.state === 'dead') renderOverlay('GAME OVER', `Score: ${game.score}`);
}

// ─── Game loop ────────────────────────────────────────────────────────────────
function frame(now) {
  if (!paused) {
    acc += now - last;
    if (acc > 250) acc = 250; // prevent spiral-of-death after long pauses

    while (acc >= STEP) {
      if (keys.has('KeyR') && game.state !== 'playing') { initGame(); acc = 0; break; }
      game.update(keys, STEP / 1000);
      acc -= STEP;
    }
    render();
  }
  last = now;
  requestAnimationFrame(frame);
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
initGame();
last = performance.now();
requestAnimationFrame(frame);
