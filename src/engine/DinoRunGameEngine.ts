// dinoRunEngine.ts

const W = 1200, H = 620;
const GROUND_Y = H - 12;
const GRAVITY = 1700;
const JUMP_VEL = -1100;
const INITIAL_SPEED = 420;
const MAX_SPEED = 420;
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
  label: string; repGoal: number; speed: number; obstacleDelay: number; color: string; scoreMultiplier: number;
}
export interface ScoreBreakdown {
  repStreak: number; 
  timeMult: number; 
  diffMult: number;
  closeCallMult: number;
  closeCallCount: number;
  finalScore: number; 
  secs: number;
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
interface Obstacle { 
  x: number; 
  type: CactusType; 
  w: number; 
  h: number; 
  scored: boolean; 
  minClearance: number; 
}
interface Cloud { x: number; y: number; scrollSpeed: number; alpha: number; }
interface Star { x: number; y: number; size: number; alpha: number; }
export interface DinoRunGameOptions {
  canvas: HTMLCanvasElement;
  difficulty?: DifficultyKey;
  onGameEnd?: (result: GameEndResult) => void;
  onGameStart?: () => void;
  onGameIdle?: () => void;
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
  easy:         { label: 'Easy',         repGoal: 10,       speed: 420, obstacleDelay: 4000, color: '#4ade80', scoreMultiplier: 1 },
  medium:       { label: 'Medium',       repGoal: 20,       speed: 420, obstacleDelay: 4000, color: '#38bdf8', scoreMultiplier: 2 },
  hard:         { label: 'Hard',         repGoal: 40,       speed: 420, obstacleDelay: 4000, color: '#fbbf24', scoreMultiplier: 3 },
  score_attack: { label: 'Score Attack', repGoal: Infinity, speed: 420, obstacleDelay: 4000, color: '#e74c3c', scoreMultiplier: 1 },
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
  const m  = dead ? '#c0392b' : '#2d7a1f';
  const l  = dead ? '#e74c3c' : '#4ade80';
  const b  = dead ? '#c0392b' : '#f5a623';
  const d  = dead ? '#7b1a1a' : '#1a4a10';
  const bk = dead ? '#4a0a0a' : '#0a1a06';
  const lf = frame === 0;
  const P  = 4; // pixel block size

  // ── TAIL ──────────────────────────────────────────────────────────────
  ctx.fillStyle = bk;
  ctx.fillRect(x+3*P, y+6*P,  2*P, P);
  ctx.fillRect(x+2*P, y+7*P,  2*P, P);
  ctx.fillRect(x+P,   y+8*P,  2*P, P);
  ctx.fillRect(x+0,   y+9*P,  P,   2*P);
  ctx.fillRect(x+0,   y+11*P, P,   P);
  ctx.fillRect(x+P,   y+11*P, P,   P);
  ctx.fillRect(x+2*P, y+10*P, P,   2*P);
  ctx.fillRect(x+3*P, y+9*P,  P,   2*P);
  ctx.fillRect(x+4*P, y+8*P,  P,   2*P);
  ctx.fillStyle = m;
  ctx.fillRect(x+3*P, y+7*P,  P,   P);
  ctx.fillRect(x+2*P, y+8*P,  2*P, P);
  ctx.fillRect(x+P,   y+9*P,  2*P, 2*P);
  ctx.fillStyle = d;
  ctx.fillRect(x+2*P, y+8*P,  P,   P);
  ctx.fillRect(x+P,   y+10*P, P,   P);

  // ── BODY OUTLINE ──────────────────────────────────────────────────────
  ctx.fillStyle = bk;
  ctx.fillRect(x+5*P, y+6*P,  P,   10*P);
  ctx.fillRect(x+4*P, y+8*P,  P,   6*P);
  ctx.fillRect(x+5*P, y+16*P, 10*P, P);
  ctx.fillRect(x+14*P,y+7*P,  P,   9*P);

  // ── HEAD + SNOUT OUTLINE ──────────────────────────────────────────────
  ctx.fillRect(x+8*P, y+0,    6*P, P);
  ctx.fillRect(x+7*P, y+P,    P,   P);
  ctx.fillRect(x+6*P, y+2*P,  P,   5*P);
  ctx.fillRect(x+14*P,y+P,    P,   3*P);
  ctx.fillRect(x+14*P,y+4*P,  P,   P);
  ctx.fillRect(x+15*P,y+3*P,  3*P, P);
  ctx.fillRect(x+18*P,y+4*P,  P,   3*P);
  ctx.fillRect(x+17*P,y+7*P,  2*P, P);
  ctx.fillRect(x+14*P,y+7*P,  4*P, P);

  // ── HEAD + SNOUT FILL ─────────────────────────────────────────────────
  ctx.fillStyle = m;
  ctx.fillRect(x+8*P, y+P,    6*P, P);
  ctx.fillRect(x+7*P, y+2*P,  7*P, 5*P);
  ctx.fillRect(x+14*P,y+3*P,  P,   4*P);
  ctx.fillRect(x+15*P,y+3*P,  3*P, 4*P);
  ctx.fillRect(x+17*P,y+4*P,  P,   3*P);
  // nostril
  ctx.fillStyle = bk;
  ctx.fillRect(x+16*P,y+4*P,  P,   P);
  // teeth
  if (!dead) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x+15*P,y+7*P, P,   P);
    ctx.fillRect(x+17*P,y+7*P, P,   P);
  }

  // ── NECK + BODY ───────────────────────────────────────────────────────
  ctx.fillStyle = m;
  ctx.fillRect(x+7*P, y+7*P,  6*P, 2*P);
  ctx.fillRect(x+6*P, y+8*P,  8*P, 8*P);
  ctx.fillRect(x+7*P, y+15*P, 6*P, P);

  // ── BELLY ─────────────────────────────────────────────────────────────
  ctx.fillStyle = b;
  ctx.fillRect(x+9*P,  y+9*P,  3*P, P);
  ctx.fillRect(x+8*P,  y+10*P, 4*P, 3*P);
  ctx.fillRect(x+9*P,  y+13*P, 3*P, 2*P);
  ctx.fillRect(x+10*P, y+15*P, P,   P);

  // ── HIGHLIGHTS ────────────────────────────────────────────────────────
  ctx.fillStyle = l;
  ctx.fillRect(x+9*P,  y+2*P, 3*P, P);
  ctx.fillRect(x+8*P,  y+3*P, 2*P, P);
  ctx.fillRect(x+7*P,  y+8*P, P,   2*P);
  ctx.fillRect(x+6*P,  y+9*P, P,   3*P);

  // ── SHADING ───────────────────────────────────────────────────────────
  ctx.fillStyle = d;
  ctx.fillRect(x+6*P,  y+12*P, P,   4*P);
  ctx.fillRect(x+13*P, y+9*P,  P,   6*P);

  // ── EYE ───────────────────────────────────────────────────────────────
  ctx.fillStyle = '#000000';
  ctx.fillRect(x+11*P, y+3*P, 2*P, 2*P);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x+11*P, y+3*P, P,   P);

  // ── ARM ───────────────────────────────────────────────────────────────
  ctx.fillStyle = bk;
  ctx.fillRect(x+12*P, y+9*P,  P,   3*P);
  ctx.fillRect(x+13*P, y+11*P, P,   P);
  ctx.fillStyle = m;
  ctx.fillRect(x+12*P, y+9*P,  P,   3*P);
  ctx.fillRect(x+13*P, y+11*P, P,   P);
  ctx.fillStyle = d;
  ctx.fillRect(x+12*P, y+10*P, P,   2*P);

  // ── LEGS ──────────────────────────────────────────────────────────────
  const leftLeg = (extended: boolean) => {
    ctx.fillStyle = bk;
    ctx.fillRect(x+6*P, y+17*P, 3*P, P);
    ctx.fillRect(x+5*P, y+18*P, P,   3*P);
    ctx.fillRect(x+8*P, y+18*P, P,   2*P);
    ctx.fillRect(x+5*P, y+21*P, P,   3*P);
    ctx.fillRect(x+7*P, y+20*P, P,   4*P);
    ctx.fillRect(x+6*P, y+24*P, P,   P);
    ctx.fillRect(x+7*P, y+24*P, 4*P, P);
    ctx.fillRect(x+10*P,y+23*P, P,   P);
    ctx.fillStyle = m;
    ctx.fillRect(x+6*P, y+17*P, 2*P, P);
    ctx.fillRect(x+6*P, y+18*P, 2*P, 2*P);
    ctx.fillRect(x+6*P, y+20*P, P,   4*P);
    ctx.fillRect(x+7*P, y+23*P, 3*P, P);
    ctx.fillStyle = d;
    ctx.fillRect(x+6*P, y+18*P, P,   3*P);
  };

  const rightLeg = (striding: boolean) => {
    ctx.fillStyle = bk;
    ctx.fillRect(x+11*P,y+17*P, 3*P, P);
    ctx.fillRect(x+10*P,y+18*P, P,   3*P);
    ctx.fillRect(x+13*P,y+18*P, P,   2*P);
    if (striding) {
      ctx.fillRect(x+10*P,y+21*P, P,   3*P);
      ctx.fillRect(x+12*P,y+20*P, P,   4*P);
      ctx.fillRect(x+11*P,y+24*P, 4*P, P);
      ctx.fillRect(x+14*P,y+23*P, P,   P);
      ctx.fillStyle = m;
      ctx.fillRect(x+11*P,y+17*P, 2*P, P);
      ctx.fillRect(x+11*P,y+18*P, 2*P, 2*P);
      ctx.fillRect(x+11*P,y+20*P, P,   4*P);
      ctx.fillRect(x+12*P,y+23*P, 2*P, P);
      ctx.fillStyle = d;
      ctx.fillRect(x+11*P,y+18*P, P,   3*P);
    } else {
      ctx.fillRect(x+10*P,y+21*P, P,   2*P);
      ctx.fillRect(x+12*P,y+20*P, P,   2*P);
      ctx.fillRect(x+11*P,y+22*P, 4*P, P);
      ctx.fillRect(x+14*P,y+21*P, P,   P);
      ctx.fillStyle = m;
      ctx.fillRect(x+11*P,y+17*P, 2*P, P);
      ctx.fillRect(x+11*P,y+18*P, 2*P, 2*P);
      ctx.fillRect(x+11*P,y+20*P, P,   2*P);
      ctx.fillRect(x+12*P,y+21*P, 2*P, P);
      ctx.fillStyle = d;
      ctx.fillRect(x+11*P,y+18*P, P,   3*P);
    }
  };

  if (dead) {
    leftLeg(false);
    rightLeg(false);
  } else if (lf) {
    leftLeg(true);
    rightLeg(false);
  } else {
    leftLeg(false);
    rightLeg(true);
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
  private onGameStart: () => void;
  private onGameIdle: () => void;
  private hasRunBefore = false;
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
  private closeCallCount = 0;
  private readonly CLOSE_CALL_PX = 120;

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
    this.onGameStart = opts.onGameStart ?? (() => {});
    this.onGameIdle = opts.onGameIdle ?? (() => {});

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
    this.dino = { x: 100, y: 0, w: 96, h: 100, vy: 0, frame: 0, frameTimer: 0, ducking: false, dead: false };
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
    this.closeCallCount = 0;
  }

  private spawnCloud(xOverride?: number): void {
    this.clouds.push({ x: xOverride ?? W + 80, y: rand(40, 150), scrollSpeed: rand(0.3, 0.6), alpha: 0.6 });
  }

  private spawnObstacle(): void {
    if (!this.sm.is('ACTIVE')) return;
    const type = pick<CactusType>(['sm', 'sm', 'sm', 'sm', 'tall', 'tall', 'dbl']);
    const dims = cactusDims(type);
    this.obstacles.push({ x: W + 40, type, w: dims.w, h: dims.h, scored: false, minClearance: -Infinity });
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
  private onIdle(): void { 
    if (this.hasRunBefore) {
      this.onGameStart();
    }
    this.onGameIdle();
    this.difficulty = DIFFICULTIES[this.initialDifficultyKey] ?? DIFFICULTIES.medium; 
  }

  private onCalibrating(): void {
    this.onGameStart();
    if (!this.difficulty) return;
    this.speed = this.difficulty.speed;
    this.calibratingTimeoutId = setTimeout(() => {
      if (this.sm.is('CALIBRATING')) this.sm.transition('ACTIVE');
    }, 5000);
  }

  private onActive(): void {
    this.hasRunBefore = false;
    if (!this.obstacleTimerId) this.spawnObstacle();
    if (!this.cloudTimerId) this.cloudTimerId = setInterval(() => this.spawnCloud(), 3500);
  }

  private onPaused(): void {
    if (this.obstacleTimerId) { clearTimeout(this.obstacleTimerId); this.obstacleTimerId = null; }
  }

  private onGameOver(): void {
    this.hasRunBefore = true;
    this.dino.dead = true;
    if (this.obstacleTimerId) { clearTimeout(this.obstacleTimerId); this.obstacleTimerId = null; }
    if (this.cloudTimerId)    { clearInterval(this.cloudTimerId);   this.cloudTimerId = null; }
    if (this.score > this.hiScore) this.hiScore = this.score;
    this.onGameEnd({ result: 'lost', score: this.score, ...this.scoreBreakdown() });
  }

  private onWin(): void {
    this.hasRunBefore = true;
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
    const dinoLeft   = this.dino.x + 10;
    const dinoRight  = this.dino.x + this.dino.w - 10;
    const dinoBottom = this.dino.y + this.dino.h;
    
    this.obstacles.forEach(o => {
      const cactusTop   = GROUND_Y - o.h;
      const cactusLeft  = o.x;
      const cactusRight = o.x + o.w;

      // While dino and cactus are horizontally overlapping, track closest vertical gap
      const horizontallyAligned = dinoRight > cactusLeft && dinoLeft < cactusRight;
      if (horizontallyAligned) {
        const clearance = dinoBottom - cactusTop;
        o.minClearance = Math.max(o.minClearance, clearance);
      }

      // Once the cactus has fully passed the dino, score it
      if (!o.scored && cactusRight < dinoLeft) {
        o.scored = true;
        this.score += 1;

        // Use the closest point tracked during the overlap window
        const wasClose = o.minClearance < 0 && o.minClearance > -this.CLOSE_CALL_PX;
        if (wasClose) this.closeCallCount++;
      }
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

    if (this.sm.is('CALIBRATING')) this.renderCalibrating();
    if (this.sm.is('PAUSED'))    this.renderPaused();
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
    const diffMult       = this.difficulty?.scoreMultiplier ?? 1;
    const closeCallMult  = Math.min(1 + this.closeCallCount * 0.1, 1.5);
    const finalScore = Math.round(this.score * 100 * repStreak * timeMult * diffMult * closeCallMult);
    return { repStreak, timeMult, diffMult, closeCallMult, closeCallCount: this.closeCallCount, finalScore, secs: Math.floor(this.sessionTime) };

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