// dinoRunEngine.ts
// Vanilla Canvas2D Dino Run engine. No globals, no DOM assumptions beyond
// the canvas element passed in. Designed to be instantiated from React.
//
// Usage:
//   import { DinoRunGame, DIFFICULTIES, type DifficultyKey, type GameEndResult } from './dinoRunEngine';
//   const game = new DinoRunGame({
//     canvas: canvasEl,
//     difficulty: 'medium',
//     onGameEnd: (result) => {},
//   });
//   game.destroy(); // call on unmount

const W = 800, H = 300;
const GROUND_Y = H - 8;
const GRAVITY = 1800;
const JUMP_VEL = -700;
const INITIAL_SPEED = 350;
const MAX_SPEED = 900;
const FONT = '"Press Start 2P", monospace';

const C = {
  bg:     '#0f172a',
  ground: '#334155',
  dino:   '#38bdf8',
  dead:   '#e74c3c',
  cactus: '#4ade80',
  cloud:  '#1e293b',
  star:   '#475569',
} as const;

// ── Types ────────────────────────────────────────────────────────────────
type StateName = 'IDLE' | 'CALIBRATING' | 'ACTIVE' | 'PAUSED' | 'GAME_OVER' | 'WIN';

export type DifficultyKey = 'easy' | 'medium' | 'hard' | 'score_attack';

interface DifficultyConfig {
  label: string;
  repGoal: number;
  speed: number;
  obstacleDelay: number;
  color: string;
}

export interface ScoreBreakdown {
  repStreak: number;
  timeMult: number;
  finalScore: number;
  secs: number;
}

export interface GameEndResult extends ScoreBreakdown {
  result: 'won' | 'lost';
  score: number;
}

interface DinoState {
  x: number; y: number; w: number; h: number;
  vy: number; frame: 0 | 1; frameTimer: number;
  ducking: boolean; dead: boolean;
}

type CactusType = 'sm' | 'tall' | 'dbl';

interface Obstacle {
  x: number; type: CactusType; w: number; h: number; scored: boolean;
}

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
    if (!this.canTransition(to)) {
      console.warn(`Invalid transition: ${this.current} → ${to}`);
      return false;
    }
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
  easy:         { label: 'Easy',         repGoal: 10,       speed: 350, obstacleDelay: 3000, color: '#4ade80' },
  medium:       { label: 'Medium',       repGoal: 20,       speed: 350, obstacleDelay: 3000, color: '#38bdf8' },
  hard:         { label: 'Hard',         repGoal: 40,       speed: 350, obstacleDelay: 3000, color: '#fbbf24' },
  score_attack: { label: 'Score Attack', repGoal: Infinity, speed: 350, obstacleDelay: 3000, color: '#e74c3c' },
};

// ── Helpers ──────────────────────────────────────────────────────────────
function rand(min: number, max: number): number { return Math.random() * (max - min) + min; }
function randInt(min: number, max: number): number { return Math.floor(rand(min, max + 1)); }
function pick<T>(arr: T[]): T { return arr[randInt(0, arr.length - 1)]; }

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number, size: number, color: string,
  align: CanvasTextAlign = 'left',
  baseline: CanvasTextBaseline = 'top'
): void {
  ctx.font = `${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y);
}

function drawRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
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

// ── Sprite drawing ──────────────────────────────────────────────────────
function drawDino(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, frame: 0 | 1, ducking: boolean, dead: boolean
): void {
  ctx.fillStyle = dead ? C.dead : C.dino;
  if (ducking) {
    ctx.fillRect(x + 4, y + 10, 30, 14);
    ctx.fillRect(x + 26, y + 2, 14, 12);
    ctx.fillRect(x + 0, y + 14, 8, 6);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 34, y + 4, 3, 3);
    ctx.fillStyle = dead ? C.dead : C.dino;
    if (frame === 0) { ctx.fillRect(x + 10, y + 24, 6, 8); ctx.fillRect(x + 22, y + 24, 6, 4); }
    else              { ctx.fillRect(x + 10, y + 24, 6, 4); ctx.fillRect(x + 22, y + 24, 6, 8); }
  } else {
    ctx.fillRect(x + 8, y + 4, 22, 20);
    ctx.fillRect(x + 22, y + 0, 14, 14);
    ctx.fillRect(x + 0, y + 14, 10, 6);
    ctx.fillRect(x + 2, y + 10, 6, 6);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 30, y + 3, 3, 3);
    if (!dead) ctx.fillRect(x + 33, y + 9, 4, 2);
    if (!dead) ctx.fillRect(x + 22, y + 12, 6, 4);
    ctx.fillStyle = dead ? C.dead : C.dino;
    if (dead) {
      ctx.fillRect(x + 12, y + 24, 6, 12); ctx.fillRect(x + 24, y + 24, 6, 12);
    } else if (frame === 0) {
      ctx.fillRect(x + 12, y + 24, 6, 12); ctx.fillRect(x + 24, y + 24, 6, 8);
    } else {
      ctx.fillRect(x + 12, y + 24, 6, 8);  ctx.fillRect(x + 24, y + 24, 6, 12);
    }
  }
}

function drawCactus(ctx: CanvasRenderingContext2D, x: number, bottomY: number, type: CactusType): void {
  ctx.fillStyle = C.cactus;
  if (type === 'sm') {
    ctx.fillRect(x + 10, bottomY - 40, 10, 40);
    ctx.fillRect(x + 0, bottomY - 30, 10, 8); ctx.fillRect(x + 0, bottomY - 34, 12, 6);
    ctx.fillRect(x + 20, bottomY - 26, 10, 8); ctx.fillRect(x + 18, bottomY - 30, 12, 6);
  } else if (type === 'tall') {
    ctx.fillRect(x + 14, bottomY - 56, 12, 56);
    ctx.fillRect(x + 0, bottomY - 44, 14, 10); ctx.fillRect(x + 0, bottomY - 50, 16, 8);
    ctx.fillRect(x + 26, bottomY - 38, 14, 10); ctx.fillRect(x + 24, bottomY - 44, 16, 8);
  } else {
    ctx.fillRect(x + 6, bottomY - 36, 8, 36); ctx.fillRect(x + 0, bottomY - 26, 6, 6); ctx.fillRect(x + 14, bottomY - 22, 6, 6);
    ctx.fillRect(x + 26, bottomY - 36, 8, 36); ctx.fillRect(x + 20, bottomY - 26, 6, 6); ctx.fillRect(x + 34, bottomY - 22, 6, 6);
  }
}

function cactusDims(type: CactusType): { w: number; h: number } {
  if (type === 'sm')   return { w: 30, h: 40 };
  if (type === 'tall') return { w: 40, h: 56 };
  return { w: 40, h: 36 };
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = C.cloud;
  ctx.fillRect(x + 12, y + 12, 60, 16);
  ctx.fillRect(x + 20, y + 4, 24, 12);
  ctx.fillRect(x + 8, y + 8, 20, 10);
  ctx.fillRect(x + 48, y + 8, 16, 10);
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
    this._onMouseDown = () => this.handleJump();

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    this.canvas.addEventListener('mousedown', this._onMouseDown);

    this.reset();
    this.onIdle();
    this.lastTime = performance.now();
    this._rafId = requestAnimationFrame((t) => this.loop(t));
  }

  private reset(): void {
    this.dino = { x: 80, y: 0, w: 40, h: 36, vy: 0, frame: 0, frameTimer: 0, ducking: false, dead: false };
    this.dinoGroundY = GROUND_Y - this.dino.h;
    this.dino.y = this.dinoGroundY;

    this.obstacles = [];
    this.clouds = [];
    for (let i = 0; i < 4; i++) this.spawnCloud(rand(0, W));
    this.stars = [];
    for (let i = 0; i < 40; i++) {
      this.stars.push({ x: rand(0, W), y: rand(10, GROUND_Y - 80), size: randInt(1, 3), alpha: rand(0.2, 0.7) });
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
    this.clouds.push({ x: xOverride ?? W + 50, y: rand(30, 100), scrollSpeed: rand(0.3, 0.6), alpha: 0.6 });
  }

  private spawnObstacle(): void {
    if (!this.sm.is('ACTIVE')) return;
    const type = pick<CactusType>(['sm', 'sm', 'sm', 'sm', 'tall', 'tall', 'dbl']);
    const dims = cactusDims(type);
    this.obstacles.push({ x: W + 30, type, w: dims.w, h: dims.h, scored: false });
    const delay = this.difficulty?.obstacleDelay ?? 3000;
    this.obstacleTimerId = setTimeout(() => this.spawnObstacle(), delay);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); this.handleJump(); }
    if (e.code === 'ArrowDown') this.keys.down = true;
    if (e.code === 'KeyP') {
      if (this.sm.is('ACTIVE')) this.sm.transition('PAUSED');
      else if (this.sm.is('PAUSED')) this.sm.transition('ACTIVE');
    }
  }

  private handleJump(): void {
    if (this.sm.is('IDLE'))      { this.sm.transition('CALIBRATING'); return; }
    if (this.sm.is('GAME_OVER')) { this.restart(); return; }
    if (this.sm.is('WIN'))       { this.restart(); return; }
    if (!this.sm.is('ACTIVE'))   return;

    const onGround = Math.abs(this.dino.y - this.dinoGroundY) < 4;
    if (onGround) {
      this.jumpCount = 1;
      this.dino.vy = JUMP_VEL;
    } else if (this.jumpCount === 1) {
      this.jumpCount = 2;
      this.dino.vy = JUMP_VEL * 0.85;
    }
  }

  /** Change difficulty from outside. Only takes effect while in IDLE. */
  setDifficulty(key: DifficultyKey): void {
    this.initialDifficultyKey = key;
    if (this.sm.is('IDLE')) this.difficulty = DIFFICULTIES[key] ?? DIFFICULTIES.medium;
  }

  private restart(): void { this.reset(); this.sm.transition('IDLE'); }

  private die(): void {
    if (!this.sm.is('ACTIVE')) return;
    this.sm.transition('GAME_OVER');
  }

  private onIdle(): void {
    this.difficulty = DIFFICULTIES[this.initialDifficultyKey] ?? DIFFICULTIES.medium;
  }

  private onCalibrating(): void {
    if (!this.difficulty) return;
    this.speed = this.difficulty.speed;
    this.calibratingTimeoutId = setTimeout(() => {
      if (this.sm.is('CALIBRATING')) this.sm.transition('ACTIVE');
    }, 1000);
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
    this.dino.y += this.dino.vy * dt;
    if (this.dino.y >= this.dinoGroundY) { this.dino.y = this.dinoGroundY; this.dino.vy = 0; this.jumpCount = 0; }

    this.dino.frameTimer += dt;
    if (this.dino.frameTimer > 0.12) { this.dino.frameTimer = 0; this.dino.frame = this.dino.frame === 0 ? 1 : 0; }

    this.distance += this.speed * dt;
    this.speed = Math.min(INITIAL_SPEED + this.distance * 0.04, MAX_SPEED);

    this.obstacles.forEach(o => { o.x -= this.speed * dt; });
    this.obstacles = this.obstacles.filter(o => o.x > -60);

    this.clouds.forEach(c => {
      c.x -= this.speed * c.scrollSpeed * dt;
      if (c.x < -90) { c.x = W + 90; c.y = rand(30, 100); }
    });

    this.stars.forEach(s => {
      s.x -= 30 * dt;
      if (s.x < 0) { s.x = W; s.y = rand(10, GROUND_Y - 80); }
    });

    const dinoLeft = this.dino.x;
    this.obstacles.forEach(o => {
      if (!o.scored && (o.x + o.w) < dinoLeft) { o.scored = true; this.score += 1; }
    });

    if (this.difficulty && this.score >= this.difficulty.repGoal) { this.sm.transition('WIN'); return; }

    const dpad = 6;
    const dx = this.dino.x + dpad, dy = this.dino.y + dpad;
    const dw = this.dino.w - dpad * 2, dh = (this.dino.ducking ? 32 : this.dino.h) - dpad * 2;
    for (const o of this.obstacles) {
      const ox = o.x, oy = GROUND_Y - o.h, ow = o.w, oh = o.h;
      if (dx < ox + ow && dx + dw > ox && dy < oy + oh && dy + dh > oy) {
        this.die();
        break;
      }
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

    drawRect(ctx, 0, H - 8, W, 8, C.ground);

    this.obstacles.forEach(o => drawCactus(ctx, o.x, GROUND_Y, o.type));

    const dy = this.dino.ducking ? GROUND_Y - 32 : this.dino.y;
    drawDino(ctx, this.dino.x, dy, this.dino.frame, this.dino.ducking, this.dino.dead);

    drawText(ctx, `REPS: ${this.score}`, W / 2, 20, 24, '#94a3b8', 'center', 'top');
    drawText(ctx, `SCORE: ${this.score * 100}`, W - 20, 20, 14, '#94a3b8', 'right', 'top');

    if (this.sm.is('IDLE')) this.renderIdle();
    if (this.sm.is('CALIBRATING')) this.renderCalibrating();
    if (this.sm.is('PAUSED')) this.renderPaused();
    if (this.sm.is('GAME_OVER')) this.renderGameOver();
    if (this.sm.is('WIN')) this.renderWin();
  }

  private renderIdle(): void {
    const ctx = this.ctx;
    drawRect(ctx, W/2 - 170, H/2 - 60, 340, 100, 'rgba(30,41,59,0.95)', C.dino, 2);
    drawText(ctx, 'DINO RUN', W/2, H/2 - 30, 24, '#38bdf8', 'center', 'middle');
    drawText(ctx, 'PRESS SPACE TO START', W/2, H/2 + 10, 10, '#94a3b8', 'center', 'middle');
  }

  private renderCalibrating(): void {
    drawText(this.ctx, 'GET READY...', W/2, H/2, 16, '#94a3b8', 'center', 'middle');
  }

  private renderPaused(): void {
    const ctx = this.ctx;
    drawRect(ctx, W/2 - 110, H/2 - 40, 220, 80, 'rgba(30,41,59,0.97)', '#fbbf24', 2);
    drawText(ctx, 'PAUSED', W/2, H/2 - 10, 18, '#fbbf24', 'center', 'middle');
    drawText(ctx, 'PRESS P TO RESUME', W/2, H/2 + 16, 9, '#94a3b8', 'center', 'middle');
  }

  private scoreBreakdown(): ScoreBreakdown {
    const repStreak = Math.max(1, this.score * 0.1);
    const timeMult = Math.pow(1.1, Math.floor(this.sessionTime) * 0.1);
    const finalScore = Math.round(this.score * 100 * repStreak * timeMult);
    return { repStreak, timeMult, finalScore, secs: Math.floor(this.sessionTime) };
  }

  private renderGameOver(): void {
    const ctx = this.ctx;
    const { repStreak, timeMult, finalScore, secs } = this.scoreBreakdown();
    drawRect(ctx, W/2 - 210, H/2 - 110, 420, 220, 'rgba(15,23,42,0.97)', '#e74c3c', 2);
    drawText(ctx, 'GAME OVER', W/2, H/2 - 88, 18, '#e74c3c', 'center', 'middle');

    drawText(ctx, 'Base Score', W/2 - 100, H/2 - 52, 9, '#94a3b8', 'left', 'middle');
    drawText(ctx, `${this.score * 100}`, W/2 + 100, H/2 - 52, 9, '#e2e8f0', 'right', 'middle');

    drawText(ctx, `Rep Streak (${this.score})`, W/2 - 100, H/2 - 24, 9, '#94a3b8', 'left', 'middle');
    drawText(ctx, `x${repStreak.toFixed(1)}`, W/2 + 100, H/2 - 24, 9, '#e2e8f0', 'right', 'middle');

    drawText(ctx, `Game Time (${secs}s)`, W/2 - 100, H/2 + 4, 9, '#94a3b8', 'left', 'middle');
    drawText(ctx, `x${timeMult.toFixed(2)}`, W/2 + 100, H/2 + 4, 9, '#e2e8f0', 'right', 'middle');

    ctx.strokeStyle = '#334155'; ctx.beginPath();
    ctx.moveTo(W/2 - 180, H/2 + 26); ctx.lineTo(W/2 + 180, H/2 + 26); ctx.stroke();

    drawText(ctx, 'FINAL SCORE', W/2 - 100, H/2 + 48, 10, '#38bdf8', 'left', 'middle');
    drawText(ctx, `${finalScore}`, W/2 + 100, H/2 + 48, 10, '#38bdf8', 'right', 'middle');

    drawText(ctx, 'PRESS SPACE TO RETRY', W/2, H/2 + 82, 9, '#475569', 'center', 'middle');
  }

  private renderWin(): void {
    const ctx = this.ctx;
    const { repStreak, timeMult, finalScore, secs } = this.scoreBreakdown();
    const diffLabel = this.difficulty?.label ?? 'Unknown';
    drawRect(ctx, W/2 - 210, H/2 - 120, 420, 240, 'rgba(15,23,42,0.97)', '#4ade80', 2);
    drawText(ctx, 'YOU WIN!', W/2, H/2 - 96, 18, '#4ade80', 'center', 'middle');
    drawText(ctx, `Difficulty: ${diffLabel}`, W/2, H/2 - 66, 8, '#475569', 'center', 'middle');

    drawText(ctx, 'Base Score', W/2 - 100, H/2 - 36, 9, '#94a3b8', 'left', 'middle');
    drawText(ctx, `${this.score * 100}`, W/2 + 100, H/2 - 36, 9, '#e2e8f0', 'right', 'middle');

    drawText(ctx, `Rep Streak (${this.score})`, W/2 - 100, H/2 - 8, 9, '#94a3b8', 'left', 'middle');
    drawText(ctx, `x${repStreak.toFixed(1)}`, W/2 + 100, H/2 - 8, 9, '#e2e8f0', 'right', 'middle');

    drawText(ctx, `Game Time (${secs}s)`, W/2 - 100, H/2 + 20, 9, '#94a3b8', 'left', 'middle');
    drawText(ctx, `x${timeMult.toFixed(2)}`, W/2 + 100, H/2 + 20, 9, '#e2e8f0', 'right', 'middle');

    ctx.strokeStyle = '#334155'; ctx.beginPath();
    ctx.moveTo(W/2 - 180, H/2 + 42); ctx.lineTo(W/2 + 180, H/2 + 42); ctx.stroke();

    drawText(ctx, 'FINAL SCORE', W/2 - 100, H/2 + 62, 10, '#4ade80', 'left', 'middle');
    drawText(ctx, `${finalScore}`, W/2 + 100, H/2 + 62, 10, '#4ade80', 'right', 'middle');

    drawText(ctx, 'PRESS SPACE TO PLAY AGAIN', W/2, H/2 + 96, 9, '#475569', 'center', 'middle');
  }

  /** Stop the game loop and remove all listeners/timers. Call on component unmount. */
  destroy(): void {
    this._destroyed = true;
    if (this._rafId !== null) cancelAnimationFrame(this._rafId);
    if (this.obstacleTimerId) clearTimeout(this.obstacleTimerId);
    if (this.cloudTimerId) clearInterval(this.cloudTimerId);
    if (this.calibratingTimeoutId) clearTimeout(this.calibratingTimeoutId);
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this.canvas.removeEventListener('mousedown', this._onMouseDown);
  }
}