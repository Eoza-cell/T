const { getPlayer, updatePlayer, addXP } = require('./playerManager');
const { XP_GAINS } = require('../utils/constants');

const activeArenas = new Map();
const playerTimers = new Map();

function analyzeAction(actionText) {
  const text = actionText.toLowerCase();

  // Détection des membres
  const members = ['bras', 'jambe', 'pied', 'poing', 'tête', 'coude', 'genou', 'sabre', 'épée', 'pistolet'];
  const hasMember = members.some(m => text.includes(m));

  // Détection de la distance
  const distanceMatch = text.match(/(\d+)\s*(m|mètre|metre)/i);
  const hasDistance = distanceMatch !== null;

  // Détection de la direction
  const directions = ['gauche', 'droit', 'avant', 'arrière', 'haut', 'bas', 'côté'];
  const hasDirection = directions.some(d => text.includes(d));

  // Détection de la cible
  const targets = ['tête', 'torse', 'jambe', 'bras', 'ventre', 'visage'];
  const hasTarget = targets.some(t => text.includes(t));

  // Détection du type d'action
  const isAttack = text.includes('attaque') || text.includes('frappe') || text.includes('lance') || text.includes('punch');
  const isDodge = text.includes('esquive') || text.includes('évite');
  const isBlock = text.includes('bloque') || text.includes('pare');

  // Calculer le score de précision
  let precision = 0;
  if (hasMember) precision += 25;
  if (hasDistance) precision += 25;
  if (hasDirection) precision += 25;
  if (hasTarget) precision += 25;

  // Déterminer le type
  let type = 'attack';
  if (isDodge) type = 'dodge';
  else if (isBlock) type = 'block';

  return {
    valid: hasMember && (type !== 'attack' || hasDistance),
    precision,
    type,
    hasMember,
    hasDistance,
    hasDirection,
    hasTarget
  };
}

function calculateDamage(analysis) {
  let damage = 0;
  let energyCost = 2;

  if (analysis.type === 'dodge') {
    energyCost = 4;
    damage = 0;
  } else if (analysis.type === 'block') {
    energyCost = 5;
    damage = 0;
  } else {
    if (analysis.precision >= 75) {
      damage = 50;
      energyCost = 25;
    } else if (analysis.precision >= 50) {
      damage = 25;
      energyCost = 15;
    } else if (analysis.precision >= 25) {
      damage = 15;
      energyCost = 10;
    } else {
      damage = 0;
      energyCost = 5;
    }
  }

  return { damage, energyCost };
}

async function startArenaCombat(player1, player2) {
  const arenaId = `${player1.phoneNumber}_vs_${player2.phoneNumber}_${Date.now()}`;

  const arena = {
    id: arenaId,
    player1: player1.phoneNumber,
    player2: player2.phoneNumber,
    turn: player1.phoneNumber,
    round: 1,
    player1Stats: { hp: 100, energy: 100 },
    player2Stats: { hp: 100, energy: 100 },
    logs: [],
    status: 'active',
    finished: false
  };

  activeArenas.set(arenaId, arena);

  return {
    success: true,
    arena,
    arenaId
  };
}

function getPlayerArena(phoneNumber) {
  for (const [arenaId, arena] of activeArenas) {
    if (arena.player1 === phoneNumber || arena.player2 === phoneNumber) {
      return { arenaId, arena };
    }
  }
  return null;
}

async function executeAction(arenaId, phoneNumber, actionText, sock) {
  const arena = activeArenas.get(arenaId);

  if (!arena) {
    return { success: false, message: 'Arène introuvable !' };
  }

  if (arena.turn !== phoneNumber) {
    return { success: false, message: 'Ce n\'est pas ton tour !' };
  }

  if (arena.status !== 'active') {
    return { success: false, message: 'Ce combat est terminé !' };
  }

  clearTimeout(playerTimers.get(phoneNumber));

  const attacker = await getPlayer(phoneNumber);
  const defenderPhone = arena.player1 === phoneNumber ? arena.player2 : arena.player1;
  const defender = await getPlayer(defenderPhone);

  const isPlayer1Attacker = phoneNumber === arena.player1;
  const attackerStats = isPlayer1Attacker ? arena.player1Stats : arena.player2Stats;
  const defenderStats = isPlayer1Attacker ? arena.player2Stats : arena.player1Stats;

  const analysis = analyzeAction(actionText);

  if (!analysis.valid) {
    await sock.sendMessage(phoneNumber, {
      text: '⚠️ **ACTION REFUSÉE**\n\nPrécision insuffisante !\nTu dois préciser :\n- Le membre utilisé\n- La distance (si attaque)\n- La direction\n- La cible'
    });
    return { success: false };
  }

  const { damage, energyCost } = calculateDamage(analysis);

  if (attackerStats.energy < energyCost) {
    await sock.sendMessage(phoneNumber, {
      text: '⚠️ **ÉNERGIE INSUFFISANTE** !\n\nTu n\'as pas assez d\'énergie pour cette action.'
    });
    return { success: false };
  }

  attackerStats.energy -= energyCost;
  defenderStats.hp = Math.max(0, defenderStats.hp - damage);

  let actionLog = '';
  if (analysis.type === 'dodge') {
    actionLog = `💨 ${attacker.name} esquive avec agilité ! (-${energyCost}% énergie)`;
  } else if (analysis.type === 'block') {
    actionLog = `🛡️ ${attacker.name} bloque ! (-${energyCost}% énergie)`;
  } else if (damage === 0) {
    actionLog = `❌ ${attacker.name} attaque vaguement. Aucun dégât ! (-${energyCost}% énergie)`;
  } else if (analysis.precision >= 75) {
    actionLog = `💥 **TECHNIQUE DÉVASTATRICE !** ${attacker.name} inflige ${damage}% de dégâts à ${defender.name} ! (-${energyCost}% énergie)`;
  } else {
    actionLog = `⚔️ ${attacker.name} frappe ${defender.name} pour ${damage}% de dégâts ! (-${energyCost}% énergie)`;
  }

  arena.logs.push(actionLog);

  if (defenderStats.hp <= 0) {
    arena.status = 'finished';
    arena.winner = phoneNumber;

    await addXP(phoneNumber, XP_GAINS.combat_win);
    await addXP(defenderPhone, XP_GAINS.combat_loss);

    const winnerUpdate = await getPlayer(phoneNumber);
    winnerUpdate.combatStats.wins++;
    winnerUpdate.berrys += 500;
    await updatePlayer(phoneNumber, winnerUpdate);

    const loserUpdate = await getPlayer(defenderPhone);
    loserUpdate.combatStats.losses++;
    await updatePlayer(defenderPhone, loserUpdate);

    const victoryMsg = `
🏆 **VICTOIRE DE ${attacker.name.toUpperCase()} !**

${actionLog}

${defender.name} est K.O. !

+${XP_GAINS.combat_win} XP
+500 Berrys
`.trim();

    await sock.sendMessage(arena.player1, { text: victoryMsg });
    await sock.sendMessage(arena.player2, { text: victoryMsg });

    activeArenas.delete(arenaId);
    clearTimeout(playerTimers.get(phoneNumber));
    clearTimeout(playerTimers.get(defenderPhone));

    return { success: true, finished: true, log: actionLog };
  }

  arena.turn = defenderPhone;
  arena.round++;

  const player1 = await getPlayer(arena.player1);
  const player2 = await getPlayer(arena.player2);
  const combatStatus = formatArenaStatus(arena, player1, player2);

  await sock.sendMessage(arena.player1, { text: `\n${actionLog}\n\n${combatStatus}` });
  await sock.sendMessage(arena.player2, { text: `\n${actionLog}\n\n${combatStatus}` });

  await sock.sendMessage(defenderPhone, { text: "🕐 5 minutes pour répondre. Ton tour commence !" });

  const timer = setTimeout(async () => {
    if (arena && !arena.finished) {
      const inactivePlayer = await getPlayer(defenderPhone);
      attackerStats.energy = Math.max(0, attackerStats.energy - 10);

      await sock.sendMessage(defenderPhone, { text: `⏳ Temps écoulé pour ${inactivePlayer.name} ! Tu perds ton tour et 10% d'énergie.` });
      await sock.sendMessage(phoneNumber, { text: `L'adversaire ${inactivePlayer.name} a perdu son tour.` });

      arena.turn = phoneNumber;
      arena.round++;

      await sock.sendMessage(phoneNumber, { text: "🕐 C'est à nouveau ton tour !" });
    }
  }, 300000);

  playerTimers.set(defenderPhone, timer);

  return { success: true, finished: false, log: actionLog };
}

function formatArenaStatus(arena, player1, player2) {
  const hp1Bar = generateHPBar(arena.player1Stats.hp);
  const hp2Bar = generateHPBar(arena.player2Stats.hp);
  const energy1Bar = generateHPBar(arena.player1Stats.energy);
  const energy2Bar = generateHPBar(arena.player2Stats.energy);

  return `
⚔️ **ARÈNE - Round ${arena.round}**

${player1.name}:
❤️ ${hp1Bar} (${arena.player1Stats.hp}/100 HP)
⚡ ${energy1Bar} (${arena.player1Stats.energy}/100 Énergie)

${player2.name}:
❤️ ${hp2Bar} (${arena.player2Stats.hp}/100 HP)
⚡ ${energy2Bar} (${arena.player2Stats.energy}/100 Énergie)

🎯 Tour de: ${arena.turn === player1.phoneNumber ? player1.name : player2.name}
`.trim();
}

function generateHPBar(value) {
  const filled = Math.floor(value / 10);
  const empty = 10 - filled;
  return '▰'.repeat(filled) + '▱'.repeat(empty);
}

module.exports = {
  startArenaCombat,
  getPlayerArena,
  executeAction,
  formatArenaStatus
};