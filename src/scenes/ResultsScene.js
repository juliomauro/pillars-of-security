function computeRank(correctCount, attemptedCount) {
  if (attemptedCount === 0) return 'E';
  const pct = correctCount / attemptedCount;
  if (pct >= 1) return 'S';
  if (pct >= 0.9) return 'A';
  if (pct >= 0.75) return 'B';
  if (pct >= 0.5) return 'C';
  if (pct >= 0.25) return 'D';
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
    const rank = computeRank(correctCount, attemptedCount);

    const title = reason === 'gameover' ? t(this, 'gameOverTitle') : t(this, 'clearedTitle');
    const sub = reason === 'gameover' ? t(this, 'gameOverSub') : t(this, 'clearedSub');

    this.add.text(400, 50, title, { fontSize: '24px', color: '#e94560' }).setOrigin(0.5);
    this.add.text(400, 85, sub, { fontSize: '13px', color: '#aaaaaa' }).setOrigin(0.5);

    this.add.text(400, 150, `${t(this, 'playerLabel')}: ${name}`, { fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(400, 180, `${t(this, 'scoreLabel')}: ${score}`, { fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);

    renderHearts(this, 338, 212, halfHearts);
    this.add.text(400, 246, `${t(this, 'livesLabel')}: ${halfHearts / 2}/4`, { fontSize: '12px', color: '#aaaaaa' }).setOrigin(0.5);

    this.add.text(400, 330, rank, {
      fontSize: '96px', color: RANK_COLORS[rank] || '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(400, 400, t(this, 'rankLabel'), { fontSize: '14px', color: '#aaaaaa' }).setOrigin(0.5);

    this.downloadBtn = this.makeButton(290, 500, t(this, 'downloadImage'), () => this.downloadImage());
    this.playAgainBtn = this.makeButton(560, 500, t(this, 'playAgain'), () => this.scene.start('Start'));
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
