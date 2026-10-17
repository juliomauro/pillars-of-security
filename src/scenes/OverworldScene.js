// Classic grid-locked movement (Pokemon GBA style): no physics bodies, just
// tile coordinates + a tween per step. Collision and NPC "bump to talk" are
// both plain grid-cell checks, not physics overlap.
const TILE = 32;
const GRID_COLS = 25; // 800 / 32
const GRID_ROWS = 17; // leaves the bottom row clear of the hint text at y=560
const MOVE_DURATION = 150;

const PLAYER_START = { col: 12, row: 9 };

// Fixed map slots for a day's categories. DAYS currently has exactly 2
// categories per day; a 3rd slot is here in case that changes later.
const NPC_GRID_POSITIONS = [{ col: 6, row: 6 }, { col: 18, row: 6 }, { col: 12, row: 13 }];

// Decorative, non-interactive workers that wander a small patrol box so the
// office doesn't feel frozen. Purely cosmetic — no gameplay effect.
const AMBIENT_NPC_SPAWNS = [
  { col: 4, row: 12, boxCols: [2, 7], boxRows: [11, 15], color: 0x8899aa },
  { col: 20, row: 13, boxCols: [17, 22], boxRows: [11, 15], color: 0xaa8866 }
];
const AMBIENT_STEP_DELAY = [1200, 2600]; // ms range between ambient steps

function gridToPixel(col, row) {
  return { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 };
}

class OverworldScene extends Phaser.Scene {
  constructor() {
    super('Overworld');
  }

  preload() {
    this.generateTexture('floor', 0x16213e, TILE, TILE, 0x0f3460, 1);
    this.generateTexture('player', 0x4ecca3, 24, 24);
  }

  // Procedural placeholder art: a filled square, optionally with a border.
  generateTexture(key, fillColor, w, h, borderColor, borderWidth) {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(fillColor, 1);
    g.fillRect(0, 0, w, h);
    if (borderColor !== undefined) {
      g.lineStyle(borderWidth, borderColor, 1);
      g.strokeRect(0, 0, w, h);
    }
    g.generateTexture(key, w, h);
    g.destroy();
  }

  create() {
    this.drawFloor();

    const start = gridToPixel(PLAYER_START.col, PLAYER_START.row);
    this.player = this.add.sprite(start.x, start.y, 'player');
    this.playerGrid = { col: PLAYER_START.col, row: PLAYER_START.row };
    this.isMoving = false;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');

    this.add.text(16, 16, 'Pillars of Security', { fontSize: '14px', color: '#ffffff' });
    renderHearts(this, 596, 16, this.registry.get('halfHearts') ?? 8);
    this.add.text(596, 46, `${t(this, 'scoreLabel')}: ${this.registry.get('score') || 0}`, {
      fontSize: '14px', color: '#ffffff'
    });

    this.encounterLocked = false;
    this.npcs = [];
    this.ambientNpcs = [];

    const dayIndex = this.registry.get('dayIndex');
    const day = DAYS[dayIndex];
    const lastShownDayIndex = this.registry.get('lastShownDayIndex');

    if (dayIndex !== lastShownDayIndex) {
      this.showDayBanner(dayIndex, day, () => this.setupMap(day));
    } else {
      this.setupMap(day);
    }
  }

  setupMap(day) {
    this.spawnDayNpcs(day);
    this.spawnAmbientNpcs();
    this.add.text(16, 560, t(this, 'overworldHint'), { fontSize: '12px', color: '#aaaaaa' });
  }

  drawFloor() {
    for (let x = 0; x < 800; x += TILE) {
      for (let y = 0; y < 600; y += TILE) {
        this.add.image(x + TILE / 2, y + TILE / 2, 'floor');
      }
    }
  }

  showDayBanner(dayIndex, day, onDismiss) {
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.85).setDepth(10);
    const title = this.add.text(400, 250, day.name, { fontSize: '26px', color: '#4ecca3' }).setOrigin(0.5).setDepth(11);
    const categoryNames = day.categories.map(id => SCENARIO_CATEGORIES[id].name).join(' & ');
    const sub = this.add.text(400, 300, categoryNames, { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5).setDepth(11);

    const btn = this.add.text(400, 370, t(this, 'start'), {
      fontSize: '14px', color: '#ffffff', backgroundColor: '#0f3460', padding: { x: 14, y: 8 }
    }).setOrigin(0.5).setDepth(11).setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      this.registry.set('lastShownDayIndex', dayIndex);
      overlay.destroy();
      title.destroy();
      sub.destroy();
      btn.destroy();
      onDismiss();
    });
  }

  // Spawns one NPC per category still pending today, so the player picks
  // which one to tackle first. Finished categories show a checkmark instead.
  spawnDayNpcs(day) {
    const queueIndex = this.registry.get('categoryQueueIndex');

    day.categories.forEach((categoryId, i) => {
      const gridPos = NPC_GRID_POSITIONS[i] || { col: 12, row: 15 };
      const pos = gridToPixel(gridPos.col, gridPos.row);
      const category = SCENARIO_CATEGORIES[categoryId];
      const done = queueIndex[categoryId] >= SCENARIOS_PER_CATEGORY;

      if (done) {
        this.add.text(pos.x, pos.y, `✅ ${category.name}`, { fontSize: '12px', color: '#4ecca3' }).setOrigin(0.5);
        return;
      }

      const textureKey = 'npc-' + categoryId;
      if (!this.textures.exists(textureKey)) {
        this.generateTexture(textureKey, category.color, 24, 24);
      }

      this.add.sprite(pos.x, pos.y, textureKey);
      this.add.text(pos.x, pos.y - 30, `${category.icon} ${category.name}`, {
        fontSize: '12px', color: '#e94560'
      }).setOrigin(0.5);

      this.npcs.push({ categoryId, col: gridPos.col, row: gridPos.row });
    });
  }

  // Cosmetic workers that step to a random adjacent tile inside a small box
  // every couple of seconds. No interaction, no collision with the player —
  // just enough motion so the office doesn't feel like a screenshot.
  spawnAmbientNpcs() {
    if (!this.textures.exists('npc-ambient-a')) this.generateTexture('npc-ambient-a', 0x8899aa, 20, 20);
    if (!this.textures.exists('npc-ambient-b')) this.generateTexture('npc-ambient-b', 0xaa8866, 20, 20);

    AMBIENT_NPC_SPAWNS.forEach((spawn, i) => {
      const pos = gridToPixel(spawn.col, spawn.row);
      const sprite = this.add.sprite(pos.x, pos.y, i === 0 ? 'npc-ambient-a' : 'npc-ambient-b');
      const npc = { sprite, col: spawn.col, row: spawn.row, boxCols: spawn.boxCols, boxRows: spawn.boxRows };
      this.ambientNpcs.push(npc);
      this.scheduleAmbientStep(npc);
    });
  }

  scheduleAmbientStep(npc) {
    const delay = Phaser.Math.Between(AMBIENT_STEP_DELAY[0], AMBIENT_STEP_DELAY[1]);
    this.time.delayedCall(delay, () => {
      if (!npc.sprite.active) return; // scene may have changed under us
      this.ambientStep(npc);
      this.scheduleAmbientStep(npc);
    });
  }

  ambientStep(npc) {
    const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    const [dCol, dRow] = Phaser.Utils.Array.GetRandom(directions);
    const targetCol = Phaser.Math.Clamp(npc.col + dCol, npc.boxCols[0], npc.boxCols[1]);
    const targetRow = Phaser.Math.Clamp(npc.row + dRow, npc.boxRows[0], npc.boxRows[1]);
    if (targetCol === npc.col && targetRow === npc.row) return;

    npc.col = targetCol;
    npc.row = targetRow;
    const dest = gridToPixel(targetCol, targetRow);
    this.tweens.add({ targets: npc.sprite, x: dest.x, y: dest.y, duration: MOVE_DURATION * 2 });
  }

  startEncounter(categoryId) {
    if (this.encounterLocked) return;
    this.encounterLocked = true;
    this.scene.start('Encounter', { categoryId });
  }

  update() {
    if (this.isMoving) return;

    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;

    let dCol = 0;
    let dRow = 0;
    if (left) dCol = -1;
    else if (right) dCol = 1;
    else if (up) dRow = -1;
    else if (down) dRow = 1;

    if (dCol !== 0 || dRow !== 0) {
      this.tryMove(dCol, dRow);
    }
  }

  tryMove(dCol, dRow) {
    const targetCol = this.playerGrid.col + dCol;
    const targetRow = this.playerGrid.row + dRow;

    if (targetCol < 0 || targetCol >= GRID_COLS || targetRow < 0 || targetRow >= GRID_ROWS) return;

    const bumpedNpc = this.npcs.find(n => n.col === targetCol && n.row === targetRow);
    if (bumpedNpc) {
      this.startEncounter(bumpedNpc.categoryId);
      return;
    }

    this.isMoving = true;
    this.playerGrid = { col: targetCol, row: targetRow };
    const dest = gridToPixel(targetCol, targetRow);

    this.tweens.add({
      targets: this.player,
      x: dest.x,
      y: dest.y,
      duration: MOVE_DURATION,
      onComplete: () => { this.isMoving = false; }
    });
  }
}
