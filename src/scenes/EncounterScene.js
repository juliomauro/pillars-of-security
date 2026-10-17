// Content for each encounter. One entry for now; this is the shape future
// scenarios (tailgating, USB drop, fake IT call...) will follow.
const ENCOUNTERS = {
  'phishing-email-1': {
    from: 'IT-Suporte@sinch-suport.net',
    subject: 'Sua senha expira hoje! Ação necessária',
    body:
      'Prezado colaborador,\n\n' +
      'Detectamos que sua senha corporativa expira em algumas horas.\n' +
      'Clique no link abaixo para renová-la imediatamente e evitar\n' +
      'o bloqueio da sua conta:\n\n' +
      'http://sinch-login-verify.com/renovar-senha\n\n' +
      'Equipe de TI',
    correctChoice: 'report',
    redFlags: [
      'Domínio do remetente é "sinch-suport.net" (faltando letra, domínio errado) — não é sinch.com',
      'Link aponta para um domínio diferente ("sinch-login-verify.com"), não um sistema interno real',
      'Urgência artificial ("expira hoje", "bloqueio da conta") é uma tática clássica de phishing',
      'TI nunca pede renovação de senha por link em e-mail'
    ]
  }
};

class EncounterScene extends Phaser.Scene {
  constructor() {
    super('Encounter');
  }

  create({ npcId }) {
    this.npcId = npcId;
    this.data_ = ENCOUNTERS[npcId];

    this.cameras.main.setBackgroundColor('#0f0f1e');

    this.add.text(400, 30, '📧 Novo e-mail', {
      fontSize: '20px', color: '#e94560'
    }).setOrigin(0.5);

    const emailBox = this.add.rectangle(400, 220, 640, 300, 0x1a1a2e)
      .setStrokeStyle(2, 0x4ecca3);

    this.add.text(100, 100,
      `De: ${this.data_.from}\nAssunto: ${this.data_.subject}\n\n${this.data_.body}`,
      { fontSize: '13px', color: '#ffffff', wordWrap: { width: 600 }, lineSpacing: 4 }
    );

    this.makeButton(250, 430, '🚩 Reportar como phishing', () => this.resolve('report'));
    this.makeButton(550, 430, '🔗 Clicar no link', () => this.resolve('click'));

    this.resultGroup = this.add.container(0, 0).setVisible(false);
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
    this.showResult(success);
  }

  showResult(success) {
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.85);

    const title = success
      ? '✅ Boa! Você identificou o phishing.'
      : '❌ Você clicou no link — essa era uma armadilha.';
    this.add.text(400, 120, title, {
      fontSize: '18px', color: success ? '#4ecca3' : '#e94560'
    }).setOrigin(0.5);

    const flagsText = this.data_.redFlags.map(f => `• ${f}`).join('\n\n');
    this.add.text(400, 260, flagsText, {
      fontSize: '12px', color: '#ffffff', wordWrap: { width: 640 }, align: 'left',
      lineSpacing: 6
    }).setOrigin(0.5, 0);

    if (success) {
      this.add.text(400, 480, '🦅 Badge conquistado: Olho de Águia', {
        fontSize: '14px', color: '#4ecca3'
      }).setOrigin(0.5);
    }

    this.makeButton(400, 540, 'Continuar', () => {
      this.scene.start('Overworld', { clearedNpc: success ? this.npcId : null });
    });
  }
}
