# Pillars of Security

Jogo estilo Pokémon no navegador, ensinando segurança digital no trabalho (phishing, engenharia social, etc.) para a Sinch. Sucessor espiritual do [WAVY PILLARS](https://github.com/juliomauro/wavy-game).

Status: **esqueleto / protótipo** — um cenário funcionando (phishing por e-mail), pra validar a sensação do jogo antes de desenhar o resto do conteúdo.

## Como funciona

- Mapa livre (Overworld): anda pelo escritório virtual com setas/WASD.
- Encostar num "NPC" (hoje: a caixa de entrada vermelha) dispara um **encontro** — uma decisão de segurança no lugar de uma batalha.
- Acertar a decisão certa dá um badge; errar explica os sinais de alerta que passaram batido.

## Rodar localmente

Não precisa de build. Só servir os arquivos estáticos (não dá pra abrir `index.html` direto via `file://` por causa de CORS do módulo do Phaser):

```bash
python3 -m http.server 8000
```

Depois abre `http://localhost:8000`.

## Stack

- [Phaser 3](https://phaser.io/) via CDN, sem bundler
- Sem assets externos no esqueleto — toda a arte é gerada por código (retângulos coloridos), pra focar na mecânica primeiro

## Próximos passos

- Trocar a arte placeholder por sprites de verdade
- Adicionar mais cenários: tailgating, pen drive desconhecido, ligação falsa de TI, link suspeito no Slack
- Sistema de progressão (badges coletados, tela de conclusão)
- Se virar treinamento oficial: avaliar empacotamento SCORM/xAPI pra integrar com LMS
