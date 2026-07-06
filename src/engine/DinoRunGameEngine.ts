// dinoRunEngine.ts

const W = 1200, H = 620;
const GROUND_Y = H - 12;
const GRAVITY = 2200;
const JUMP_VEL = -900;
const INITIAL_SPEED = 420;
const MAX_SPEED = 1100;
const FONT = '"Press Start 2P", monospace';

const C = {
  bg:     '#0f172a',
  ground: '#334155',
  dino:   '#4ade80',  // green
  dinoDark: '#16a34a',
  dinoEye: '#0f172a',
  dead:   '#e74c3c',
  deadDark: '#991b1b',
  cactus: '#4ade80',
  cactusDark: '#16a34a',
  cloud:  '#1e293b',
  star:   '#475569',
} as const;

// ── Types ────────────────────────────────────────────────────────────────
type StateName = 'IDLE' | 'CALIBRATING' | 'ACTIVE' | 'PAUSED' | 'GAME_OVER' | 'WIN';
export type DifficultyKey = 'easy' | 'medium' | 'hard' | 'score_attack';

interface DifficultyConfig {
  label: string; repGoal: number; speed: number; obstacleDelay: number; color: string;
}
export interface ScoreBreakdown {
  repStreak: number; timeMult: number; finalScore: number; secs: number;
}
export interface GameEndResult extends ScoreBreakdown {
  result: 'won' | 'lost'; score: number;
}
interface DinoState {
  x: number; y: number; w: number; h: number;
  vy: number; frame: 0 | 1; frameTimer: number;
  ducking: boolean; dead: boolean;
}
type CactusType = 'sm' | 'tall' | 'dbl';
interface Obstacle { x: number; type: CactusType; w: number; h: number; scored: boolean; }
interface Cloud { x: number; y: number; scrollSpeed: number; alpha: number; }
interface Star { x: number; y: number; size: number; alpha: number; }
export interface DinoRunGameOptions {
  canvas: HTMLCanvasElement;
  difficulty?: DifficultyKey;
  onGameEnd?: (result: GameEndResult) => void;
}

// ── State machine ────────────────────────────────────────────────────────
class StateMachine {
  static STATES: Record<StateName, StateName> = {
    IDLE: 'IDLE', CALIBRATING: 'CALIBRATING',
    ACTIVE: 'ACTIVE', PAUSED: 'PAUSED', GAME_OVER: 'GAME_OVER', WIN: 'WIN',
  };
  static TRANSITIONS: Record<StateName, StateName[]> = {
    IDLE:        ['CALIBRATING'],
    CALIBRATING: ['ACTIVE', 'IDLE'],
    ACTIVE:      ['PAUSED', 'GAME_OVER', 'WIN'],
    PAUSED:      ['ACTIVE', 'GAME_OVER', 'IDLE'],
    GAME_OVER:   ['IDLE'],
    WIN:         ['IDLE'],
  };
  current: StateName;
  private _listeners: Partial<Record<StateName, Array<(from: StateName) => void>>> = {};
  constructor(initial: StateName = 'IDLE') { this.current = initial; }
  is(state: StateName): boolean { return this.current === state; }
  canTransition(to: StateName): boolean {
    return StateMachine.TRANSITIONS[this.current]?.includes(to) ?? false;
  }
  transition(to: StateName): boolean {
    if (!this.canTransition(to)) { console.warn(`Invalid transition: ${this.current} → ${to}`); return false; }
    const from = this.current;
    this.current = to;
    (this._listeners[to] || []).forEach(cb => cb(from));
    return true;
  }
  on(state: StateName, cb: (from: StateName) => void): void {
    (this._listeners[state] ??= []).push(cb);
  }
}

export const DIFFICULTIES: Record<DifficultyKey, DifficultyConfig> = {
  easy:         { label: 'Easy',         repGoal: 10,       speed: 420, obstacleDelay: 5000, color: '#4ade80' },
  medium:       { label: 'Medium',       repGoal: 20,       speed: 420, obstacleDelay: 5000, color: '#38bdf8' },
  hard:         { label: 'Hard',         repGoal: 40,       speed: 420, obstacleDelay: 5000, color: '#fbbf24' },
  score_attack: { label: 'Score Attack', repGoal: Infinity, speed: 420, obstacleDelay: 5000, color: '#e74c3c' },
};

// ── Helpers ──────────────────────────────────────────────────────────────
function rand(min: number, max: number): number { return Math.random() * (max - min) + min; }
function randInt(min: number, max: number): number { return Math.floor(rand(min, max + 1)); }
function pick<T>(arr: T[]): T { return arr[randInt(0, arr.length - 1)]; }

function drawText(
  ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string,
  align: CanvasTextAlign = 'left', baseline: CanvasTextBaseline = 'top'
): void {
  ctx.font = `${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y);
}

function drawRect(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  color: string, strokeColor?: string, strokeWidth?: number
): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth || 2;
    ctx.strokeRect(x + ctx.lineWidth / 2, y + ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
  }
}

// ── Hi-res Dino sprite (80x72 px, 2× scale of original) ─────────────────
function drawDino(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, frame: 0 | 1, ducking: boolean, dead: boolean
): void {
  const main  = dead ? C.dead     : C.dino;
  const dark  = dead ? C.deadDark : C.dinoDark;
  const eye   = C.dinoEye;

  // pixel size — each "pixel" is 4×4 for crisp hi-res look
  const P = 4;

  if (ducking) {
    // Ducking body (wide, low)
    ctx.fillStyle = main;
    ctx.fillRect(x + 2*P, y + 6*P, 16*P, 6*P);   // main body
    ctx.fillRect(x + 14*P, y + 2*P, 8*P, 6*P);   // head
    ctx.fillRect(x + 0,    y + 8*P, 4*P, 4*P);   // tail base
    ctx.fillStyle = dark;
    ctx.fillRect(x + 2*P, y + 10*P, 16*P, 2*P);  // body shadow
    ctx.fillRect(x + 14*P, y + 6*P,  8*P, 2*P);  // head shadow
    ctx.fillStyle = eye;
    ctx.fillRect(x + 20*P, y + 3*P, 2*P, 2*P);   // eye
    ctx.fillStyle = main;
    // legs
    if (frame === 0) {
      ctx.fillRect(x + 6*P,  y + 12*P, 3*P, 6*P);
      ctx.fillRect(x + 12*P, y + 12*P, 3*P, 4*P);
    } else {
      ctx.fillRect(x + 6*P,  y + 12*P, 3*P, 4*P);
      ctx.fillRect(x + 12*P, y + 12*P, 3*P, 6*P);
    }
  } else {
    // Standing body
    ctx.fillStyle = main;
    ctx.fillRect(x + 4*P,  y + 4*P,  12*P, 12*P);  // torso
    ctx.fillRect(x + 10*P, y + 0,     9*P,  9*P);   // head
    ctx.fillRect(x + 0,    y + 8*P,   6*P,  4*P);   // tail upper
    ctx.fillRect(x + 1*P,  y + 6*P,   4*P,  4*P);   // tail tip
    // snout
    ctx.fillRect(x + 17*P, y + 3*P,   3*P,  4*P);
    ctx.fillRect(x + 19*P, y + 6*P,   2*P,  1*P);   // nostril line

    // shading / depth
    ctx.fillStyle = dark;
    ctx.fillRect(x + 4*P,  y + 14*P, 12*P, 2*P);   // torso bottom shade
    ctx.fillRect(x + 10*P, y + 7*P,   9*P, 2*P);   // head bottom shade
    ctx.fillRect(x + 4*P,  y + 4*P,   2*P, 12*P);  // torso left shade

    // eye
    ctx.fillStyle = eye;
    ctx.fillRect(x + 15*P, y + 2*P, 2*P, 2*P);
    // eye shine
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 15*P, y + 2*P, 1*P, 1*P);

    // neck indent
    ctx.fillStyle = C.bg;
    ctx.fillRect(x + 10*P, y + 8*P, 3*P, 2*P);

    // arm nub
    ctx.fillStyle = main;
    ctx.fillRect(x + 14*P, y + 9*P, 3*P, 2*P);

    // legs
    ctx.fillStyle = main;
    if (dead) {
      ctx.fillRect(x + 6*P,  y + 16*P, 4*P, 8*P);
      ctx.fillRect(x + 12*P, y + 16*P, 4*P, 8*P);
    } else if (frame === 0) {
      // left leg forward, right leg back
      ctx.fillRect(x + 6*P,  y + 16*P, 4*P, 9*P);
      ctx.fillRect(x + 6*P,  y + 23*P, 5*P, 2*P);  // left foot
      ctx.fillRect(x + 12*P, y + 16*P, 4*P, 6*P);
      ctx.fillRect(x + 11*P, y + 20*P, 5*P, 2*P);  // right foot
    } else {
      // legs swapped
      ctx.fillRect(x + 6*P,  y + 16*P, 4*P, 6*P);
      ctx.fillRect(x + 5*P,  y + 20*P, 5*P, 2*P);  // left foot
      ctx.fillRect(x + 12*P, y + 16*P, 4*P, 9*P);
      ctx.fillRect(x + 12*P, y + 23*P, 5*P, 2*P);  // right foot
    }
    // leg shading
    ctx.fillStyle = dark;
    ctx.fillRect(x + 6*P,  y + 16*P, 1*P, dead ? 8*P : 6*P);
    ctx.fillRect(x + 12*P, y + 16*P, 1*P, dead ? 8*P : 6*P);
  }
}

// ── Cactus (scaled up, with shading) ─────────────────────────────────────
function drawCactus(ctx: CanvasRenderingContext2D, x: number, bottomY: number, type: CactusType): void {
  const P = 4;
  ctx.fillStyle = C.cactus;
  if (type === 'sm') {
    // stem
    ctx.fillRect(x + 8*P, bottomY - 60, 6*P, 60);
    // left arm
    ctx.fillRect(x + 0,   bottomY - 44, 8*P, 5*P);
    ctx.fillRect(x + 0,   bottomY - 52, 5*P, 8*P);
    // right arm
    ctx.fillRect(x + 14*P, bottomY - 38, 8*P, 5*P);
    ctx.fillRect(x + 17*P, bottomY - 46, 5*P, 8*P);
    // shading
    ctx.fillStyle = C.cactusDark;
    ctx.fillRect(x + 8*P,  bottomY - 60, 2*P, 60);
    ctx.fillRect(x + 0,    bottomY - 52, 2*P, 8*P);
    ctx.fillRect(x + 17*P, bottomY - 46, 2*P, 8*P);
  } else if (type === 'tall') {
    // stem
    ctx.fillRect(x + 10*P, bottomY - 84, 8*P, 84);
    // left arm
    ctx.fillRect(x + 0,    bottomY - 60, 10*P, 6*P);
    ctx.fillRect(x + 0,    bottomY - 74, 6*P, 14*P);
    // right arm
    ctx.fillRect(x + 18*P, bottomY - 54, 10*P, 6*P);
    ctx.fillRect(x + 22*P, bottomY - 68, 6*P, 14*P);
    // shading
    ctx.fillStyle = C.cactusDark;
    ctx.fillRect(x + 10*P, bottomY - 84, 2*P, 84);
    ctx.fillRect(x + 0,    bottomY - 74, 2*P, 14*P);
    ctx.fillRect(x + 22*P, bottomY - 68, 2*P, 14*P);
  } else {
    // double cactus
    ctx.fillStyle = C.cactus;
    ctx.fillRect(x + 2*P,  bottomY - 54, 6*P, 54);
    ctx.fillRect(x + 0,    bottomY - 40, 2*P, 5*P);
    ctx.fillRect(x + 8*P,  bottomY - 34, 2*P, 5*P);
    ctx.fillRect(x + 14*P, bottomY - 54, 6*P, 54);
    ctx.fillRect(x + 12*P, bottomY - 40, 2*P, 5*P);
    ctx.fillRect(x + 20*P, bottomY - 34, 2*P, 5*P);
    // shading
    ctx.fillStyle = C.cactusDark;
    ctx.fillRect(x + 2*P,  bottomY - 54, 2*P, 54);
    ctx.fillRect(x + 14*P, bottomY - 54, 2*P, 54);
  }
}

function cactusDims(type: CactusType): { w: number; h: number } {
  if (type === 'sm')   return { w: 88,  h: 60  };
  if (type === 'tall') return { w: 112, h: 84  };
  return                      { w: 96,  h: 54  };
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = C.cloud;
  ctx.fillRect(x + 18, y + 18, 90, 24);
  ctx.fillRect(x + 30, y + 6,  36, 18);
  ctx.fillRect(x + 12, y + 12, 30, 15);
  ctx.fillRect(x + 72, y + 12, 24, 15);
}

// ── Game class ───────────────────────────────────────────────────────────
export class DinoRunGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private initialDifficultyKey: DifficultyKey;
  private onGameEnd: (result: GameEndResult) => void;
  private sm: StateMachine;
  private keys: Record<string, boolean> = {};
  private _destroyed = false;
  private _rafId: number | null = null;

  private dino!: DinoState;
  private dinoGroundY = 0;
  private obstacles: Obstacle[] = [];
  private clouds: Cloud[] = [];
  private stars: Star[] = [];

  private speed = INITIAL_SPEED;
  private score = 0;
  private hiScore = 0;
  private jumpCount = 0;
  private distance = 0;
  private sessionTime = 0;
  private difficulty: DifficultyConfig | null = null;

  private obstacleTimerId: ReturnType<typeof setTimeout> | null = null;
  private cloudTimerId: ReturnType<typeof setInterval> | null = null;
  private calibratingTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private lastTime = 0;

  private _onKeyDown: (e: KeyboardEvent) => void;
  private _onKeyUp: (e: KeyboardEvent) => void;
  private _onMouseDown: () => void;
  private _onMvSquat: () => void;
  private _onMvCalibrated: () => void;

  constructor(opts: DinoRunGameOptions) {
    if (!opts.canvas) throw new Error('DinoRunGame requires opts.canvas');
    this.canvas = opts.canvas;
    this.canvas.width = W;
    this.canvas.height = H;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context from canvas');
    this.ctx = ctx;

    this.initialDifficultyKey = opts.difficulty ?? 'medium';
    this.onGameEnd = opts.onGameEnd ?? (() => {});

    this.sm = new StateMachine('IDLE');
    this.sm.on('CALIBRATING', () => this.onCalibrating());
    this.sm.on('ACTIVE',      () => this.onActive());
    this.sm.on('PAUSED',      () => this.onPaused());
    this.sm.on('GAME_OVER',   () => this.onGameOver());
    this.sm.on('WIN',         () => this.onWin());
    this.sm.on('IDLE',        () => this.onIdle());

    this._onKeyDown = (e) => this.handleKeyDown(e);
    this._onKeyUp   = (e) => { this.keys[e.code] = false; };
    this._onMouseDown = () => {};

    this._onMvSquat = () => {
      console.log('[Game] Squat event received, current state:', this.sm.current);
      if (this.sm.is('IDLE'))      { this.sm.transition('CALIBRATING'); return; }
      if (this.sm.is('GAME_OVER')) { this.restart(); return; }
      if (this.sm.is('WIN'))       { this.restart(); return; }
      if (this.sm.is('ACTIVE'))    { this.handleJump(); }
    };

    this._onMvCalibrated = () => {
      if (this.sm.is('CALIBRATING')) this.sm.transition('ACTIVE');
    };

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    this.canvas.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mv:squat:start', this._onMvSquat);
    window.addEventListener('mv:calibrated', this._onMvCalibrated);

    this.reset();
    this.onIdle();
    this.lastTime = performance.now();
    this._rafId = requestAnimationFrame((t) => this.loop(t));
  }

  private reset(): void {
    // Dino is 88px wide, 100px tall at hi-res
    this.dino = { x: 100, y: 0, w: 88, h: 100, vy: 0, frame: 0, frameTimer: 0, ducking: false, dead: false };
    this.dinoGroundY = GROUND_Y - this.dino.h;
    this.dino.y = this.dinoGroundY;
    this.obstacles = [];
    this.clouds = [];
    for (let i = 0; i < 5; i++) this.spawnCloud(rand(0, W));
    this.stars = [];
    for (let i = 0; i < 60; i++) {
      this.stars.push({ x: rand(0, W), y: rand(10, GROUND_Y - 120), size: randInt(1, 4), alpha: rand(0.2, 0.7) });
    }
    this.speed = INITIAL_SPEED;
    this.score = 0;
    this.jumpCount = 0;
    this.distance = 0;
    this.obstacleTimerId = null;
    this.cloudTimerId = null;
    this.sessionTime = 0;
    this.difficulty = null;
    this.calibratingTimeoutId = null;
  }

  private spawnCloud(xOverride?: number): void {
    this.clouds.push({ x: xOverride ?? W + 80, y: rand(40, 150), scrollSpeed: rand(0.3, 0.6), alpha: 0.6 });
  }

  private spawnObstacle(): void {
    if (!this.sm.is('ACTIVE')) return;
    const type = pick<CactusType>(['sm', 'sm', 'sm', 'sm', 'tall', 'tall', 'dbl']);
    const dims = cactusDims(type);
    this.obstacles.push({ x: W + 40, type, w: dims.w, h: dims.h, scored: false });
    const delay = this.difficulty?.obstacleDelay ?? 5000;
    this.obstacleTimerId = setTimeout(() => this.spawnObstacle(), delay);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.code === 'KeyP') {
      if (this.sm.is('ACTIVE')) this.sm.transition('PAUSED');
      else if (this.sm.is('PAUSED')) this.sm.transition('ACTIVE');
    }
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      const S = StateMachine.STATES;
      if (this.sm.is(S.IDLE))      { this.sm.transition('CALIBRATING'); return; }
      if (this.sm.is(S.GAME_OVER)) { this.restart(); return; }
      if (this.sm.is(S.WIN))       { this.restart(); return; }
    }
  }

  private handleJump(): void {
    if (!this.sm.is('ACTIVE')) return;
    const onGround = Math.abs(this.dino.y - this.dinoGroundY) < 4;
    console.log('[Jump] y:', this.dino.y, 'groundY:', this.dinoGroundY, 'onGround:', onGround);
    if (onGround) {
      this.jumpCount = 1;
      this.dino.vy = JUMP_VEL;
    } else if (this.jumpCount === 1) {
      this.jumpCount = 2;
      this.dino.vy = JUMP_VEL * 0.85;
    }
  }

  setDifficulty(key: DifficultyKey): void {
    this.initialDifficultyKey = key;
    if (this.sm.is('IDLE')) this.difficulty = DIFFICULTIES[key] ?? DIFFICULTIES.medium;
  }

  private restart(): void { this.reset(); this.sm.transition('IDLE'); }
  private die(): void { if (!this.sm.is('ACTIVE')) return; this.sm.transition('GAME_OVER'); }
  private onIdle(): void { this.difficulty = DIFFICULTIES[this.initialDifficultyKey] ?? DIFFICULTIES.medium; }

  private onCalibrating(): void {
    if (!this.difficulty) return;
    this.speed = this.difficulty.speed;
    this.calibratingTimeoutId = setTimeout(() => {
      if (this.sm.is('CALIBRATING')) this.sm.transition('ACTIVE');
    }, 5000);
  }

  private onActive(): void {
    if (!this.obstacleTimerId) this.spawnObstacle();
    if (!this.cloudTimerId) this.cloudTimerId = setInterval(() => this.spawnCloud(), 3500);
  }

  private onPaused(): void {
    if (this.obstacleTimerId) { clearTimeout(this.obstacleTimerId); this.obstacleTimerId = null; }
  }

  private onGameOver(): void {
    this.dino.dead = true;
    if (this.obstacleTimerId) { clearTimeout(this.obstacleTimerId); this.obstacleTimerId = null; }
    if (this.cloudTimerId)    { clearInterval(this.cloudTimerId);   this.cloudTimerId = null; }
    if (this.score > this.hiScore) this.hiScore = this.score;
    this.onGameEnd({ result: 'lost', score: this.score, ...this.scoreBreakdown() });
  }

  private onWin(): void {
    if (this.obstacleTimerId) { clearTimeout(this.obstacleTimerId); this.obstacleTimerId = null; }
    if (this.cloudTimerId)    { clearInterval(this.cloudTimerId);   this.cloudTimerId = null; }
    if (this.score > this.hiScore) this.hiScore = this.score;
    this.onGameEnd({ result: 'won', score: this.score, ...this.scoreBreakdown() });
  }

  private loop(now: number): void {
    if (this._destroyed) return;
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.update(dt);
    this.render();
    this._rafId = requestAnimationFrame((t) => this.loop(t));
  }

  private update(dt: number): void {
    this.dino.ducking = !!this.keys.down && this.sm.is('ACTIVE') &&
                         Math.abs(this.dino.y - this.dinoGroundY) < 4;
    if (!this.sm.is('ACTIVE')) return;

    this.dino.vy += GRAVITY * dt;
    this.dino.y  += this.dino.vy * dt;
    if (this.dino.y >= this.dinoGroundY) {
      this.dino.y = this.dinoGroundY; this.dino.vy = 0; this.jumpCount = 0;
    }

    this.dino.frameTimer += dt;
    if (this.dino.frameTimer > 0.12) { this.dino.frameTimer = 0; this.dino.frame = this.dino.frame === 0 ? 1 : 0; }

    this.distance += this.speed * dt;
    this.speed = Math.min(INITIAL_SPEED + this.distance * 0.04, MAX_SPEED);

    this.obstacles.forEach(o => { o.x -= this.speed * dt; });
    this.obstacles = this.obstacles.filter(o => o.x > -120);

    this.clouds.forEach(c => {
      c.x -= this.speed * c.scrollSpeed * dt;
      if (c.x < -130) { c.x = W + 130; c.y = rand(40, 150); }
    });

    this.stars.forEach(s => {
      s.x -= 30 * dt;
      if (s.x < 0) { s.x = W; s.y = rand(10, GROUND_Y - 120); }
    });

    // Scoring
    const dinoLeft = this.dino.x;
    this.obstacles.forEach(o => {
      if (!o.scored && (o.x + o.w) < dinoLeft) { o.scored = true; this.score += 1; }
    });

    if (this.difficulty && this.score >= this.difficulty.repGoal) { this.sm.transition('WIN'); return; }

    // Collision (AABB, inset for fairness)
    const dpad = 10;
    const dx = this.dino.x + dpad, dy = this.dino.y + dpad;
    const dw = this.dino.w - dpad * 2, dh = (this.dino.ducking ? 60 : this.dino.h) - dpad * 2;
    for (const o of this.obstacles) {
      const ox = o.x, oy = GROUND_Y - o.h, ow = o.w, oh = o.h;
      if (dx < ox + ow && dx + dw > ox && dy < oy + oh && dy + dh > oy) { this.die(); break; }
    }

    this.sessionTime += dt;
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    this.stars.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = C.star;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    ctx.globalAlpha = 1;

    this.clouds.forEach(c => {
      ctx.globalAlpha = c.alpha;
      drawCloud(ctx, c.x, c.y);
    });
    ctx.globalAlpha = 1;

    // Ground with top highlight
    drawRect(ctx, 0, H - 12, W, 12, C.ground);
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, H - 12, W, 2);

    this.obstacles.forEach(o => drawCactus(ctx, o.x, GROUND_Y, o.type));

    const dinoY = this.dino.ducking ? GROUND_Y - 48 : this.dino.y;
    drawDino(ctx, this.dino.x, dinoY, this.dino.frame, this.dino.ducking, this.dino.dead);

    drawText(ctx, `REPS: ${this.score}`,        W / 2,   24, 32, '#94a3b8', 'center', 'top');

    if (this.sm.is('IDLE'))      this.renderIdle();
    if (this.sm.is('CALIBRATING')) this.renderCalibrating();
    if (this.sm.is('PAUSED'))    this.renderPaused();
  }

  private renderIdle(): void {
    const ctx = this.ctx;
    drawRect(ctx, W/2 - 220, H/2 - 70, 440, 120, 'rgba(30,41,59,0.95)', C.dino, 2);
    drawText(ctx, 'DINO RUN',       W/2, H/2 - 36, 32, '#38bdf8', 'center', 'middle');
    drawText(ctx, 'SQUAT TO START', W/2, H/2 + 16, 14, '#94a3b8', 'center', 'middle');
  }

  private renderCalibrating(): void {
    const ctx = this.ctx;
    drawRect(ctx, W/2 - 220, H/2 - 50, 440, 90, 'rgba(15,23,42,0.95)', '#38bdf8', 2);
    drawText(ctx, 'STAND STILL...', W/2, H/2 - 10, 18, '#94a3b8', 'center', 'middle');
    drawText(ctx, 'CALIBRATING',    W/2, H/2 + 18, 14, '#475569', 'center', 'middle');
  }

  private renderPaused(): void {
    const ctx = this.ctx;
    drawRect(ctx, W/2 - 160, H/2 - 55, 320, 110, 'rgba(30,41,59,0.97)', '#fbbf24', 2);
    drawText(ctx, 'PAUSED',          W/2, H/2 - 14, 26, '#fbbf24', 'center', 'middle');
    drawText(ctx, 'PRESS P TO RESUME', W/2, H/2 + 22, 12, '#94a3b8', 'center', 'middle');
  }

  private scoreBreakdown(): ScoreBreakdown {
    const repStreak  = Math.max(1, this.score * 0.1);
    const timeMult   = Math.pow(1.1, Math.floor(this.sessionTime) * 0.1);
    const finalScore = Math.round(this.score * 100 * repStreak * timeMult);
    return { repStreak, timeMult, finalScore, secs: Math.floor(this.sessionTime) };
  }

  destroy(): void {
    this._destroyed = true;
    if (this._rafId !== null) cancelAnimationFrame(this._rafId);
    if (this.obstacleTimerId)      clearTimeout(this.obstacleTimerId);
    if (this.cloudTimerId)         clearInterval(this.cloudTimerId);
    if (this.calibratingTimeoutId) clearTimeout(this.calibratingTimeoutId);
    window.removeEventListener('keydown',        this._onKeyDown);
    window.removeEventListener('keyup',          this._onKeyUp);
    this.canvas.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mv:squat:start', this._onMvSquat);
    window.removeEventListener('mv:calibrated',  this._onMvCalibrated);
  }
}