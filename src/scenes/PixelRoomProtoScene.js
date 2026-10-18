// Standalone prototype: a full example room built from sprites extracted
// from the purchased "Modern Office Revamped v1.2" pack (raw pack lives in
// pixelart/modern-office-revamped/, gitignored — see its LICENSE.txt there,
// commercial use allowed; extracted sprites actually used by the game live
// in src/assets/preview-room/), laid out like the pack's own reference
// design (pixelart/modern-office-revamped/6_Office_Designs/Office_Design_2.gif)
// and docs/concept-art/topdown-reference.jpeg: rows of cubicle workstations,
// an IT corner with server racks, a small reception/waiting area, wall
// board, cabinet, plants. Uses the exact same 32px grid movement/collision
// as the real Overworld — this is a layout example, not wired into the
// main game flow.
//
// NOTE: the player character sprite is still the free "Adam" sample from
// Modern Interiors (non-commercial license, pixelart/modern-interiors-free/)
// — the office pack has no characters. A character pack needs to be
// bought separately before this ships.
const PROTO_TILE = 32; // display size: source art is 16px, rendered at 2x
const PROTO_GRID_COLS = 25;
const PROTO_GRID_ROWS = 17;
const PROTO_MOVE_DURATION = 150;
const PROTO_PLAYER_START = { col: 12, row: 12 };

// Two cubicle rows (desk+PC against invisible back line, chair in front),
// mirroring Office_Design_2.gif's two parallel rows of workstations.
const PROTO_DESK_COLS = [3, 7, 11, 15, 19];
const PROTO_DESK_ROW_A = 3;
const PROTO_DESK_ROW_B = 9;

const PROTO_PLANTS = [
  { col: 2, row: 2, variant: 'plant2' }, { col: 22, row: 2, variant: 'plant3' },
  { col: 2, row: 15, variant: 'plant3' }, { col: 22, row: 15, variant: 'plant2' },
  { col: 12, row: 6, variant: 'plant2' }
];
const PROTO_SERVERS = [{ col: 2, row: 6 }, { col: 2, row: 7 }];
const PROTO_CABINETS = [{ col: 21, row: 6 }]; // 2 tiles wide
const PROTO_PRINTER = { col: 21, row: 9 };
const PROTO_WALL_BOARDS = [{ col: 2, row: 0 }, { col: 20, row: 0 }]; // 2 tiles wide each, clear of the title bar
const PROTO_RECEPTION_DESK = { col: 11, row: 14 }; // 2 tiles wide
const PROTO_COUCHES = [{ col: 5, row: 14 }]; // 2 tiles wide
const PROTO_RUG = { col: 11, row: 13 };

class PixelRoomProtoScene extends Phaser.Scene {
  constructor() {
    super('PixelRoomProto');
  }

  preload() {
    const p = 'src/assets/preview-room/';
    this.load.image('proto-floor', p + 'office_floor.png');
    this.load.image('proto-wall', p + 'office_wall.png');
    this.load.image('proto-desk-pc', p + 'desk_pc.png');
    this.load.image('proto-chair2', p + 'chair2.png');
    this.load.image('proto-plant2', p + 'plant2.png');
    this.load.image('proto-plant3', p + 'plant3.png');
    this.load.image('proto-server', p + 'server_rack.png');
    this.load.image('proto-desk-plain', p + 'desk_plain2.png');
    this.load.image('proto-couch', p + 'couch.png');
    this.load.image('proto-wall-board', p + 'wall_board.png');
    this.load.image('proto-cabinet2', p + 'cabinet2.png');
    this.load.image('proto-printer', p + 'printer_station.png');
    this.load.image('proto-rug', p + 'rug.png');
    this.load.image('proto-player', p + 'player.png');
  }

  create() {
    this.cameras.main.setBackgroundColor('#0f0f1e');
    this.obstacles = [];

    this.drawFloor();
    this.spawnRug();
    this.drawWalls();
    this.spawnWallBoards();
    this.spawnDeskRow(PROTO_DESK_ROW_A);
    this.spawnDeskRow(PROTO_DESK_ROW_B);
    this.spawnServers();
    this.spawnCabinets();
    this.spawnPrinter();
    this.spawnReception();
    this.spawnCouches();
    this.spawnPlants();

    this.add.text(400, 10, '🧪 Sala completa — Modern Office Revamped (licença comercial)', {
      fontSize: '12px', color: '#4ecca3', backgroundColor: '#0f0f1eaa', padding: { x: 6, y: 3 }
    }).setOrigin(0.5, 0);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
    this.isMoving = false;

    const start = this.gridToPixel(PROTO_PLAYER_START.col, PROTO_PLAYER_START.row);
    this.playerGrid = { ...PROTO_PLAYER_START };
    this.player = this.add.image(start.x, start.y, 'proto-player').setDisplaySize(32, 64).setOrigin(0.5, 0.75).setDepth(PROTO_PLAYER_START.row);

    this.add.text(16, 578, 'Setas/WASD para mover — personagem ainda é o Adam grátis (não-comercial)', {
      fontSize: '11px', color: '#ffffff', backgroundColor: '#0f0f1eaa', padding: { x: 4, y: 2 }
    });
    this.makeButton(730, 580, 'Voltar', () => this.scene.start('Start'));
  }

  gridToPixel(col, row) {
    return { x: col * PROTO_TILE + PROTO_TILE / 2, y: row * PROTO_TILE + PROTO_TILE / 2 };
  }

  // Every sprite taller than 1 tile (desks, plants, the player...) draws
  // past its own tile into the row above it, so who-draws-over-who can't be
  // decided by add order alone — depth must track row (further down the
  // room = higher depth = drawn on top), same trick as the isometric demo.
  // Floor/rug sit on a constant depth below every row so they never
  // outrank a piece of furniture.
  static FLOOR_DEPTH = -1;

  drawFloor() {
    for (let row = 0; row < PROTO_GRID_ROWS; row++) {
      for (let col = 0; col < PROTO_GRID_COLS; col++) {
        const pos = this.gridToPixel(col, row);
        this.add.image(pos.x, pos.y, 'proto-floor').setDisplaySize(PROTO_TILE, PROTO_TILE).setDepth(PixelRoomProtoScene.FLOOR_DEPTH);
      }
    }
  }

  drawWalls() {
    for (let col = 0; col < PROTO_GRID_COLS; col++) {
      this.addWallTile(col, 0);
      this.addWallTile(col, PROTO_GRID_ROWS - 1);
    }
    for (let row = 0; row < PROTO_GRID_ROWS; row++) {
      this.addWallTile(0, row);
      this.addWallTile(PROTO_GRID_COLS - 1, row);
    }
  }

  addWallTile(col, row) {
    const pos = this.gridToPixel(col, row);
    this.add.image(pos.x, pos.y, 'proto-wall').setDisplaySize(PROTO_TILE, PROTO_TILE).setDepth(row);
    this.obstacles.push({ col, row });
  }

  // Desk+PC against the row above, chair right in front of it — a cubicle
  // workstation in two sprites instead of three (the monitor/keyboard is
  // already baked into the desk sprite).
  spawnDeskRow(row) {
    PROTO_DESK_COLS.forEach(col => {
      const deskPos = this.gridToPixel(col, row);
      this.add.image(deskPos.x, deskPos.y, 'proto-desk-pc').setDisplaySize(52, 64).setOrigin(0.5, 0.61).setDepth(row);
      this.obstacles.push({ col, row });

      // Every obstacle's origin.y is tuned so its sprite overlaps a few
      // px past its own tile's bottom edge, into the tile the player
      // approaches from — flush-to-boundary still read as a gap, so each
      // one is nudged further down than a straight "bottom = tile edge"
      // calculation (same ratio the user picked for the chair, 0.40).
      const chairRow = row + 1;
      const chairPos = this.gridToPixel(col, chairRow);
      this.add.image(chairPos.x, chairPos.y, 'proto-chair2').setDisplaySize(32, 42).setOrigin(0.5, 0.40).setDepth(chairRow);
      this.obstacles.push({ col, row: chairRow });
    });
  }

  spawnServers() {
    PROTO_SERVERS.forEach(({ col, row }) => {
      const pos = this.gridToPixel(col, row);
      this.add.image(pos.x, pos.y, 'proto-server').setDisplaySize(46, 68).setOrigin(0.5, 0.63).setDepth(row);
      this.obstacles.push({ col, row });
    });
  }

  // 2-tiles-wide sprites: `col` is the left tile, both tiles are blocked.
  spawnCabinets() {
    PROTO_CABINETS.forEach(({ col, row }) => {
      const leftPos = this.gridToPixel(col, row);
      this.add.image(leftPos.x + PROTO_TILE / 2, leftPos.y, 'proto-cabinet2').setDisplaySize(64, 38).setOrigin(0.5, 0.34).setDepth(row);
      this.obstacles.push({ col, row }, { col: col + 1, row });
    });
  }

  spawnPrinter() {
    const { col, row } = PROTO_PRINTER;
    const pos = this.gridToPixel(col, row);
    this.add.image(pos.x, pos.y, 'proto-printer').setDisplaySize(52, 54).setOrigin(0.5, 0.53).setDepth(row);
    this.obstacles.push({ col, row });
  }

  spawnWallBoards() {
    PROTO_WALL_BOARDS.forEach(({ col, row }) => {
      const leftPos = this.gridToPixel(col, row);
      this.add.image(leftPos.x + PROTO_TILE / 2, leftPos.y, 'proto-wall-board').setDisplaySize(60, 46).setOrigin(0.5, 0.45).setDepth(row);
      this.obstacles.push({ col, row }, { col: col + 1, row });
    });
  }

  spawnReception() {
    const { col, row } = PROTO_RECEPTION_DESK;
    const leftPos = this.gridToPixel(col, row);
    this.add.image(leftPos.x + PROTO_TILE / 2, leftPos.y, 'proto-desk-plain').setDisplaySize(64, 38).setOrigin(0.5, 0.34).setDepth(row);
    this.obstacles.push({ col, row }, { col: col + 1, row });
  }

  spawnCouches() {
    PROTO_COUCHES.forEach(({ col, row }) => {
      const leftPos = this.gridToPixel(col, row);
      this.add.image(leftPos.x + PROTO_TILE / 2, leftPos.y, 'proto-couch').setDisplaySize(62, 48).setOrigin(0.5, 0.48).setDepth(row);
      this.obstacles.push({ col, row }, { col: col + 1, row });
    });
  }

  spawnPlants() {
    PROTO_PLANTS.forEach(({ col, row, variant }) => {
      const pos = this.gridToPixel(col, row);
      const key = variant === 'plant3' ? 'proto-plant3' : 'proto-plant2';
      const w = variant === 'plant3' ? 24 : 32;
      this.add.image(pos.x, pos.y, key).setDisplaySize(w, 52).setOrigin(0.5, 0.52).setDepth(row);
      this.obstacles.push({ col, row });
    });
  }

  // Decorative only — walkable, drawn right after the floor, same constant
  // depth as the floor so it never outranks furniture or the player.
  spawnRug() {
    const pos = this.gridToPixel(PROTO_RUG.col, PROTO_RUG.row);
    this.add.image(pos.x, pos.y, 'proto-rug').setDisplaySize(80, 120).setDepth(PixelRoomProtoScene.FLOOR_DEPTH);
  }

  makeButton(x, y, label, onClick) {
    const btn = this.add.text(x, y, label, {
      fontSize: '12px', color: '#ffffff', backgroundColor: '#0f3460',
      padding: { x: 10, y: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#16213e' }));
    btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#0f3460' }));
    btn.on('pointerdown', onClick);
    return btn;
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

    if (dCol !== 0 || dRow !== 0) this.tryMove(dCol, dRow);
  }

  tryMove(dCol, dRow) {
    const targetCol = this.playerGrid.col + dCol;
    const targetRow = this.playerGrid.row + dRow;
    if (targetCol < 0 || targetCol >= PROTO_GRID_COLS || targetRow < 0 || targetRow >= PROTO_GRID_ROWS) return;

    const blocked = this.obstacles.some(o => o.col === targetCol && o.row === targetRow);
    if (blocked) return;

    this.isMoving = true;
    this.playerGrid = { col: targetCol, row: targetRow };
    this.player.setDepth(targetRow);
    const dest = this.gridToPixel(targetCol, targetRow);

    this.tweens.add({
      targets: this.player,
      x: dest.x, y: dest.y,
      duration: PROTO_MOVE_DURATION,
      onComplete: () => { this.isMoving = false; }
    });
  }
}
