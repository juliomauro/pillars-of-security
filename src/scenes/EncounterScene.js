class EncounterScene extends Phaser.Scene {
  constructor() {
    super('Encounter');
  }

  create({ npcId }) {
    this.npcId = npcId;
    this.data_ = getEncounter(this, npcId);

    this.cameras.main.setBackgroundColor('#0f0f1e');

    this.add.text(400, 30, t(this, 'newEmail'), { fontSize: '20px', color: '#e94560' }).setOrigin(0.5);

    this.add.rectangle(400, 220, 640, 300, 0x1a1a2e).setStrokeStyle(2, 0x4ecca3);

    this.add.text(100, 100,
      `${t(this, 'fromLabel')}: ${this.data_.from}\n${t(this, 'subjectLabel')}: ${this.data_.subject}\n\n${this.data_.body}`,
      { fontSize: '13px', color: '#ffffff', wordWrap: { width: 600 }, lineSpacing: 4 }
    );

    this.makeButton(250, 430, t(this, 'reportBtn'), () => this.resolve('report'));
    this.makeButton(550, 430, t(this, 'clickBtn'), () => this.resolve('click'));
  }

  makeButton(x, y, label, onClick) {
    const btn = this.add.text(x, y, label, {
      fontSize: '14px', color: '#ffffff', backgroundColor: '#0f3460',
      padding: { x: 14, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#16213e' }));
    btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#0f3460' }));
    btn.on('pointerdown', onClick);
    return btn;
  }

  resolve(choice) {
    this.children.list
      .filter(c => c.type === 'Text' && c.input)
      .forEach(c => c.disableInteractive());

    const success = choice === this.data_.correctChoice;

    const cleared = this.registry.get('clearedNpcIds') || [];
    cleared.push(this.npcId);
    this.registry.set('clearedNpcIds', cleared);
    this.registry.set('attemptedCount', (this.registry.get('attemptedCount') || 0) + 1);

    if (success) {
      this.registry.set('score', (this.registry.get('score') || 0) + 100);
      this.registry.set('correctCount', (this.registry.get('correctCount') || 0) + 1);
      this.registry.set('halfHearts', Math.min(8, (this.registry.get('halfHearts') ?? 8) + 1));
    } else {
      this.registry.set('halfHearts', Math.max(0, (this.registry.get('halfHearts') ?? 8) - 2));
    }

    this.showResult(success);
  }

  showResult(success) {
    this.add.rectangle(400, 300, 800, 600, 0x000000, 0.85);

    const title = success ? t(this, 'successTitle') : t(this, 'failTitle');
    this.add.text(400, 110, title, {
      fontSize: '18px', color: success ? '#4ecca3' : '#e94560'
    }).setOrigin(0.5);

    const flagsText = this.data_.redFlags.map(f => `• ${f}`).join('\n\n');
    this.add.text(400, 240, flagsText, {
      fontSize: '12px', color: '#ffffff', wordWrap: { width: 640 }, align: 'left',
      lineSpacing: 6
    }).setOrigin(0.5, 0);

    if (success) {
      this.add.text(400, 450, t(this, 'badgeEarned'), {
        fontSize: '14px', color: '#4ecca3'
      }).setOrigin(0.5);
    }

    this.makeButton(400, 540, t(this, 'continueBtn'), () => {
      const halfHearts = this.registry.get('halfHearts');
      if (halfHearts <= 0) {
        this.scene.start('Results', { reason: 'gameover' });
      } else {
        this.scene.start('Overworld');
      }
    });
  }
}
