// Classic grid-locked movement (Pokemon GBA style): no physics bodies, just
// tile coordinates + a tween per step. Collision and NPC "bump to talk" are
// both plain grid-cell checks, not physics overlap.
const TILE = 32;
const GRID_COLS = 25; // 800 / 32
const GRID_ROWS = 17; // leaves the bottom row clear of the hint text at y=560
const MOVE_DURATION = 150;

const PLAYER_START = { col: 12, row: 9 };

// Every sprite taller than 1 tile (furniture, the player, NPCs) draws past
// its own tile into the row above it, so who-draws-over-who can't be decided
// by add order alone — depth must track row (further down the room = higher
// depth = drawn on top). Floor sits on a constant depth below every row so
// it never outranks a piece of furniture. Same trick as PixelRoomProtoScene.
const FLOOR_DEPTH = -1;

const ASSET_PATH = 'src/assets/office/';
const PLAYER_ASSET_PATH = 'src/assets/preview-room/player.png';

// Five rooms, connected in a line by doors. Rooms are just a realistic
// setting — security issues happen everywhere in a company, so the same six
// scenario categories are simply spread across these rooms rather than each
// room having its own dedicated topic. Doors are solid tiles: the player
// stops in front of one and presses Action (while adjacent to it) to cross.
//
// Each room also carries its own floor/wall texture pair and a `furniture`
// list (sprite key + grid position + how many tiles wide) drawn from the
// purchased Modern Office Revamped pack, themed to fit the room's name.
const ROOMS = [
  {
    name: 'Sala de TI',
    floor: 'floor_grey_stone', wall: 'wall_grey_stone',
    categories: ['phishing', 'usb', 'ia'],
    npcPositions: [{ col: 5, row: 4 }, { col: 12, row: 4 }, { col: 19, row: 4 }],
    furniture: [
      { type: 'server', col: 3, row: 11 }, { type: 'server', col: 3, row: 12 },
      { type: 'desk-pc-dual', col: 8, row: 12 }, { type: 'chair-dark', col: 8, row: 13 },
      { type: 'desk-pc-dual', col: 12, row: 12 }, { type: 'chair-dark', col: 12, row: 13 },
      { type: 'desk-pc-dual', col: 16, row: 12 }, { type: 'chair-dark', col: 16, row: 13 },
      { type: 'plant-round', col: 21, row: 11 }
    ],
    doors: [{ col: 24, row: 8, toRoom: 1, entryCol: 1, entryRow: 8 }]
  },
  {
    name: 'Sala da Diretoria',
    floor: 'floor_lavender_light', wall: 'wall_lavender_light',
    categories: ['social'],
    npcPositions: [{ col: 12, row: 5 }],
    furniture: [
      { type: 'desk-wide-white', col: 11, row: 11 },
      { type: 'chair-dark', col: 12, row: 12 },
      { type: 'couch-sectional', col: 4, row: 12 },
      { type: 'plant-round', col: 20, row: 11 },
      { type: 'frame-art', col: 8, row: 0 },
      { type: 'frame-art', col: 16, row: 0 }
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
    floor: 'floor_brick_tan', wall: 'wall_brick_tan',
    categories: [],
    npcPositions: [],
    furniture: [
      { type: 'desk-wide-tan', col: 5, row: 11 }, { type: 'chair-red', col: 6, row: 12 },
      { type: 'desk-wide-tan', col: 10, row: 11 }, { type: 'chair-red', col: 11, row: 12 },
      { type: 'desk-wide-tan', col: 15, row: 11 }, { type: 'chair-red', col: 16, row: 12 },
      { type: 'plant-leafy', col: 2, row: 12 }
      // col 20-21, row 11-12 left clear on purpose — future coffee machine spot
    ],
    doors: [
      { col: 0, row: 8, toRoom: 1, entryCol: 23, entryRow: 8 },
      { col: 24, row: 8, toRoom: 3, entryCol: 1, entryRow: 8 }
    ]
  },
  {
    name: 'Contabilidade',
    floor: 'floor_lavender', wall: 'wall_lavender',
    categories: ['passwords', 'documents'],
    npcPositions: [{ col: 8, row: 5 }, { col: 16, row: 5 }],
    furniture: [
      { type: 'desk-pc-orange', col: 7, row: 11 }, { type: 'chair-orange', col: 7, row: 12 },
      { type: 'desk-pc-orange', col: 17, row: 11 }, { type: 'chair-orange', col: 17, row: 12 },
      { type: 'printer', col: 2, row: 11 },
      { type: 'scanner', col: 22, row: 11 },
      { type: 'plant-small', col: 12, row: 11 }
    ],
    doors: [
      { col: 0, row: 8, toRoom: 2, entryCol: 23, entryRow: 8 },
      { col: 24, row: 8, toRoom: 4, entryCol: 1, entryRow: 8 }
    ]
  },
  {
    name: 'RH',
    floor: 'floor_lavender', wall: 'wall_lavender',
    categories: ['links', 'tailgating'],
    npcPositions: [{ col: 8, row: 5 }, { col: 16, row: 5 }],
    furniture: [
      { type: 'desk-plain-tan', col: 8, row: 11 }, { type: 'chair-fabric', col: 8, row: 12 },
      { type: 'desk-plain-tan', col: 16, row: 11 }, { type: 'chair-fabric', col: 16, row: 12 },
      { type: 'couch-loveseat', col: 11, row: 13 },
      { type: 'team-photo', col: 20, row: 0 },
      { type: 'plant-small', col: 3, row: 11 }
    ],
    doors: [{ col: 0, row: 8, toRoom: 3, entryCol: 23, entryRow: 8 }]
  }
];

// Furniture catalog: sprite key, display size and origin. Origin.y is tuned
// so each sprite's base overlaps a few px past its own tile's bottom edge —
// flush-to-boundary still reads as a gap when the player approaches from
// below (same tuning approach used in PixelRoomProtoScene). `cols` marks
// pieces wider than one tile, so both tiles get blocked.
const FURNITURE_KINDS = {
  'server': { key: 'server_rack_tall', w: 46, h: 68, originY: 0.63 },
  'desk-pc-dual': { key: 'desk_pc_dual_monitor', w: 52, h: 64, originY: 0.61 },
  'desk-pc-orange': { key: 'desk_pc_orange_single_monitor', w: 52, h: 64, originY: 0.61 },
  'desk-plain-tan': { key: 'desk_plain_tan', w: 52, h: 64, originY: 0.61 },
  'desk-wide-white': { key: 'desk_plain_wide_white', w: 64, h: 38, originY: 0.34, cols: 2 },
  'desk-wide-tan': { key: 'desk_plain_tan', w: 64, h: 38, originY: 0.34, cols: 2 },
  'chair-dark': { key: 'chair_dark_grey', w: 32, h: 42, originY: 0.40 },
  'chair-orange': { key: 'chair_orange', w: 32, h: 42, originY: 0.40 },
  'chair-red': { key: 'chair_red', w: 32, h: 42, originY: 0.40 },
  'chair-fabric': { key: 'chair_grey_fabric', w: 32, h: 42, originY: 0.40 },
  'couch-sectional': { key: 'couch_sectional_corner', w: 62, h: 48, originY: 0.48, cols: 2 },
  'couch-loveseat': { key: 'couch_loveseat', w: 62, h: 48, originY: 0.48, cols: 2 },
  'printer': { key: 'printer_basic_1', w: 52, h: 54, originY: 0.53 },
  'scanner': { key: 'scanner_fax', w: 52, h: 54, originY: 0.53 },
  'plant-round': { key: 'plant_tall_round', w: 24, h: 52, originY: 0.52 },
  'plant-leafy': { key: 'plant_tall_leafy', w: 24, h: 52, originY: 0.52 },
  'plant-small': { key: 'plant_small_round', w: 28, h: 40, originY: 0.46 },
  'frame-art': { key: 'wall_frame_art_1', w: 40, h: 34, originY: 0.30 },
  'team-photo': { key: 'wall_team_photo', w: 44, h: 36, originY: 0.30 }
};

// Decorative, non-interactive workers that wander a small patrol box so the
// office doesn't feel frozen. Purely cosmetic — no gameplay effect.
const AMBIENT_NPC_SPAWNS = [
  { col: 4, row: 14, boxCols: [2, 7], boxRows: [14, 15], tint: 0x8899aa },
  { col: 20, row: 14, boxCols: [17, 22], boxRows: [14, 15], tint: 0xcc9966 }
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
    this.load.image('player', PLAYER_ASSET_PATH);
    this.generateTexture('door', 0xf5d76e, TILE, TILE, 0xb8860b, 2);

    // Floor/wall textures, deduped across rooms.
    const floorsAndWalls = new Set();
    ROOMS.forEach(r => { floorsAndWalls.add(r.floor); floorsAndWalls.add(r.wall); });
    floorsAndWalls.forEach(key => this.load.image(key, ASSET_PATH + key + '.png'));

    // Furniture sprites, deduped across kinds actually used.
    const furnitureKeys = new Set(Object.values(FURNITURE_KINDS).map(f => f.key));
    furnitureKeys.forEach(key => this.load.image(key, ASSET_PATH + key + '.png'));
  }

  // Procedural placeholder — only the door still uses this; every other
  // visual in the room is real pixel art from the purchased pack.
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
    const roomIndex = this.registry.get('currentRoom') ?? 0;
    const pendingEntry = this.registry.get('pendingEntry');
    const spawn = pendingEntry || PLAYER_START;
    this.registry.set('pendingEntry', null);

    this.roomIndex = roomIndex;
    const room = ROOMS[roomIndex];

    this.drawFloor(room);

    const start = gridToPixel(spawn.col, spawn.row);
    this.player = this.add.image(start.x, start.y, 'player')
      .setDisplaySize(32, 64).setOrigin(0.5, 0.75).setDepth(spawn.row);
    this.playerGrid = { col: spawn.col, row: spawn.row };
    this.isMoving = false;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
    this.actionKeys = this.input.keyboard.addKeys({ space: 'SPACE', enter: 'ENTER' });
    this.actionJustDown = false;

    this.add.text(16, 16, 'Pillars of Security', { fontSize: '14px', color: '#ffffff' }).setDepth(100);
    renderHearts(this, 596, 16, this.registry.get('halfHearts') ?? MAX_HALF_HEARTS);
    this.add.text(596, 46, `${t(this, 'scoreLabel')}: ${this.registry.get('score') || 0}`, {
      fontSize: '14px', color: '#ffffff'
    }).setDepth(100);

    this.encounterLocked = false;
    this.npcs = [];
    this.ambientNpcs = [];
    this.obstacles = [];
    this.doors = [];

    this.add.text(400, 16, room.name, { fontSize: '14px', color: '#4ecca3' }).setOrigin(0.5, 0).setDepth(100);

    this.drawWalls(room);
    this.spawnFurniture(room);
    this.spawnDoors(room);
    this.spawnRoomNpcs(room);
    this.spawnAmbientNpcs();
    this.add.text(16, 560, t(this, 'overworldHint'), { fontSize: '12px', color: '#aaaaaa' }).setDepth(100);
  }

  drawFloor(room) {
    for (let col = 0; col < GRID_COLS; col++) {
      for (let row = 0; row < GRID_ROWS; row++) {
        const pos = gridToPixel(col, row);
        this.add.image(pos.x, pos.y, room.floor).setDisplaySize(TILE, TILE).setDepth(FLOOR_DEPTH);
      }
    }
  }

  // Decorative perimeter border — the grid-boundary check already stops the
  // player at the edge, so these tiles aren't pushed into `obstacles`.
  drawWalls(room) {
    for (let col = 0; col < GRID_COLS; col++) {
      this.addWallTile(room, col, 0);
    }
    for (let row = 0; row < GRID_ROWS; row++) {
      this.addWallTile(room, 0, row);
      this.addWallTile(room, GRID_COLS - 1, row);
    }
  }

  addWallTile(room, col, row) {
    const pos = gridToPixel(col, row);
    this.add.image(pos.x, pos.y, room.wall).setDisplaySize(TILE, TILE).setDepth(row);
  }

  spawnFurniture(room) {
    room.furniture.forEach(({ type, col, row }) => {
      const kind = FURNITURE_KINDS[type];
      const span = kind.cols || 1;
      const leftPos = gridToPixel(col, row);
      const centerX = leftPos.x + (span - 1) * TILE / 2;
      this.add.image(centerX, leftPos.y, kind.key)
        .setDisplaySize(kind.w, kind.h).setOrigin(0.5, kind.originY).setDepth(row);
      for (let i = 0; i < span; i++) this.obstacles.push({ col: col + i, row });
    });
  }

  spawnDoors(room) {
    room.doors.forEach(door => {
      const pos = gridToPixel(door.col, door.row);
      this.add.sprite(pos.x, pos.y, 'door').setDepth(door.row);

      const destinationName = ROOMS[door.toRoom].name;
      // Put the sign in the free tile above the door, or below it when the
      // door sits on the top row and there's no room above.
      const signOffsetY = door.row === 0 ? 30 : -30;
      this.add.text(pos.x, pos.y + signOffsetY, `🚪 ${destinationName}`, {
        fontSize: '11px', color: '#f5d76e', backgroundColor: '#1a1a2e', padding: { x: 4, y: 2 }
      }).setOrigin(0.5).setDepth(100);

      this.doors.push(door);
    });
  }

  // Spawns one NPC per category still pending in this room. Finished
  // categories show a checkmark instead — the player can revisit freely.
  // NPCs reuse the player's sprite, tinted per category so they read as
  // distinct "people" at a glance until a dedicated character pack exists.
  spawnRoomNpcs(room) {
    const queueIndex = this.registry.get('categoryQueueIndex');

    room.categories.forEach((categoryId, i) => {
      const gridPos = room.npcPositions[i] || { col: 12, row: 15 };
      const pos = gridToPixel(gridPos.col, gridPos.row);
      const category = SCENARIO_CATEGORIES[categoryId];
      const done = queueIndex[categoryId] >= SCENARIOS_PER_CATEGORY;

      if (done) {
        this.add.text(pos.x, pos.y, `✅ ${category.name}`, { fontSize: '12px', color: '#4ecca3' })
          .setOrigin(0.5).setDepth(100);
        return;
      }

      this.add.image(pos.x, pos.y, 'player')
        .setDisplaySize(32, 64).setOrigin(0.5, 0.75).setDepth(gridPos.row).setTint(category.color);
      this.add.text(pos.x, pos.y - 46, `${category.icon} ${category.name}`, {
        fontSize: '12px', color: '#e94560'
      }).setOrigin(0.5).setDepth(100);

      this.npcs.push({ categoryId, col: gridPos.col, row: gridPos.row });
    });
  }

  // Cosmetic workers that step to a random adjacent tile inside a small box
  // every couple of seconds. No interaction, no collision with the player —
  // just enough motion so the office doesn't feel like a screenshot.
  spawnAmbientNpcs() {
    AMBIENT_NPC_SPAWNS.forEach(spawn => {
      const pos = gridToPixel(spawn.col, spawn.row);
      const sprite = this.add.image(pos.x, pos.y, 'player')
        .setDisplaySize(28, 54).setOrigin(0.5, 0.75).setDepth(spawn.row).setTint(spawn.tint);
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
    npc.sprite.setDepth(targetRow);
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

  // Doors are solid (see tryMove) — the player stops right in front of one,
  // so Action checks the four adjacent tiles, not the tile they're standing on.
  tryUseDoorHere() {
    const { col, row } = this.playerGrid;
    const adjacent = [[col, row - 1], [col, row + 1], [col - 1, row], [col + 1, row]];
    const door = this.doors.find(d => adjacent.some(([c, r]) => c === d.col && r === d.row));
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

    // Ambient NPCs, obstacles (furniture) and doors are all solid — the
    // player stops in front of a door and uses Action to go through (see
    // tryUseDoorHere), rather than walking onto its tile.
    const blockedByAmbient = this.ambientNpcs.some(n => n.col === targetCol && n.row === targetRow);
    if (blockedByAmbient) return;

    const blockedByObstacle = this.obstacles.some(o => o.col === targetCol && o.row === targetRow);
    if (blockedByObstacle) return;

    const blockedByDoor = this.doors.some(d => d.col === targetCol && d.row === targetRow);
    if (blockedByDoor) return;

    this.isMoving = true;
    this.playerGrid = { col: targetCol, row: targetRow };
    const dest = gridToPixel(targetCol, targetRow);
    this.player.setDepth(targetRow);

    this.tweens.add({
      targets: this.player,
      x: dest.x,
      y: dest.y,
      duration: MOVE_DURATION,
      onComplete: () => { this.isMoving = false; }
    });
  }
}
