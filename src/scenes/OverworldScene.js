// Grid size for the floor tiles (visual only — movement is free, not snapped).
const TILE = 32;

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

    this.player = this.physics.add.sprite(400, 300, 'player');
    this.player.setCollideWorldBounds(true);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');

    this.add.text(16, 16, 'Pillars of Security', { fontSize: '14px', color: '#ffffff' });
    renderHearts(this, 596, 16, this.registry.get('halfHearts') ?? 8);
    this.add.text(596, 46, `${t(this, 'scoreLabel')}: ${this.registry.get('score') || 0}`, {
      fontSize: '14px', color: '#ffffff'
    });

    const entry = this.registry.get('encounterPlan')[this.registry.get('encounterIndex')];
    const lastShownDay = this.registry.get('lastShownDayId');

    this.encounterLocked = false;

    if (entry.dayId !== lastShownDay) {
      this.showDayBanner(entry, () => this.spawnCategoryNpc(entry));
    } else {
      this.spawnCategoryNpc(entry);
    }
  }

  drawFloor() {
    for (let x = 0; x < 800; x += TILE) {
      for (let y = 0; y < 600; y += TILE) {
        this.add.image(x + TILE / 2, y + TILE / 2, 'floor');
      }
    }
  }

  showDayBanner(entry, onDismiss) {
    this.physics.pause();
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.85).setDepth(10);
    const title = this.add.text(400, 260, entry.dayName, { fontSize: '26px', color: '#4ecca3' }).setOrigin(0.5).setDepth(11);
    const sub = this.add.text(400, 310, entry.categoryName, { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5).setDepth(11);

    const btn = this.add.text(400, 380, t(this, 'start'), {
      fontSize: '14px', color: '#ffffff', backgroundColor: '#0f3460', padding: { x: 14, y: 8 }
    }).setOrigin(0.5).setDepth(11).setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      this.registry.set('lastShownDayId', entry.dayId);
      overlay.destroy();
      title.destroy();
      sub.destroy();
      btn.destroy();
      this.physics.resume();
      onDismiss();
    });
  }

  spawnCategoryNpc(entry) {
    const category = SCENARIO_CATEGORIES[entry.categoryId];
    const textureKey = 'npc-' + entry.categoryId;
    if (!this.textures.exists(textureKey)) {
      this.generateTexture(textureKey, category.color, 24, 24);
    }

    this.npc = this.physics.add.staticSprite(200, 200, textureKey);
    this.add.text(200, 170, `${category.icon} ${category.name}`, { fontSize: '12px', color: '#e94560' }).setOrigin(0.5);
    this.physics.add.overlap(this.player, this.npc, this.startEncounter, null, this);

    this.add.text(16, 560, t(this, 'overworldHint'), { fontSize: '12px', color: '#aaaaaa' });
  }

  startEncounter() {
    if (this.encounterLocked) return;
    this.encounterLocked = true;
    this.scene.start('Encounter');
  }

  update() {
    if (!this.player || !this.player.body) return;

    const speed = 160;
    this.player.setVelocity(0);

    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;

    if (left) this.player.setVelocityX(-speed);
    else if (right) this.player.setVelocityX(speed);
    if (up) this.player.setVelocityY(-speed);
    else if (down) this.player.setVelocityY(speed);

    this.player.body.velocity.normalize().scale(speed);
  }
}
