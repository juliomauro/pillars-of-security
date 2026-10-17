class EncounterScene extends Phaser.Scene {
  constructor() {
    super('Encounter');
  }

  create({ categoryId }) {
    this.categoryId = categoryId;
    this.renderCurrent();
  }

  // Re-used both on first entry and when chaining to the next scenario in
  // the same category, without leaving this scene.
  renderCurrent() {
    this.children.removeAll(true);
    this.cameras.main.setBackgroundColor('#0f0f1e');

    const bank = this.registry.get('categoryBanks')[this.categoryId];
    const queueIndex = this.registry.get('categoryQueueIndex')[this.categoryId];
    this.scenario = bank[queueIndex];
    const category = SCENARIO_CATEGORIES[this.categoryId];

    this.add.text(400, 30, `${category.icon} ${category.name}`, {
      fontSize: '18px', color: '#e94560'
    }).setOrigin(0.5);
    this.add.text(400, 52, `${queueIndex + 1}/${SCENARIOS_PER_CATEGORY}`, {
      fontSize: '12px', color: '#aaaaaa'
    }).setOrigin(0.5);

    this.add.rectangle(400, 220, 640, 300, 0x1a1a2e).setStrokeStyle(2, 0x4ecca3);
    this.add.text(100, 90, this.scenario.situation, {
      fontSize: '14px', color: '#ffffff', wordWrap: { width: 600 }, lineSpacing: 6
    });

    this.choiceButtons = this.scenario.choices.map((choice, i) =>
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

    const success = choiceIndex === this.scenario.correctIndex;

    const stats = this.registry.get('categoryStats');
    stats[this.categoryId].attempted += 1;
    if (success) stats[this.categoryId].correct += 1;
    this.registry.set('categoryStats', stats);

    this.registry.set('attemptedCount', (this.registry.get('attemptedCount') || 0) + 1);
    if (success) {
      this.registry.set('score', (this.registry.get('score') || 0) + 100);
      this.registry.set('correctCount', (this.registry.get('correctCount') || 0) + 1);
      this.registry.set('halfHearts', Math.min(8, (this.registry.get('halfHearts') ?? 8) + 1));
    } else {
      this.registry.set('halfHearts', Math.max(0, (this.registry.get('halfHearts') ?? 8) - 2));
    }

    const queueIndex = this.registry.get('categoryQueueIndex');
    queueIndex[this.categoryId] += 1;
    this.registry.set('categoryQueueIndex', queueIndex);

    this.showResult(success);
  }

  showResult(success) {
    this.add.rectangle(400, 300, 800, 600, 0x000000, 0.88);

    this.add.text(400, 90, success ? t(this, 'successTitle') : t(this, 'failTitle'), {
      fontSize: '18px', color: success ? '#4ecca3' : '#e94560'
    }).setOrigin(0.5);

    const text = this.scenario.explanation.map(f => `• ${f}`).join('\n\n');
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

    const queueIndex = this.registry.get('categoryQueueIndex');
    if (queueIndex[this.categoryId] < SCENARIOS_PER_CATEGORY) {
      this.renderCurrent();
      return;
    }

    // This category is done — see if the rest of today's categories are too.
    const dayIndex = this.registry.get('dayIndex');
    const day = DAYS[dayIndex];
    const dayDone = day.categories.every(id => queueIndex[id] >= SCENARIOS_PER_CATEGORY);

    if (!dayDone) {
      this.scene.start('Overworld');
      return;
    }

    const nextDayIndex = dayIndex + 1;
    if (nextDayIndex >= DAYS.length) {
      this.scene.start('Results', { reason: 'cleared' });
    } else {
      this.registry.set('dayIndex', nextDayIndex);
      this.scene.start('Overworld');
    }
  }
}
