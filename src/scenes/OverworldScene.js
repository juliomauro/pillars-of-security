// Grid size for the floor tiles (visual only — movement is free, not snapped).
const TILE = 32;

class OverworldScene extends Phaser.Scene {
  constructor() {
    super('Overworld');
  }

  preload() {
    this.generateTexture('floor', 0x16213e, TILE, TILE, 0x0f3460, 1);
    this.generateTexture('player', 0x4ecca3, 24, 24);
    this.generateTexture('npc-phish', 0xe94560, 24, 24);
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

  create(data = {}) {
    this.drawFloor();

    this.player = this.physics.add.sprite(400, 300, 'player');
    this.player.setCollideWorldBounds(true);

    // Respawn the NPC unless the player just beat this exact encounter
    // (EncounterScene passes back which npcId was resolved).
    if (data.clearedNpc !== 'phishing-email-1') {
      this.npc = this.physics.add.staticSprite(200, 200, 'npc-phish');
      this.npcLabel = this.add.text(200, 170, 'Caixa de entrada', {
        fontSize: '12px', color: '#e94560'
      }).setOrigin(0.5);
      this.physics.add.overlap(this.player, this.npc, this.startEncounter, null, this);
    } else {
      this.add.text(200, 170, 'Badge conquistado', {
        fontSize: '12px', color: '#4ecca3'
      }).setOrigin(0.5);
    }

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');

    this.add.text(16, 16, 'Pillars of Security — esqueleto v0', {
      fontSize: '14px', color: '#ffffff'
    });
    this.add.text(16, 560, 'Setas/WASD para mover. Encoste na caixa de entrada vermelha.', {
      fontSize: '12px', color: '#aaaaaa'
    });

    this.encounterLocked = false;
  }

  drawFloor() {
    const g = this.add.graphics();
    for (let x = 0; x < 800; x += TILE) {
      for (let y = 0; y < 600; y += TILE) {
        this.add.image(x + TILE / 2, y + TILE / 2, 'floor');
      }
    }
  }

  startEncounter(player, npc) {
    if (this.encounterLocked) return;
    this.encounterLocked = true;
    this.scene.start('Encounter', { npcId: 'phishing-email-1' });
  }

  update() {
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
