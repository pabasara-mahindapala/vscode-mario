// ─── Constants ────────────────────────────────────────────────────────────────
const TILE      = 16;
const GRAVITY   = 1200;
const JUMP_VEL  = -400;
const MAX_VX    = 120;
const MOVE_ACCEL = 900;
const FRICTION  = 800;

// Solid tile IDs
const SOLID = new Set([1, 2, 7, 8]);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

function tileAt(map, wx, wy) {
  const col = Math.floor(wx / TILE);
  const row = Math.floor(wy / TILE);
  if (row < 0 || row >= map.length || col < 0 || col >= map[0].length) return 0;
  return map[row][col];
}

function isSolid(map, wx, wy) { return SOLID.has(tileAt(map, wx, wy)); }

// AABB overlap test
function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

// Resolve entity against solid tiles (move X first, then Y)
function resolveVsTiles(e, map, dt) {
  // ── X axis ──
  e.x += e.vx * dt;
  const leftCol  = Math.floor(e.x / TILE);
  const rightCol = Math.floor((e.x + e.w - 1) / TILE);
  const topRow   = Math.floor(e.y / TILE);
  const botRow   = Math.floor((e.y + e.h - 1) / TILE);

  for (let r = topRow; r <= botRow; r++) {
    if (SOLID.has(map[r]?.[leftCol])) {
      e.x = (leftCol + 1) * TILE;
      e.vx = 0;
    }
    if (SOLID.has(map[r]?.[rightCol])) {
      e.x = rightCol * TILE - e.w;
      e.vx = 0;
    }
  }

  // ── Y axis ──
  e.onGround = false;
  e.y += e.vy * dt;
  const l2 = Math.floor(e.x / TILE);
  const r2 = Math.floor((e.x + e.w - 1) / TILE);
  const t2 = Math.floor(e.y / TILE);
  const b2 = Math.floor((e.y + e.h - 1) / TILE);

  for (let c = l2; c <= r2; c++) {
    if (SOLID.has(map[t2]?.[c])) {
      e.y = (t2 + 1) * TILE;
      e.vy = 0;
    }
    if (SOLID.has(map[b2]?.[c])) {
      e.y = b2 * TILE - e.h;
      e.vy = 0;
      e.onGround = true;
    }
  }
}

// ─── Player ───────────────────────────────────────────────────────────────────
class Player {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.w = 14; this.h = 16;
    this.onGround = false;
    this.dead = false;
    this.frame = 0;     // animation frame index
    this.frameTimer = 0;
    this.facing = 1;    // 1 = right, -1 = left
  }

  update(keys, map, dt) {
    if (this.dead) return;

    // ── Horizontal movement ──
    const left  = keys.has('ArrowLeft');
    const right = keys.has('ArrowRight');

    if (right) { this.vx = Math.min(this.vx + MOVE_ACCEL * dt, MAX_VX); this.facing = 1; }
    if (left)  { this.vx = Math.max(this.vx - MOVE_ACCEL * dt, -MAX_VX); this.facing = -1; }

    if (!left && !right) {
      const friction = FRICTION * dt;
      if (this.vx > 0) this.vx = Math.max(0, this.vx - friction);
      if (this.vx < 0) this.vx = Math.min(0, this.vx + friction);
    }

    // ── Jump ──
    this.justJumped = false;
    if ((keys.has('Space') || keys.has('ArrowUp')) && this.onGround) {
      this.vy = JUMP_VEL;
      this.onGround = false;
      this.justJumped = true;
    }

    this.vy += GRAVITY * dt;
    resolveVsTiles(this, map, dt);

    // ── Animation ──
    this.frameTimer += dt;
    if (this.frameTimer > 0.1) {
      this.frameTimer = 0;
      if (Math.abs(this.vx) > 5) this.frame = (this.frame + 1) % 3;
      else this.frame = 0;
    }
  }
}

// ─── Goomba ───────────────────────────────────────────────────────────────────
class Goomba {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.vx = -50; this.vy = 0;
    this.w = 14; this.h = 14;
    this.onGround = false;
    this.dead = false;
    this.squished = false; // played stomp animation
    this.squishTimer = 0;
  }

  update(map, dt) {
    if (this.dead) return;
    if (this.squished) {
      this.squishTimer -= dt;
      if (this.squishTimer <= 0) this.dead = true;
      return;
    }

    this.vy += GRAVITY * dt;
    const prevVx = this.vx;
    resolveVsTiles(this, map, dt);

    // Reverse on wall hit
    if (this.vx === 0 && prevVx !== 0) this.vx = -prevVx;
  }

  stomp() {
    this.squished = true;
    this.squishTimer = 0.4;
    this.vy = 0; this.vx = 0;
  }
}

// ─── Game state ───────────────────────────────────────────────────────────────
class Game {
  constructor(map, enemySpawns) {
    this.map = map;
    this.enemySpawns = enemySpawns;
    this.cols = map[0].length;
    this.rows = map.length;
    this.reset();
  }

  reset() {
    this.player  = new Player(2 * TILE, 9 * TILE);
    this.goombas = this.enemySpawns.map(([tx, ty]) => new Goomba(tx * TILE, ty * TILE));
    this.coins   = this._collectCoins();
    this.score   = 0;
    this.state   = 'playing'; // 'playing' | 'won' | 'dead'
    this.cameraX = 0;
  }

  _collectCoins() {
    const coins = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.map[r][c] === 3) {
          coins.push({ x: c * TILE + 3, y: r * TILE + 3, w: 10, h: 10, taken: false });
        }
      }
    }
    return coins;
  }

  update(keys, dt) {
    if (this.state !== 'playing') return;

    const p = this.player;
    p.update(keys, this.map, dt);

    // ── Fell into a pit ──
    if (p.y > this.rows * TILE) {
      this.state = 'dead';
      return;
    }

    // ── Coins ──
    for (const coin of this.coins) {
      if (!coin.taken && overlaps(p, coin)) {
        coin.taken = true;
        this.score += 100;
      }
    }

    // ── Goombas ──
    for (const g of this.goombas) {
      g.update(this.map, dt);
      if (g.dead || g.squished) continue;

      if (overlaps(p, g)) {
        const playerBottom = p.y + p.h;
        const goombaTop    = g.y + 4; // small tolerance
        const stompedFromAbove = p.vy > 0 && playerBottom <= goombaTop + 6;

        if (stompedFromAbove) {
          g.stomp();
          p.vy = -250;
          this.score += 200;
        } else {
          this.state = 'dead';
          return;
        }
      }
    }

    // ── Flag (tile 4 at col 79, row 9) — check AABB vs the tile cell ──
    const flagCol = this.map[9].indexOf(4);
    if (flagCol !== -1) {
      const flag = { x: flagCol * TILE, y: 9 * TILE, w: TILE, h: TILE * 5 };
      if (overlaps(p, flag)) {
        this.state = 'won';
        return;
      }
    }

    // ── Camera ──
    const levelW = this.cols * TILE;
    const viewW  = 240; // internal canvas width
    this.cameraX = clamp(p.x - viewW / 2, 0, levelW - viewW);
  }
}

// Export to window so main.js can access
window.Game = Game;
window.TILE = TILE;
