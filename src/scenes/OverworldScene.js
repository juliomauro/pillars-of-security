// Grid size for the floor tiles (visual only — movement is free, not snapped).
const TILE = 32;

// Fixed map slots for a day's categories. DAYS currently has exactly 2
// categories per day; a 3rd slot is here in case that changes later.
const NPC_POSITIONS = [{ x: 220, y: 220 }, { x: 580, y: 220 }, { x: 400, y: 420 }];

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

    this.encounterLocked = false;

    const dayIndex = this.registry.get('dayIndex');
    const day = DAYS[dayIndex];
    const lastShownDayIndex = this.registry.get('lastShownDayIndex');

    if (dayIndex !== lastShownDayIndex) {
      this.showDayBanner(dayIndex, day, () => this.spawnDayNpcs(day));
    } else {
      this.spawnDayNpcs(day);
    }
  }

  drawFloor() {
    for (let x = 0; x < 800; x += TILE) {
      for (let y = 0; y < 600; y += TILE) {
        this.add.image(x + TILE / 2, y + TILE / 2, 'floor');
      }
    }
  }

  showDayBanner(dayIndex, day, onDismiss) {
    this.physics.pause();
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
      this.physics.resume();
      onDismiss();
    });
  }

  // Spawns one NPC per category still pending today, so the player picks
  // which one to tackle first. Finished categories show a checkmark instead.
  spawnDayNpcs(day) {
    const queueIndex = this.registry.get('categoryQueueIndex');

    day.categories.forEach((categoryId, i) => {
      const pos = NPC_POSITIONS[i] || { x: 400, y: 450 };
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

      const npc = this.physics.add.staticSprite(pos.x, pos.y, textureKey);
      this.add.text(pos.x, pos.y - 30, `${category.icon} ${category.name}`, {
        fontSize: '12px', color: '#e94560'
      }).setOrigin(0.5);
      this.physics.add.overlap(this.player, npc, () => this.startEncounter(categoryId), null, this);
    });

    this.add.text(16, 560, t(this, 'overworldHint'), { fontSize: '12px', color: '#aaaaaa' });
  }

  startEncounter(categoryId) {
    if (this.encounterLocked) return;
    this.encounterLocked = true;
    this.scene.start('Encounter', { categoryId });
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
