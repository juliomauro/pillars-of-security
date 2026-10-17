class EncounterScene extends Phaser.Scene {
  constructor() {
    super('Encounter');
  }

  create() {
    this.renderCurrent();
  }

  // Re-used both on first entry and when chaining to the next scenario in
  // the same category, without leaving this scene.
  renderCurrent() {
    this.children.removeAll(true);
    this.cameras.main.setBackgroundColor('#0f0f1e');

    const plan = this.registry.get('encounterPlan');
    const index = this.registry.get('encounterIndex');
    this.entry = plan[index];
    const data = this.entry.scenario;

    this.add.text(400, 30, `${SCENARIO_CATEGORIES[this.entry.categoryId].icon} ${this.entry.categoryName}`, {
      fontSize: '18px', color: '#e94560'
    }).setOrigin(0.5);

    this.add.rectangle(400, 220, 640, 300, 0x1a1a2e).setStrokeStyle(2, 0x4ecca3);
    this.add.text(100, 90, data.situation, {
      fontSize: '14px', color: '#ffffff', wordWrap: { width: 600 }, lineSpacing: 6
    });

    this.choiceButtons = data.choices.map((choice, i) =>
      this.makeButton(400, 400 + i * 55, choice, () => this.resolve(i))
    );
  }

  makeButton(x, y, label, onClick) {
    const btn = this.add.text(x, y, label, {
      fontSize: '13px', color: '#ffffff', backgroundColor: '#0f3460',
      padding: { x: 14, y: 8 }, align: 'center', wordWrap: { width: 620 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#16213e' }));
    btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#0f3460' }));
    btn.on('pointerdown', onClick);
    return btn;
  }

  resolve(choiceIndex) {
    this.choiceButtons.forEach(b => b.disableInteractive());

    const data = this.entry.scenario;
    const success = choiceIndex === data.correctIndex;

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
    this.add.rectangle(400, 300, 800, 600, 0x000000, 0.88);

    this.add.text(400, 90, success ? t(this, 'successTitle') : t(this, 'failTitle'), {
      fontSize: '18px', color: success ? '#4ecca3' : '#e94560'
    }).setOrigin(0.5);

    const text = this.entry.scenario.explanation.map(f => `• ${f}`).join('\n\n');
    this.add.text(400, 220, text, {
      fontSize: '12px', color: '#ffffff', wordWrap: { width: 640 }, align: 'left', lineSpacing: 6
    }).setOrigin(0.5, 0);

    this.makeButton(400, 540, t(this, 'continueBtn'), () => this.advance());
  }

  advance() {
    if ((this.registry.get('halfHearts') ?? 8) <= 0) {
      this.scene.start('Results', { reason: 'gameover' });
      return;
    }

    const nextIndex = this.registry.get('encounterIndex') + 1;
    this.registry.set('encounterIndex', nextIndex);
    const plan = this.registry.get('encounterPlan');

    if (nextIndex >= plan.length) {
      this.scene.start('Results', { reason: 'cleared' });
      return;
    }

    const sameCategory = plan[nextIndex].categoryId === this.entry.categoryId;
    if (sameCategory) {
      this.renderCurrent();
    } else {
      this.scene.start('Overworld');
    }
  }
}
