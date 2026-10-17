// Encounter content per language. Same fake domain/typo across languages on
// purpose — the visual red flag (sinch-suport.net, missing a letter) has to
// stay spottable regardless of which language the player picked.
const ENCOUNTERS = {
  pt: {
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
  },
  en: {
    'phishing-email-1': {
      from: 'IT-Support@sinch-suport.net',
      subject: 'Your password expires today! Action required',
      body:
        'Dear employee,\n\n' +
        'We detected that your corporate password expires in a few hours.\n' +
        'Click the link below to renew it immediately and avoid your\n' +
        'account being locked:\n\n' +
        'http://sinch-login-verify.com/renew-password\n\n' +
        'IT Team',
      correctChoice: 'report',
      redFlags: [
        'Sender domain is "sinch-suport.net" (missing a letter, wrong domain) — not sinch.com',
        'The link points to a different domain ("sinch-login-verify.com"), not a real internal system',
        'Artificial urgency ("expires today", "account locked") is a classic phishing tactic',
        'IT never asks you to renew your password through an email link'
      ]
    }
  },
  sv: {
    'phishing-email-1': {
      from: 'IT-Support@sinch-suport.net',
      subject: 'Ditt lösenord går ut idag! Åtgärd krävs',
      body:
        'Hej,\n\n' +
        'Vi har upptäckt att ditt företagslösenord går ut om några timmar.\n' +
        'Klicka på länken nedan för att förnya det omedelbart och undvika\n' +
        'att kontot låses:\n\n' +
        'http://sinch-login-verify.com/fornya-losenord\n\n' +
        'IT-avdelningen',
      correctChoice: 'report',
      redFlags: [
        'Avsändarens domän är "sinch-suport.net" (en bokstav fattas, fel domän) — inte sinch.com',
        'Länken pekar på en annan domän ("sinch-login-verify.com"), inte ett riktigt internt system',
        'Konstgjord brådska ("går ut idag", "kontot låses") är en klassisk nätfisketaktik',
        'IT ber aldrig om lösenordsförnyelse via en länk i ett e-postmeddelande'
      ]
    }
  }
};

function getEncounter(scene, npcId) {
  const lang = scene.registry.get('language') || 'pt';
  return (ENCOUNTERS[lang] && ENCOUNTERS[lang][npcId]) || ENCOUNTERS.pt[npcId];
}

// Encounter ids are the same across languages — pt is just the canonical list.
function getEncounterIds() {
  return Object.keys(ENCOUNTERS.pt);
}
