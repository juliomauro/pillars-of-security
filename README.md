# Pillars of Security

Jogo de treinamento de seguranca estilo RPG/quiz corporativo top-down, no navegador. O jogador anda por um escritorio de 5 salas, conversa com colegas (NPCs) e resolve cenarios reais de seguranca (phishing, engenharia social, tailgating, USB desconhecido, senhas, links suspeitos). Feito para o time de seguranca da Sinch.

A spec do jogo esta em [`Novas-instrucoes.txt`](Novas-instrucoes.txt).

## Arquitetura

O jogo inteiro vive em **um unico arquivo** [`index.html`](index.html), sem build e sem framework de empacotamento. Dentro dele estao, em modulos comentados:

- **AudioSynth** efeitos sonoros 8-bit e trilha lo-fi, sintetizados via Web Audio API (sem arquivos de audio)
- **questions.js** as 30 perguntas (6 categorias x 5), com traducoes de interface EN e PT
- **VoxelArtGenerator** gerador procedural de toda a arte (personagem, NPCs, mobilia, paredes, props), estilo pixel-art cubica 2.5D, desenhada por codigo em canvas
- **UI / HUD / modais** HUD superior, modais de quiz/ajuda/pausa/resultado em HTML + Tailwind, e exportacao do resultado como PNG
- **Cenas Phaser** BootScene, MenuScene, GameScene e ResultScene (Phaser 3.60)
- **main.js** inicializacao da instancia Phaser (canvas 960x576, grade de 20x12 tiles de 48px)

## Direcao de arte

Tudo e **pixel-art procedural**, gerado por codigo, sem assets externos. O estilo e cubico/blocado (2.5D): topo iluminado, frente mais escura e sombra no chao. O personagem e os NPCs tem folha direcional (4 direcoes x 3 frames). Ha animacao de abrir porta, vapor na cafeteira, baloes de fala dos colegas e toasts flutuantes.

## Como jogar

- Mova-se com **setas** ou **WASD** pelas 5 salas (TI, Diretoria, Refeitorio, Contabilidade, RH).
- As portas sao solidas: encoste e aperte **Espaco** ou **Enter** para atravessar.
- Encoste num colega e aperte **Espaco/Enter** para iniciar um cenario. Acerto = +100 pontos e +0,5 coracao. Erro = -1 coracao.
- Sao 4 coracoes (max 4). Zerou = fim de jogo (Rank E).
- No Refeitorio, tome ate 2 cafes na maquina para recuperar vida. Quem toma cafe ganha a badge "Movido a Cafe".
- Conclua as 6 categorias com vida > 0 para vencer. Rank **S** = 100% de acerto e os 4 coracoes cheios.
- **ESC** ou **P** abre a pausa. Idiomas na abertura: **EN** e **PT** (o texto das perguntas fica em portugues).
- Ao final, da pra baixar um cartao de resultado (report card) em PNG.

## Rodar localmente

Nao precisa de build. Sirva os arquivos estaticos a partir da raiz do projeto:

```bash
python3 -m http.server 8000
# ou: npx serve
```

Depois abra `http://localhost:8000`.

## Modo offline

O jogo roda **sem internet**. As tres dependencias externas foram baixadas para a pasta [`vendor/`](vendor/) e o `index.html` aponta para elas localmente:

```
vendor/
  tailwind.js          Tailwind (Play CDN, engine completa, roda offline)
  phaser.min.js        Phaser 3.60.0
  fonts/
    fonts.css          @font-face apontando para arquivos locais
    *.woff2            Inter (400/600/700/800) e Press Start 2P, subsets latin e latin-ext
```

Toda a logica, audio e arte ja eram locais (gerados em codigo). Para o offline funcionar em qualquer clone do repositorio, **mantenha a pasta `vendor/` versionada**. Para validar o modo offline, desligue a rede e abra o jogo pelo servidor local.

## Estrutura do repositorio

```
index.html             o jogo inteiro (logica, arte, audio, cenas, UI)
vendor/                 dependencias locais para rodar offline (Tailwind, Phaser, fontes)
Novas-instrucoes.txt    spec do jogo
pixelart/               pacotes de pixel-art comprados (fora do git, nao usados)
style.css               nao referenciado pelo index.html (os estilos ficam inline)
```

## Conteudo de seguranca

30 cenarios, 5 por categoria, em 6 categorias: Phishing, Engenharia Social, Tailgating, USB Desconhecido, Senhas e Links Suspeitos. Cada cenario tem a situacao, 3 alternativas (embaralhadas a cada partida) e uma explicacao com os porques da resposta correta.
