# Pillars of Security

Jogo estilo Pokémon no navegador, ensinando segurança digital no trabalho (phishing, engenharia social, etc.) para a Sinch. Sucessor espiritual do [WAVY PILLARS](https://github.com/juliomauro/wavy-game).

Status: **protótipo em pausa** — mecânica principal (5 salas, 8 categorias de cenário, sistema de vidas/rank) funcionando com arte placeholder; a troca por pixel art de verdade está em teste numa cena separada, ver `src/scenes/PixelRoomProtoScene.js`.

## Como funciona

- Mapa livre (Overworld): anda pelas 5 salas do escritório com setas/WASD, portas sólidas conectam as salas (Ação pra atravessar).
- Encostar num NPC de categoria dispara um **encontro** — uma decisão de segurança no lugar de uma batalha.
- Acertar a decisão certa soma pontos e recupera meio coração; errar explica os sinais de alerta que passaram batido.
- Ao concluir todas as categorias (ou zerar os corações), tela de resultado com rank E-S e breakdown por categoria.

## Rodar localmente

Não precisa de build. Só servir os arquivos estáticos (não dá pra abrir `index.html` direto via `file://` por causa de CORS do módulo do Phaser):

```bash
python3 -m http.server 8000
```

Depois abre `http://localhost:8000`.

## Stack

- [Phaser 3](https://phaser.io/) via CDN, sem bundler
- Jogo principal (`src/scenes/`) roda 100% com arte gerada por código (retângulos coloridos), pra focar na mecânica primeiro
- Protótipo de sala com pixel art de verdade usa sprites extraídos de pacotes comerciais (ver `src/assets/preview-room/` e a seção de estrutura abaixo)

## Estrutura do projeto

- `src/` — código do jogo (cenas Phaser, dados dos cenários, i18n)
- `src/assets/preview-room/` — sprites já recortados e em uso no protótipo de sala (rastreado no git; licença permite usar o asset editado no projeto)
- `docs/design/` — GDD e diagrama de fluxo
- `docs/concept-art/` — imagens de referência visual
- `docs/content/` — texto corrido dos cenários atuais e backlog de sugestões
- `pixelart/` — pacotes brutos de pixel art comprados/baixados (fora do git, ver `.gitignore` — não pode ser redistribuído pela licença)

## Próximos passos

- Decidir biblioteca de pixel art definitiva e terminar a extração de sprites (ver `pixelart/`)
- Comprar um pacote de personagens com licença comercial (o protótipo atual usa um personagem de amostra grátis, não-comercial)
- Adicionar mais cenários: pen drive desconhecido, ligação falsa de TI, link suspeito no Slack
- Implementar a mecânica da cafeteira (easter egg, sala do Refeitório já reservada)
- Se virar treinamento oficial: avaliar empacotamento SCORM/xAPI pra integrar com LMS
