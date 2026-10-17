// Each category has a bank of scenarios (more than what's shown per
// playthrough) so a run never has to repeat the same 3 every time.
// Format: { situation, choices: [string,...], correctIndex, explanation: [string,...] }
const SCENARIO_CATEGORIES = {
  phishing: {
    name: 'Phishing',
    icon: '📧',
    color: 0xe94560,
    scenarios: [
      {
        situation: 'Um e-mail chega com o logotipo do financeiro, pedindo revalidação imediata do cadastro bancário pra não atrasar o salário. O link expira em 1 hora.',
        choices: ['Reportar o e-mail ao time de segurança sem clicar em nada', 'Clicar no link rápido pra não perder o prazo', 'Responder o e-mail perguntando se é legítimo'],
        correctIndex: 0,
        explanation: ["Urgência artificial (\"expira em 1 hora\") é tática clássica de phishing", 'Dados bancários nunca devem ser "revalidados" por link de e-mail', 'O financeiro real não usa esse tipo de abordagem — reportar é sempre o caminho seguro']
      },
      {
        situation: 'Uma transportadora avisa que uma encomenda não pôde ser entregue e manda baixar um anexo .zip com o "comprovante".',
        choices: ['Baixar e abrir o .zip pra ver o comprovante', 'Apagar o e-mail sem reportar', 'Reportar como phishing e não abrir o anexo'],
        correctIndex: 2,
        explanation: ['Arquivos .zip anexados pedindo abertura imediata são um vetor clássico de malware', 'Transportadoras reais não enviam "comprovantes" executáveis por e-mail', 'Apagar sem reportar deixa o time de segurança sem visibilidade do ataque']
      },
      {
        situation: 'Um fornecedor parceiro pede atualização dos dados de cobrança, mas o domínio do remetente tem uma letra trocada por um número.',
        choices: ['Atualizar os dados, já que parece ser do fornecedor de sempre', 'Ignorar e não fazer nada', 'Reportar o e-mail e confirmar o pedido por um canal já conhecido do fornecedor'],
        correctIndex: 2,
        explanation: ['Domínio levemente alterado (typosquatting) é um sinal clássico de phishing direcionado', 'Mudança de dados de cobrança sempre deve ser confirmada por um canal independente, não pelo próprio e-mail suspeito', 'Ignorar sem reportar deixa outros colegas vulneráveis ao mesmo ataque']
      },
      {
        situation: 'Um e-mail promocional oferece vale-compras aos primeiros 50 que preencherem um formulário com suas credenciais de rede.',
        choices: ['Reportar como phishing — credenciais de rede nunca são pedidas assim', 'Preencher rápido antes que as vagas acabem', 'Preencher só com uma senha fake pra testar'],
        correctIndex: 0,
        explanation: ['Nenhuma promoção legítima pede credenciais de rede corporativa', "Mesmo uma senha \"fake\" no campo errado pode indicar a um atacante que o e-mail foi aberto e interagido", 'RH/Marketing reais não coletam login de rede para sorteios']
      },
      {
        situation: 'Você percebeu que acabou de clicar num link suspeito e digitou sua senha numa página falsa. E agora?',
        choices: ['Trocar a senha depois, não tem tanta pressa', 'Avisar o time de segurança imediatamente e trocar a senha agora', 'Não contar pra ninguém, pra não passar vergonha'],
        correctIndex: 1,
        explanation: ['Quanto mais rápido avisar, menor a janela de tempo pro atacante usar a credencial', 'Trocar a senha imediatamente limita o estrago', 'Não contar é o pior cenário — o time de segurança não consegue agir no que não sabe que aconteceu']
      }
    ]
  },

  social: {
    name: 'Engenharia Social',
    icon: '🎭',
    color: 0xf3a683,
    scenarios: [
      {
        situation: 'Alguém liga dizendo ser do suporte de TI e pede sua senha "temporariamente" pra aplicar um patch crítico antes do fim do expediente.',
        choices: ['Passar a senha, já que é urgente', 'Passar só os últimos 4 dígitos', 'Negar e orientar a pessoa a abrir um chamado oficial'],
        correctIndex: 2,
        explanation: ['TI nunca precisa da sua senha pra aplicar patches — isso é feito sem a credencial pessoal do usuário', 'Urgência por telefone é uma tática clássica de pretexting', 'Mesmo parcial, nenhuma informação de senha deve ser compartilhada por telefone']
      },
      {
        situation: 'Mensagem urgente no celular, supostamente do CEO, pedindo sigilo total e compra emergencial de cartões-presente.',
        choices: ['Verificar por outro canal oficial antes de agir, e reportar a tentativa', 'Comprar rápido, é o CEO pedindo', 'Ignorar e apagar a mensagem'],
        correctIndex: 0,
        explanation: ['Pedido de sigilo + urgência + compra de cartão-presente é um padrão clássico de golpe de CEO (BEC)', 'Executivos reais não pedem esse tipo de compra por mensagem informal e sigilosa', 'Verificar por canal oficial (ramal conhecido, outro colega) desmonta o golpe rapidamente']
      },
      {
        situation: 'Alguém liga dizendo ter encontrado seu crachá e pede confirmação de CPF, data de nascimento e matrícula "pra garantir que é você".',
        choices: ['Confirmar os dados pra recuperar o crachá', 'Pedir pra pessoa ficar com o crachá já que não é tão importante', 'Não confirmar nenhum dado por telefone e verificar direto com a recepção/segurança'],
        correctIndex: 2,
        explanation: ['Dados como CPF e matrícula nunca devem ser confirmados por telefone pra um desconhecido', 'Esse é um pretexto clássico de coleta de dados pessoais (PII) pra fraude de identidade', 'Verificar direto com a recepção/segurança da empresa é o caminho seguro']
      },
      {
        situation: 'Um prestador uniformizado diz que veio fazer manutenção preventiva nos notebooks e pede que todos deixem as máquinas destravadas.',
        choices: ['Exigir identificação formal e acompanhamento, sem destravar nada sem verificação', 'Destravar a máquina pra agilizar o serviço', 'Destravar só se for rapidinho'],
        correctIndex: 0,
        explanation: ['Nenhum prestador legítimo pede pra deixar notebooks destravados sem supervisão', 'Verificar identificação e ter uma pessoa responsável acompanhando é o procedimento correto', '"Rapidinho" não reduz o risco — bastam segundos pra instalar algo malicioso']
      },
      {
        situation: 'Alguém liga se passando pela operadora de telefonia, pedindo que você dite um código de SMS de 6 dígitos recebido no seu celular corporativo, pra "validar a linha".',
        choices: ['Ditar o código, já que é a operadora', 'Desligar e não compartilhar o código — isso é tentativa de sequestro de conta/SIM swap', 'Ditar só os 3 primeiros dígitos'],
        correctIndex: 1,
        explanation: ['Códigos de SMS/2FA nunca devem ser compartilhados por telefone, nem parcialmente', 'Esse é o padrão clássico de ataque de SIM swap / bypass de autenticação de dois fatores', 'Operadoras reais não pedem o código que elas mesmas enviaram']
      }
    ]
  },

  tailgating: {
    name: 'Tailgating',
    icon: '🚪',
    color: 0x4ecca3,
    scenarios: [
      {
        situation: 'Na catraca, uma pessoa sem identificação pede pra você segurar a porta, dizendo que esqueceu o crachá no carro.',
        choices: ['Não segurar e orientar a pessoa a se identificar na recepção', 'Segurar a porta, parece inofensivo', 'Segurar só se a pessoa parecer confiável'],
        correctIndex: 0,
        explanation: ['Tailgating é uma das formas mais comuns de acesso físico não autorizado', '"Parecer confiável" não é verificação — qualquer pessoa pode alegar isso', 'Toda entrada sem crachá deve passar pela recepção/segurança, sem exceção']
      },
      {
        situation: 'Uma pessoa bem-vestida com pastas de documentos aproveita a porta automática aberta atrás de você pra entrar junto, sem encostar o crachá.',
        choices: ['Deixar passar, parece ser alguém da empresa', 'Fingir não notar', 'Pedir educadamente que a pessoa identifique o próprio acesso'],
        correctIndex: 2,
        explanation: ['Aparência profissional não comprova autorização de acesso', 'Tailgating costuma usar justamente essa confiança social pra passar despercebido', 'Pedir identificação de acesso, mesmo que pareça chato, é a conduta correta']
      },
      {
        situation: 'Você encontra uma pessoa desconhecida, sem crachá de visitante, caminhando sozinha numa área restrita da empresa.',
        choices: ['Ignorar, provavelmente é de outro departamento', 'Abordar educadamente e acionar a segurança/recepção', 'Seguir a pessoa à distância sem falar nada'],
        correctIndex: 1,
        explanation: ['Área restrita sem crachá visível é motivo suficiente para verificação imediata', 'Acionar a segurança é mais eficaz do que confrontar ou apenas observar', 'Ignorar permite que a pessoa continue circulando livremente em área sensível']
      },
      {
        situation: 'Um técnico diz estar atrasado pra um reparo emergencial no datacenter e pede pra você liberar a porta exclusiva com seu crachá.',
        choices: ['Não liberar com seu próprio crachá — encaminhar para quem gerencia o acesso ao datacenter', 'Liberar a porta, já que é uma emergência', 'Liberar, mas acompanhar a pessoa o tempo todo'],
        correctIndex: 0,
        explanation: ['Usar seu crachá pra liberar acesso de terceiros quebra a rastreabilidade de quem entrou onde', '"Emergência" é frequentemente usada como pretexto pra pular verificações', 'O procedimento correto é encaminhar para quem realmente gerencia esse acesso']
      },
      {
        situation: 'Um visitante com crachá de identificação pede pra entrar numa área confidencial sem o funcionário anfitrião responsável por ele.',
        choices: ['Deixar entrar, já que ele tem crachá de visitante', 'Acompanhar o visitante você mesmo, mesmo não sendo o anfitrião designado', 'Não permitir a entrada sem o anfitrião presente'],
        correctIndex: 2,
        explanation: ['Crachá de visitante autoriza presença no prédio, não acesso livre a áreas confidenciais', 'O anfitrião é quem responde pela presença do visitante — sem ele, não há supervisão real', 'Substituir o anfitrião informalmente quebra o processo de responsabilização']
      }
    ]
  },

  usb: {
    name: 'USB Desconhecido',
    icon: '💾',
    color: 0xffd700,
    scenarios: [
      {
        situation: 'Você encontra um pendrive no estacionamento com a etiqueta "Bônus e Salários da Diretoria".',
        choices: ['Conectar rapidinho só pra ver o que tem', 'Não conectar e entregar para o time de segurança/TI', 'Levar pra casa e ver depois'],
        correctIndex: 1,
        explanation: ['Pendrives "achados" com títulos chamativos são uma técnica clássica de ataque (USB drop attack)', 'Mesmo "só olhar" pode executar malware automaticamente ao conectar', 'Entregar para o time de segurança permite análise segura em ambiente controlado']
      },
      {
        situation: 'Em uma reunião presencial, um participante pede pra plugar o próprio pendrive direto no seu notebook corporativo pra mostrar os slides dele.',
        choices: ['Pedir pra ele enviar os slides por um canal corporativo aprovado', 'Plugar o pendrive dele no seu notebook', 'Plugar, mas só por alguns segundos'],
        correctIndex: 0,
        explanation: ['Qualquer dispositivo USB de terceiro é uma fonte potencial de malware, mesmo de gente conhecida', 'Pouco tempo conectado já é suficiente pra comprometer o sistema', 'Canais corporativos (e-mail, nuvem homologada) evitam esse risco completamente']
      },
      {
        situation: 'Você encontra um cabo de carregador abandonado na sala de reuniões e seu celular corporativo está quase sem bateria.',
        choices: ['Usar o cabo, é só um carregador', 'Usar só pra uma carga rápida', 'Evitar usar cabos desconhecidos — eles podem transmitir dados, não só energia'],
        correctIndex: 2,
        explanation: ["Cabos maliciosos (\"juice jacking\") podem transferir dados ou instalar malware via porta USB", 'Não dá pra saber visualmente se um cabo foi alterado', 'Levar seu próprio carregador/cabo é sempre a opção mais segura']
      },
      {
        situation: 'Você encontra um pendrive comum em cima da sua mesa e conecta pra tentar identificar o dono pelo conteúdo. Mas o Windows mostra "Instalando dispositivo: teclado USB" — nunca apareceu isso antes ao plugar um pendrive.',
        choices: ['Desconectar o dispositivo imediatamente e avisar o time de segurança', 'Ignorar o aviso, provavelmente é só uma atualização', 'Reiniciar o computador e seguir normalmente'],
        correctIndex: 0,
        explanation: ['Dispositivos USB que se disfarçam de teclado ("USB Rubber Ducky") podem injetar comandos maliciosos automaticamente', 'Esse comportamento não é uma atualização normal de sistema', 'Desconectar e reportar rápido limita o dano potencial']
      },
      {
        situation: 'Um cliente insiste em entregar arquivos de contrato só em uma mídia USB física, em vez de e-mail ou nuvem homologada.',
        choices: ['Conectar a mídia direto no seu notebook de trabalho', 'Recusar o contrato completamente', 'Pedir pra passar por um processo seguro de verificação de mídia antes de qualquer conexão'],
        correctIndex: 2,
        explanation: ['Mídia USB externa deve sempre passar por verificação antes de tocar em qualquer máquina da rede corporativa', 'Conectar direto expõe toda a rede a um risco desnecessário', 'Recusar o contrato não é necessário — existe um processo seguro pra isso']
      }
    ]
  },

  passwords: {
    name: 'Senhas',
    icon: '🔑',
    color: 0x9b59b6,
    scenarios: [
      {
        situation: 'Um site de compras que você usa sofreu vazamento de dados, e você usava uma senha parecida com a do trabalho.',
        choices: ['Trocar imediatamente a senha corporativa também', 'Não fazer nada, são contas diferentes', 'Trocar só a senha do site de compras'],
        correctIndex: 0,
        explanation: ['Senhas reutilizadas ou parecidas tornam um vazamento externo um risco direto pra conta corporativa', 'Ataques de credential stuffing testam exatamente essas combinações vazadas em outros sistemas', 'Trocar só a senha vazada não resolve se a senha corporativa for parecida']
      },
      {
        situation: 'Um colega pede sua senha de acesso a um sistema porque a dele foi bloqueada e ele precisa terminar um relatório urgente.',
        choices: ['Passar a senha, é só dessa vez', 'Passar a senha e trocar depois', 'Negar e orientar o colega a resolver o bloqueio pelo canal oficial de TI'],
        correctIndex: 2,
        explanation: ['Senhas são pessoais e intransferíveis, mesmo entre colegas de confiança', 'Compartilhar quebra a rastreabilidade de quem fez o quê no sistema', 'O canal oficial de TI existe exatamente pra esses casos']
      },
      {
        situation: 'Na hora de trocar a senha, você pensa em só mudar o número do final (ex: de "Empresa2025!" pra "Empresa2026!").',
        choices: ['Fazer isso, é mais fácil de lembrar', 'Criar uma senha ou frase-senha totalmente nova e diferente', 'Trocar só um caractere no meio'],
        correctIndex: 1,
        explanation: ['Padrões previsíveis (trocar só o ano) são facilmente testados por ferramentas de quebra de senha', 'Uma senha "nova" que segue o padrão da anterior não traz segurança real', 'Frases-senha longas e diferentes são mais seguras e ainda assim memorizáveis']
      },
      {
        situation: 'Você vai se ausentar da mesa por só 3 minutos pra pegar água.',
        choices: ['Travar a tela antes de sair, mesmo por pouco tempo', 'Deixar o computador aberto, é rapidinho', 'Só virar a tela pro lado'],
        correctIndex: 0,
        explanation: ['Qualquer tempo é suficiente pra alguém acessar informações numa tela destravada', 'Travar a tela é um hábito, não depende de quanto tempo você vai ficar fora', 'Virar a tela não impede o acesso físico ao computador destravado']
      },
      {
        situation: 'Uma ferramenta corporativa pede que você configure uma senha temporária após a redefinição de acesso.',
        choices: ['Manter a senha temporária mesmo depois do primeiro login', 'Usar a mesma senha temporária em outros sistemas também', 'Trocar por uma senha definitiva forte assim que possível'],
        correctIndex: 2,
        explanation: ['Senhas temporárias costumam ser simples e, às vezes, conhecidas por mais de uma pessoa (quem redefiniu)', 'Trocar rápido por uma senha definitiva forte fecha essa janela de risco', 'Reusar a senha temporária em outros sistemas espalha o mesmo risco']
      }
    ]
  },

  links: {
    name: 'Links Suspeitos',
    icon: '💬',
    color: 0x3498db,
    scenarios: [
      {
        situation: 'Um colega posta num canal geral do Teams um link encurtado dizendo "vejam as fotos da confraternização de ontem".',
        choices: ['Clicar direto, é só um colega compartilhando fotos', 'Encaminhar o link pra outros colegas verem também', 'Checar o destino do link antes de clicar (passar o mouse por cima, ou perguntar ao colega)'],
        correctIndex: 2,
        explanation: ['Links encurtados escondem o destino real — contas comprometidas costumam postar assim', 'Verificar antes de clicar é rápido e evita propagar um ataque', 'Encaminhar sem checar multiplica o alcance de um possível link malicioso']
      },
      {
        situation: 'Num chat privado, um perfil com nome e foto de um diretor pede pra você clicar num link externo pra "assinar um documento urgente" numa plataforma desconhecida.',
        choices: ['Confirmar o pedido com o diretor por outro canal antes de clicar em qualquer link', 'Clicar e assinar rápido, é o diretor pedindo', 'Encaminhar pra outro colega decidir'],
        correctIndex: 0,
        explanation: ['Perfis podem ser falsificados ou contas comprometidas — nome e foto não são prova de identidade', 'Plataformas desconhecidas pra "assinatura urgente" são um padrão comum de golpe', 'Confirmar por outro canal (ramal, mensagem direta já conhecida) desmonta a tentativa rapidamente']
      },
      {
        situation: 'Ao passar o mouse sobre um link num e-mail, sem clicar, o endereço mostrado embaixo é bem diferente do texto visível do link.',
        choices: ['Clicar mesmo assim, o texto parece confiável', 'Não clicar — isso é um forte sinal de link malicioso disfarçado', 'Copiar o link e colar no navegador pra testar'],
        correctIndex: 1,
        explanation: ['Texto visível diferente do destino real é uma das formas mais comuns de disfarçar um link malicioso', 'Copiar e colar ainda leva você ao mesmo destino perigoso', 'O procedimento correto é não interagir e reportar o e-mail']
      },
      {
        situation: 'Um convite de calendário chega de um remetente desconhecido, com um anexo executável no corpo do convite.',
        choices: ['Aceitar o convite e abrir o anexo depois', 'Recusar o convite, mas abrir o anexo antes por curiosidade', 'Não abrir o anexo e reportar o convite como suspeito'],
        correctIndex: 2,
        explanation: ['Arquivos executáveis (.exe) anexados a convites nunca são legítimos em fluxo normal de calendário', 'Remetente desconhecido + executável é uma combinação de alto risco', 'Reportar ajuda a bloquear o remetente pra outros colegas também']
      },
      {
        situation: 'Um link de e-mail leva a uma tela de login idêntica à da Microsoft, mas a barra de endereço mostra um domínio estranho tipo "login.microsoft.security-update.com".',
        choices: ['Não inserir credenciais e reportar — domínio estranho é sinal de página falsa (phishing de credenciais)', 'Fazer login normalmente, a tela parece idêntica à de sempre', 'Fazer login e depois trocar a senha por precaução'],
        correctIndex: 0,
        explanation: ['Visual idêntico não garante autenticidade — páginas de phishing frequentemente clonam telas reais', 'O domínio real da Microsoft nunca inclui esses subdomínios estranhos somados ao nome dela', 'Inserir credenciais, mesmo que troque depois, já expõe a senha ao atacante']
      }
    ]
  }
};

const SCENARIOS_PER_CATEGORY = 3;

function shuffle(array) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// For each category, sample SCENARIOS_PER_CATEGORY scenarios (no repeats
// within the run) in random order. Keyed by categoryId since each category
// belongs to exactly one day.
function buildCategoryBanks() {
  const banks = {};
  Object.keys(SCENARIO_CATEGORIES).forEach(categoryId => {
    banks[categoryId] = shuffle(SCENARIO_CATEGORIES[categoryId].scenarios).slice(0, SCENARIOS_PER_CATEGORY);
  });
  return banks;
}

function buildInitialCategoryStats() {
  const stats = {};
  Object.keys(SCENARIO_CATEGORIES).forEach(categoryId => {
    stats[categoryId] = { correct: 0, attempted: 0 };
  });
  return stats;
}

function buildInitialQueueIndex() {
  const index = {};
  Object.keys(SCENARIO_CATEGORIES).forEach(categoryId => {
    index[categoryId] = 0;
  });
  return index;
}
