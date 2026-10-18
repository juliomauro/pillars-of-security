// Single source of truth for max lives: 4 full hearts.
const MAX_HALF_HEARTS = 8;

// Renders a row of heart icons for `halfHearts` out of `maxHalfHearts`.
// Each heart slot is worth 2 half-points: full (both), half (one), empty (none).
function renderHearts(scene, x, y, halfHearts, maxHalfHearts = MAX_HALF_HEARTS) {
  const totalHearts = maxHalfHearts / 2;
  const texts = [];
  for (let i = 0; i < totalHearts; i++) {
    const remaining = halfHearts - i * 2;
    let char = '♡';
    let color = '#555566';
    if (remaining >= 2) {
      char = '♥';
      color = '#e94560';
    } else if (remaining === 1) {
      char = '♥';
      color = '#f3a683';
    }
    texts.push(scene.add.text(x + i * 26, y, char, { fontSize: '22px', color }));
  }
  return texts;
}
