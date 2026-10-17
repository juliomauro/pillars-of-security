function computeRank(correctCount, attemptedCount, halfHearts, isGameOver) {
  if (isGameOver || attemptedCount === 0) return 'E';
  const pct = correctCount / attemptedCount;
  // S requires both perfect accuracy and finishing with full hearts — a
  // mid-run mistake that later got healed back to full still isn't a flawless run.
  if (pct >= 1 && halfHearts >= MAX_HALF_HEARTS) return 'S';
  if (pct >= 0.85) return 'A';
  if (pct >= 0.70) return 'B';
  if (pct >= 0.50) return 'C';
  if (pct >= 0.30) return 'D';
  return 'E';
}

const RANK_COLORS = { S: '#ffd700', A: '#4ecca3', B: '#4ecca3', C: '#f3a683', D: '#e94560', E: '#e94560' };

class ResultsScene extends Phaser.Scene {
  constructor() {
    super('Results');
  }

  create({ reason }) {
    this.cameras.main.setBackgroundColor('#0f0f1e');

    const name = this.registry.get('playerName') || '???';
    const score = this.registry.get('score') || 0;
    const halfHearts = this.registry.get('halfHearts') || 0;
    const correctCount = this.registry.get('correctCount') || 0;
    const attemptedCount = this.registry.get('attemptedCount') || 0;
    const categoryStats = this.registry.get('categoryStats') || {};
    const rank = computeRank(correctCount, attemptedCount, halfHearts, reason === 'gameover');

    const title = reason === 'gameover' ? t(this, 'gameOverTitle') : t(this, 'clearedTitle');
    const sub = reason === 'gameover' ? t(this, 'gameOverSub') : t(this, 'clearedSub');

    this.add.text(400, 30, title, { fontSize: '22px', color: '#e94560' }).setOrigin(0.5);
    this.add.text(400, 58, sub, { fontSize: '12px', color: '#aaaaaa' }).setOrigin(0.5);

    this.add.text(400, 95, `${t(this, 'playerLabel')}: ${name}`, { fontSize: '15px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(400, 118, `${t(this, 'scoreLabel')}: ${score}`, { fontSize: '15px', color: '#ffffff' }).setOrigin(0.5);

    renderHearts(this, 338, 148, halfHearts);
    this.add.text(400, 180, `${t(this, 'livesLabel')}: ${halfHearts / 2}/${MAX_HALF_HEARTS / 2}`, { fontSize: '11px', color: '#aaaaaa' }).setOrigin(0.5);

    this.add.text(400, 205, t(this, 'categoryBreakdown'), { fontSize: '13px', color: '#4ecca3' }).setOrigin(0.5);
    this.renderCategoryBreakdown(categoryStats);

    this.add.text(400, 330, rank, {
      fontSize: '72px', color: RANK_COLORS[rank] || '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(400, 385, t(this, 'rankLabel'), { fontSize: '13px', color: '#aaaaaa' }).setOrigin(0.5);

    this.downloadBtn = this.makeButton(290, 450, t(this, 'downloadImage'), () => this.downloadImage());
    this.playAgainBtn = this.makeButton(560, 450, t(this, 'playAgain'), () => this.scene.start('Start'));
  }

  // Two columns of 3, so six categories fit in a compact block.
  renderCategoryBreakdown(categoryStats) {
    const ids = Object.keys(SCENARIO_CATEGORIES);
    const columns = [ids.slice(0, 3), ids.slice(3)];
    const columnX = [230, 570];
    const startY = 228;
    const rowHeight = 34;

    columns.forEach((columnIds, col) => {
      columnIds.forEach((categoryId, row) => {
        const category = SCENARIO_CATEGORIES[categoryId];
        const s = categoryStats[categoryId] || { correct: 0, attempted: 0 };
        const pct = s.attempted > 0 ? Math.round((s.correct / s.attempted) * 100) : null;
        const pctText = pct === null ? '—' : `${pct}%`;
        const color = pct === null ? '#555566' : pct >= 70 ? '#4ecca3' : pct >= 40 ? '#f3a683' : '#e94560';

        this.add.text(columnX[col], startY + row * rowHeight, `${category.icon} ${category.name}`, {
          fontSize: '11px', color: '#ffffff'
        }).setOrigin(0.5);
        this.add.text(columnX[col], startY + row * rowHeight + 14, pctText, {
          fontSize: '11px', color
        }).setOrigin(0.5);
      });
    });
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

  // Hides the buttons for one frame so the shared image doesn't include them,
  // snapshots the actual game canvas, and triggers a browser download.
  downloadImage() {
    this.downloadBtn.setVisible(false);
    this.playAgainBtn.setVisible(false);

    this.game.renderer.snapshot((image) => {
      const link = document.createElement('a');
      const safeName = (this.registry.get('playerName') || 'player').replace(/[^a-z0-9]+/gi, '-');
      link.href = image.src;
      link.download = `pillars-of-security-${safeName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.downloadBtn.setVisible(true);
      this.playAgainBtn.setVisible(true);
    });
  }
}
