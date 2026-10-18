const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  pixelArt: true,
  scene: [StartScene, PixelRoomProtoScene, OverworldScene, EncounterScene, ResultsScene]
};

new Phaser.Game(config);
