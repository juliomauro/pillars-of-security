// Classic grid-locked movement (Pokemon GBA style): no physics bodies, just
// tile coordinates + a tween per step. Collision and NPC "bump to talk" are
// both plain grid-cell checks, not physics overlap.
const TILE = 32;
const GRID_COLS = 25; // 800 / 32
const GRID_ROWS = 17; // leaves the bottom row clear of the hint text at y=560
const MOVE_DURATION = 150;

const PLAYER_START = { col: 12, row: 9 };

// Five rooms, connected in a line by doors. Rooms are just a realistic
// setting — security issues happen everywhere in a company, so the same six
// scenario categories are simply spread across these rooms rather than each
// room having its own dedicated topic. Doors are plain walkable tiles the
// player must stand on and press Action on to cross.
const ROOMS = [
  {
    name: 'Sala de TI',
    categories: ['phishing', 'usb'],
    npcPositions: [{ col: 6, row: 4 }, { col: 18, row: 4 }],
    obstacles: [
      { col: 10, row: 12 }, { col: 11, row: 12 }, { col: 13, row: 12 }, { col: 14, row: 12 }
    ],
    doors: [{ col: 24, row: 8, toRoom: 1, entryCol: 1, entryRow: 8 }]
  },
  {
    name: 'Sala da Diretoria',
    categories: ['social'],
    npcPositions: [{ col: 12, row: 5 }],
    obstacles: [
      { col: 10, row: 12 }, { col: 11, row: 12 }, { col: 12, row: 12 }, { col: 13, row: 12 }, { col: 14, row: 12 }
    ],
    doors: [
      { col: 0, row: 8, toRoom: 0, entryCol: 23, entryRow: 8 },
      { col: 24, row: 8, toRoom: 2, entryCol: 1, entryRow: 8 }
    ]
  },
  {
    // No quiz category on purpose — reserved for the future coffee-machine
    // easter egg (heals half a heart, limited uses), not a question room.
    name: 'Refeitório',
    categories: [],
    npcPositions: [],
    obstacles: [
      { col: 9, row: 12 }, { col: 10, row: 12 }, { col: 14, row: 12 }, { col: 15, row: 12 }
    ],
    doors: [
      { col: 0, row: 8, toRoom: 1, entryCol: 23, entryRow: 8 },
      { col: 24, row: 8, toRoom: 3, entryCol: 1, entryRow: 8 }
    ]
  },
  {
    name: 'Contabilidade',
    categories: ['passwords'],
    npcPositions: [{ col: 12, row: 5 }],
    obstacles: [
      { col: 10, row: 12 }, { col: 11, row: 12 }, { col: 13, row: 12 }, { col: 14, row: 12 }
    ],
    doors: [
      { col: 0, row: 8, toRoom: 2, entryCol: 23, entryRow: 8 },
      { col: 24, row: 8, toRoom: 4, entryCol: 1, entryRow: 8 }
    ]
  },
  {
    name: 'RH',
    categories: ['links', 'tailgating'],
    npcPositions: [{ col: 8, row: 5 }, { col: 16, row: 5 }],
    obstacles: [
      { col: 10, row: 12 }, { col: 11, row: 12 }, { col: 12, row: 12 }, { col: 13, row: 12 }
    ],
    doors: [{ col: 0, row: 8, toRoom: 3, entryCol: 23, entryRow: 8 }]
  }
];

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
    this.generateTexture('desk', 0x5c3a21, TILE, TILE, 0x3a2414, 2);
    this.generateTexture('door', 0xf5d76e, TILE, TILE, 0xb8860b, 2);
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

    const roomIndex = this.registry.get('currentRoom') ?? 0;
    const pendingEntry = this.registry.get('pendingEntry');
    const spawn = pendingEntry || PLAYER_START;
    this.registry.set('pendingEntry', null);

    const start = gridToPixel(spawn.col, spawn.row);
    this.player = this.add.sprite(start.x, start.y, 'player');
    this.playerGrid = { col: spawn.col, row: spawn.row };
    this.isMoving = false;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
    this.actionKeys = this.input.keyboard.addKeys({ space: 'SPACE', enter: 'ENTER' });
    this.actionJustDown = false;

    this.add.text(16, 16, 'Pillars of Security', { fontSize: '14px', color: '#ffffff' });
    renderHearts(this, 596, 16, this.registry.get('halfHearts') ?? MAX_HALF_HEARTS);
    this.add.text(596, 46, `${t(this, 'scoreLabel')}: ${this.registry.get('score') || 0}`, {
      fontSize: '14px', color: '#ffffff'
    });

    this.encounterLocked = false;
    this.npcs = [];
    this.ambientNpcs = [];
    this.obstacles = [];
    this.doors = [];

    this.roomIndex = roomIndex;
    const room = ROOMS[roomIndex];
    this.add.text(400, 16, room.name, { fontSize: '14px', color: '#4ecca3' }).setOrigin(0.5, 0);

    this.spawnObstacles(room);
    this.spawnDoors(room);
    this.spawnRoomNpcs(room);
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

  spawnObstacles(room) {
    room.obstacles.forEach(({ col, row }) => {
      const pos = gridToPixel(col, row);
      this.add.sprite(pos.x, pos.y, 'desk');
      this.obstacles.push({ col, row });
    });
  }

  spawnDoors(room) {
    room.doors.forEach(door => {
      const pos = gridToPixel(door.col, door.row);
      this.add.sprite(pos.x, pos.y, 'door');
      this.doors.push(door);
    });
  }

  // Spawns one NPC per category still pending in this room. Finished
  // categories show a checkmark instead — the player can revisit freely.
  spawnRoomNpcs(room) {
    const queueIndex = this.registry.get('categoryQueueIndex');

    room.categories.forEach((categoryId, i) => {
      const gridPos = room.npcPositions[i] || { col: 12, row: 15 };
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

    const occupied =
      (this.playerGrid.col === targetCol && this.playerGrid.row === targetRow) ||
      this.npcs.some(n => n.col === targetCol && n.row === targetRow) ||
      this.ambientNpcs.some(n => n !== npc && n.col === targetCol && n.row === targetRow) ||
      this.obstacles.some(o => o.col === targetCol && o.row === targetRow);
    if (occupied) return;

    npc.col = targetCol;
    npc.row = targetRow;
    const dest = gridToPixel(targetCol, targetRow);
    this.tweens.add({ targets: npc.sprite, x: dest.x, y: dest.y, duration: MOVE_DURATION * 2 });
  }

  startEncounter(categoryId) {
    if (this.encounterLocked) return;
    this.encounterLocked = true;
    // Returning from the encounter should drop the player back where they
    // were, not reset to the room's default spawn point.
    this.registry.set('pendingEntry', { col: this.playerGrid.col, row: this.playerGrid.row });
    this.scene.start('Encounter', { categoryId });
  }

  useDoor(door) {
    if (this.encounterLocked) return;
    this.encounterLocked = true;
    this.registry.set('currentRoom', door.toRoom);
    this.registry.set('pendingEntry', { col: door.entryCol, row: door.entryRow });
    this.scene.start('Overworld');
  }

  update() {
    const actionDown = this.actionKeys.space.isDown || this.actionKeys.enter.isDown;
    if (actionDown && !this.actionJustDown) {
      this.actionJustDown = true;
      this.tryUseDoorHere();
    } else if (!actionDown) {
      this.actionJustDown = false;
    }

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

  tryUseDoorHere() {
    const door = this.doors.find(d => d.col === this.playerGrid.col && d.row === this.playerGrid.row);
    if (door) this.useDoor(door);
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

    // Ambient NPCs and obstacles (desks/furniture) are solid too. Doors are
    // walkable — crossing them does nothing, Action is what triggers a room
    // change (see tryUseDoorHere).
    const blockedByAmbient = this.ambientNpcs.some(n => n.col === targetCol && n.row === targetRow);
    if (blockedByAmbient) return;

    const blockedByObstacle = this.obstacles.some(o => o.col === targetCol && o.row === targetRow);
    if (blockedByObstacle) return;

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
