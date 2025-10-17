
const { getPlayer, updatePlayer } = require('./playerManager');
const { ENERGY_COSTS } = require('../utils/constants');

const activeArenas = new Map();
const playerTimers = new Map();

const TURN_TIMEOUT = 300000; // 5 minutes
const WARNING_2MIN = 180000; // 3 minutes après le début
const WARNING_30SEC = 270000; // 4min30 après le début

function createArena(player1Phone, player2Phone) {
  const arenaId = `${player1Phone}_vs_${player2Phone}_${Date.now()}`;
  
  activeArenas.set(arenaId, {
    player1: player1Phone,
    player2: player2Phone,
    currentTurn: player1Phone,
    round: 1,
    player1Stats: {
      hp: 100,
      energy: 100,
      injuries: []
    },
    player2Stats: {
      hp: 100,
      energy: 100,
      injuries: []
    },
    logs: [],
    status: 'active'
  });
  
  return arenaId;
}

function getArena(arenaId) {
  return activeArenas.get(arenaId);
}

function getPlayerArena(phoneNumber) {
  for (const [arenaId, arena] of activeArenas) {
    if (arena.player1 === phoneNumber || arena.player2 === phoneNumber) {
      return { arenaId, arena };
    }
  }
  return null;
}

function analyzeAction(actionText) {
  const analysis = {
    member: null,
    side: null,
    distance: null,
    direction: null,
    target: null,
    technique: null,
    type: 'attack',
    precision: 0,
    valid: false
  };

  const lowerText = actionText.toLowerCase();

  // Détection du type d'action
  if (lowerText.includes('esquive') || lowerText.includes('évite') || lowerText.includes('dodge')) {
    analysis.type = 'dodge';
  } else if (lowerText.includes('bloque') || lowerText.includes('pare') || lowerText.includes('défend')) {
    analysis.type = 'block';
  }

  // Détection du membre
  const members = [
    { keywords: ['bras droit', 'poing droit', 'main droite'], value: 'bras droit' },
    { keywords: ['bras gauche', 'poing gauche', 'main gauche'], value: 'bras gauche' },
    { keywords: ['jambe droite', 'pied droit'], value: 'jambe droite' },
    { keywords: ['jambe gauche', 'pied gauche'], value: 'jambe gauche' },
    { keywords: ['sabre', 'épée', 'lame'], value: 'sabre' },
    { keywords: ['tête', 'front'], value: 'tête' }
  ];

  for (const member of members) {
    for (const keyword of member.keywords) {
      if (lowerText.includes(keyword)) {
        analysis.member = member.value;
        analysis.precision += 20;
        break;
      }
    }
    if (analysis.member) break;
  }

  // Détection de la distance
  const distanceMatch = lowerText.match(/(\d+)\s*(m|mètre|metre)/);
  if (distanceMatch) {
    analysis.distance = parseInt(distanceMatch[1]);
    analysis.precision += 20;
  }

  // Détection de la direction
  const directions = ['avant', 'arrière', 'gauche', 'droite', 'haut', 'bas', 'diagonal'];
  for (const dir of directions) {
    if (lowerText.includes(dir)) {
      analysis.direction = dir;
      analysis.precision += 15;
      break;
    }
  }

  // Détection de la cible
  const targets = [
    { keywords: ['tête', 'visage', 'crâne'], value: 'tête' },
    { keywords: ['torse', 'poitrine', 'ventre', 'abdomen'], value: 'torse' },
    { keywords: ['jambe', 'cuisse', 'genou'], value: 'jambe' },
    { keywords: ['bras', 'épaule', 'coude'], value: 'bras' }
  ];

  for (const target of targets) {
    for (const keyword of target.keywords) {
      if (lowerText.includes(keyword)) {
        analysis.target = target.value;
        analysis.precision += 25;
        break;
      }
    }
    if (analysis.target) break;
  }

  // Détection de technique nommée
  if (lowerText.includes('gomu gomu') || lowerText.includes('santoryu') || 
      lowerText.includes('diable jambe') || lowerText.match(/[A-Z][a-z]+ [A-Z][a-z]+/)) {
    analysis.technique = 'special';
    analysis.precision += 20;
  }

  // Validation
  analysis.valid = analysis.member !== null;

  return analysis;
}

function calculateDamage(analysis) {
  let damage = 0;
  let energyCost = 5;

  if (!analysis.valid) {
    return { damage: 0, energyCost: 5, message: '⚠️ Action refusée : membre non précisé !' };
  }

  // Calcul selon précision
  if (analysis.precision < 35) {
    damage = 0;
    energyCost = 5;
  } else if (analysis.precision < 55) {
    damage = 15;
    energyCost = 10;
  } else if (analysis.precision < 75) {
    damage = 25;
    energyCost = 15;
  } else {
    damage = 50;
    energyCost = 25;
  }

  // Bonus pour technique spéciale
  if (analysis.technique === 'special') {
    damage = Math.min(damage + 15, 60);
  }

  // Esquive ou blocage
  if (analysis.type === 'dodge') {
    damage = 0;
    energyCost = 15;
  } else if (analysis.type === 'block') {
    damage = Math.floor(damage * 0.4); // réduit à 40%
    energyCost = 10;
  }

  return { damage, energyCost };
}

function generateHPBar(hp) {
  const filled = Math.floor(hp / 10);
  const empty = 10 - filled;
  return '▰'.repeat(filled) + '▱'.repeat(empty);
}

async function startTurn(arenaId, sock) {
  const arena = getArena(arenaId);
  if (!arena) return;

  const currentPlayerPhone = arena.currentTurn;
  const player = await getPlayer(currentPlayerPhone);
  
  clearTimeout(playerTimers.get(currentPlayerPhone));

  // Message de début de tour
  const isPlayer1 = currentPlayerPhone === arena.player1;
  const playerStats = isPlayer1 ? arena.player1Stats : arena.player2Stats;
  
  await sock.sendMessage(arena.player1 === currentPlayerPhone ? arena.player1 : arena.player2, {
    text: `🕐 **TON TOUR COMMENCE !**\n\n⏱️ Tu as 5 minutes pour écrire ton action.\n\n📝 Format : M: [description précise]\n\n❤️ Vie: ${generateHPBar(playerStats.hp)} ${playerStats.hp}%\n⚡ Énergie: ${generateHPBar(playerStats.energy)} ${playerStats.energy}%`
  });

  // Warning à 2 minutes
  const warning2min = setTimeout(async () => {
    await sock.sendMessage(currentPlayerPhone, {
      text: '⏰ **2 MINUTES RESTANTES** pour jouer ton action !'
    });
  }, WARNING_2MIN);

  // Warning à 30 secondes
  const warning30sec = setTimeout(async () => {
    await sock.sendMessage(currentPlayerPhone, {
      text: '⚠️ **30 SECONDES** ! Écris ton action maintenant !'
    });
  }, WARNING_30SEC);

  // Timer principal
  const mainTimer = setTimeout(async () => {
    clearTimeout(warning2min);
    clearTimeout(warning30sec);
    
    await handleTimeout(arenaId, currentPlayerPhone, sock);
  }, TURN_TIMEOUT);

  playerTimers.set(currentPlayerPhone, mainTimer);
}

async function handleTimeout(arenaId, phoneNumber, sock) {
  const arena = getArena(arenaId);
  if (!arena || arena.status !== 'active') return;

  const isPlayer1 = phoneNumber === arena.player1;
  const playerStats = isPlayer1 ? arena.player1Stats : arena.player2Stats;
  
  // Pénalité
  playerStats.energy = Math.max(0, playerStats.energy - 10);
  
  const player = await getPlayer(phoneNumber);
  const log = `⏳ ${player.name} n'a pas répondu à temps ! (-10% énergie)`;
  arena.logs.push(log);

  // Broadcast aux deux joueurs
  const statusMsg = formatArenaStatus(arena, await getPlayer(arena.player1), await getPlayer(arena.player2));
  
  await sock.sendMessage(arena.player1, { text: log + '\n\n' + statusMsg });
  await sock.sendMessage(arena.player2, { text: log + '\n\n' + statusMsg });

  // Changer de tour
  arena.currentTurn = isPlayer1 ? arena.player2 : arena.player1;
  arena.round++;
  
  await startTurn(arenaId, sock);
}

async function executeAction(arenaId, phoneNumber, actionText, sock) {
  const arena = getArena(arenaId);
  if (!arena) return { success: false, message: 'Arène introuvable !' };

  if (arena.currentTurn !== phoneNumber) {
    return { success: false, message: '⚠️ Ce n\'est pas ton tour !' };
  }

  if (arena.status !== 'active') {
    return { success: false, message: '⚠️ Ce combat est terminé !' };
  }

  // Annuler le timer
  clearTimeout(playerTimers.get(phoneNumber));

  const attacker = await getPlayer(phoneNumber);
  const defenderPhone = arena.player1 === phoneNumber ? arena.player2 : arena.player1;
  const defender = await getPlayer(defenderPhone);

  const isPlayer1Attacker = phoneNumber === arena.player1;
  const attackerStats = isPlayer1Attacker ? arena.player1Stats : arena.player2Stats;
  const defenderStats = isPlayer1Attacker ? arena.player2Stats : arena.player1Stats;

  // Analyser l'action
  const analysis = analyzeAction(actionText);
  
  if (!analysis.valid) {
    await sock.sendMessage(phoneNumber, {
      text: '⚠️ **ACTION REFUSÉE**\n\nPrécision insuffisante !\nTu dois préciser :\n- Le membre utilisé\n- La distance (si attaque)\n- La direction\n- La cible'
    });
    return { success: false };
  }

  const { damage, energyCost } = calculateDamage(analysis);

  // Vérifier l'énergie
  if (attackerStats.energy < energyCost) {
    await sock.sendMessage(phoneNumber, {
      text: '⚠️ **ÉNERGIE INSUFFISANTE** !\n\nTu n\'as pas assez d\'énergie pour cette action.'
    });
    return { success: false };
  }

  // Appliquer les changements
  attackerStats.energy -= energyCost;
  defenderStats.hp = Math.max(0, defenderStats.hp - damage);

  // Log de l'action
  let actionLog = '';
  if (analysis.type === 'dodge') {
    actionLog = `💨 ${attacker.name} esquive avec agilité ! (-${energyCost}% énergie)`;
  } else if (analysis.type === 'block') {
    actionLog = `🛡️ ${attacker.name} bloque ! ${defender.name} subit ${damage}% de dégâts réduits.`;
  } else if (damage === 0) {
    actionLog = `❌ ${attacker.name} attaque vaguement. Aucun dégât ! (-${energyCost}% énergie)`;
  } else if (analysis.precision >= 75) {
    actionLog = `💥 **TECHNIQUE DÉVASTATRICE !** ${attacker.name} inflige ${damage}% de dégâts à ${defender.name} ! (-${energyCost}% énergie)`;
  } else {
    actionLog = `⚔️ ${attacker.name} frappe ${defender.name} pour ${damage}% de dégâts ! (-${energyCost}% énergie)`;
  }

  arena.logs.push(actionLog);

  // Vérifier la fin du combat
  if (defenderStats.hp <= 0) {
    arena.status = 'finished';
    arena.winner = phoneNumber;
    
    const victoryMsg = `
🏆 **VICTOIRE DE ${attacker.name.toUpperCase()} !**

${actionLog}

${defender.name} est K.O. !

${formatArenaStatus(arena, await getPlayer(arena.player1), await getPlayer(arena.player2))}
`.trim();

    await sock.sendMessage(arena.player1, { text: victoryMsg });
    await sock.sendMessage(arena.player2, { text: victoryMsg });
    
    activeArenas.delete(arenaId);
    return { success: true, finished: true };
  }

  // Broadcast aux deux joueurs
  const statusMsg = formatArenaStatus(arena, await getPlayer(arena.player1), await getPlayer(arena.player2));
  
  await sock.sendMessage(arena.player1, { text: actionLog + '\n\n' + statusMsg });
  await sock.sendMessage(arena.player2, { text: actionLog + '\n\n' + statusMsg });

  // Changer de tour
  arena.currentTurn = defenderPhone;
  arena.round++;
  
  await startTurn(arenaId, sock);

  return { success: true };
}

function formatArenaStatus(arena, player1, player2) {
  const p1Stats = arena.player1Stats;
  const p2Stats = arena.player2Stats;
  
  return `
⚔️ **ARÈNE - Round ${arena.round}**

${player1.name}:
❤️ ${generateHPBar(p1Stats.hp)} ${p1Stats.hp}%
⚡ ${generateHPBar(p1Stats.energy)} ${p1Stats.energy}%

${player2.name}:
❤️ ${generateHPBar(p2Stats.hp)} ${p2Stats.hp}%
⚡ ${generateHPBar(p2Stats.energy)} ${p2Stats.energy}%

🎯 **Tour de:** ${arena.currentTurn === player1.phoneNumber ? player1.name : player2.name}

📜 **Dernières actions:**
${arena.logs.slice(-3).join('\n')}
`.trim();
}

module.exports = {
  createArena,
  getArena,
  getPlayerArena,
  startTurn,
  executeAction,
  formatArenaStatus
};
