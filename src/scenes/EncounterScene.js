const CHOICE_COLOR = '#0f3460';
const CHOICE_COLOR_SELECTED = '#4ecca3';

class EncounterScene extends Phaser.Scene {
  constructor() {
    super('Encounter');
  }

  create({ categoryId }) {
    this.categoryId = categoryId;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
    this.actionKeys = this.input.keyboard.addKeys({ space: 'SPACE', enter: 'ENTER' });
    this.actionJustDown = false;
    this.upJustDown = false;
    this.downJustDown = false;

    this.renderCurrent();
  }

  // Re-used both on first entry and when chaining to the next scenario in
  // the same category, without leaving this scene.
  renderCurrent() {
    this.children.removeAll(true);
    this.cameras.main.setBackgroundColor('#0f0f1e');
    this.phase = 'choosing';
    this.selectedIndex = 0;

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
      this.makeButton(400, 400 + i * 55, `${choice}`, () => this.resolve(i))
    );
    this.updateSelectionHighlight();
  }

  makeButton(x, y, label, onClick) {
    const btn = this.add.text(x, y, label, {
      fontSize: '13px', color: '#ffffff', backgroundColor: CHOICE_COLOR,
      padding: { x: 14, y: 8 }, align: 'center', wordWrap: { width: 620 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => { if (btn.input.enabled) btn.setStyle({ backgroundColor: '#16213e' }); });
    btn.on('pointerout', () => { if (btn.input.enabled) this.updateSelectionHighlight(); });
    btn.on('pointerdown', onClick);
    return btn;
  }

  // Keyboard cursor: highlights whichever choice Up/Down currently points
  // at, so Action confirms the same thing a click would.
  updateSelectionHighlight() {
    if (!this.choiceButtons) return;
    this.choiceButtons.forEach((btn, i) => {
      btn.setStyle({ backgroundColor: i === this.selectedIndex ? CHOICE_COLOR_SELECTED : CHOICE_COLOR });
    });
  }

  resolve(choiceIndex) {
    this.phase = 'result';
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

    this.continueButton = this.makeButton(400, 540, t(this, 'continueBtn'), () => this.advance());
    this.continueButton.setStyle({ backgroundColor: CHOICE_COLOR_SELECTED });
  }

  update() {
    const actionDown = this.actionKeys.space.isDown || this.actionKeys.enter.isDown;
    if (actionDown && !this.actionJustDown) {
      this.actionJustDown = true;
      this.onAction();
    } else if (!actionDown) {
      this.actionJustDown = false;
    }

    if (this.phase !== 'choosing') return;

    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;

    if (up && !this.upJustDown) {
      this.upJustDown = true;
      this.moveSelection(-1);
    } else if (!up) {
      this.upJustDown = false;
    }

    if (down && !this.downJustDown) {
      this.downJustDown = true;
      this.moveSelection(1);
    } else if (!down) {
      this.downJustDown = false;
    }
  }

  moveSelection(delta) {
    const count = this.choiceButtons.length;
    this.selectedIndex = (this.selectedIndex + delta + count) % count;
    this.updateSelectionHighlight();
  }

  onAction() {
    if (this.phase === 'choosing') {
      this.resolve(this.selectedIndex);
    } else if (this.phase === 'result') {
      this.advance();
    }
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

    // This category is done. The player is free to roam between rooms now —
    // the only thing that ends the run is clearing every category, in any
    // order, not finishing "today's" pair specifically.
    const allDone = Object.keys(SCENARIO_CATEGORIES).every(id => queueIndex[id] >= SCENARIOS_PER_CATEGORY);

    if (allDone) {
      this.scene.start('Results', { reason: 'cleared' });
    } else {
      this.scene.start('Overworld');
    }
  }
}
