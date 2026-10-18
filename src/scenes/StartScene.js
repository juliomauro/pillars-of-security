class StartScene extends Phaser.Scene {
  constructor() {
    super('Start');
  }

  create() {
    this.registry.set('language', 'pt');
    this.registry.set('playerName', 'Jogador');
    this.renderLanguageStep();
  }

  renderLanguageStep() {
    this.children.removeAll(true);
    this.add.text(400, 110, 'Pillars of Security', { fontSize: '28px', color: '#4ecca3' }).setOrigin(0.5);
    this.add.text(400, 160, 'Choose your language / Escolha seu idioma / Välj ditt språk', {
      fontSize: '13px', color: '#ffffff'
    }).setOrigin(0.5);

    const langs = [['en', 'English'], ['pt', 'Português'], ['sv', 'Svenska']];
    langs.forEach(([code, label], i) => {
      this.makeButton(400, 250 + i * 60, label, () => {
        this.registry.set('language', code);
        this.startGame();
      });
    });

    this.add.text(400, 570, '🧪 Protótipo da sala em pixel art (dev)', {
      fontSize: '11px', color: '#555566'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('PixelRoomProto'));
  }

  startGame() {
    this.registry.set('halfHearts', MAX_HALF_HEARTS);
    this.registry.set('score', 0);
    this.registry.set('attemptedCount', 0);
    this.registry.set('correctCount', 0);
    this.registry.set('categoryBanks', buildCategoryBanks());
    this.registry.set('categoryQueueIndex', buildInitialQueueIndex());
    this.registry.set('categoryStats', buildInitialCategoryStats());
    this.registry.set('currentRoom', 0);
    this.registry.set('pendingEntry', null);
    this.scene.start('Overworld');
  }

  makeButton(x, y, label, onClick) {
    const btn = this.add.text(x, y, label, {
      fontSize: '16px', color: '#ffffff', backgroundColor: '#0f3460',
      padding: { x: 16, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#16213e' }));
    btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#0f3460' }));
    btn.on('pointerdown', onClick);
    return btn;
  }
}
