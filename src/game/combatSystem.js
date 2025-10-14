const { getPlayer, updatePlayer, consumeEnergy, addXP } = require('./playerManager');
const { ENERGY_COSTS, XP_GAINS } = require('../utils/constants');
const { calculateAttributeBonus, generateCombatLog } = require('../utils/helpers');

const activeCombats = new Map();

function initCombat(player1Phone, player2Phone) {
  const combatId = `${player1Phone}_vs_${player2Phone}_${Date.now()}`;
  activeCombats.set(combatId, {
    player1: player1Phone,
    player2: player2Phone,
    turn: player1Phone,
    round: 1,
    player1HP: 100,
    player2HP: 100,
    logs: [],
    status: 'active'
  });
  return combatId;
}

function getCombat(combatId) {
  return activeCombats.get(combatId);
}

function calculateDamage(attacker, defender) {
  const attackerForce = attacker.attributes.force;
  const attackerPrecision = attacker.attributes.precision;
  const defenderEndurance = defender.attributes.endurance;

  const forceBonus = calculateAttributeBonus(attackerForce, 'force').damageBonus || 0;
  const precisionBonus = calculateAttributeBonus(attackerPrecision, 'precision').critChance || 0;
  const enduranceReduction = calculateAttributeBonus(defenderEndurance, 'endurance').damageReduction || 0;

  const baseDamage = 10 + (forceBonus / 10);
  
  const isCritical = Math.random() * 100 < precisionBonus;
  let damage = isCritical ? baseDamage * 1.5 : baseDamage;

  damage = damage * (1 - enduranceReduction / 100);

  return {
    damage: Math.round(damage),
    isCritical
  };
}

function canDodge(attacker, defender) {
  const attackerSpeed = attacker.attributes.vitesse;
  const defenderSpeed = defender.attributes.vitesse;
  const defenderReflex = defender.attributes.reflexe;

  const dodgeChance = Math.min(30, (defenderSpeed - attackerSpeed) * 2 + defenderReflex);
  return Math.random() * 100 < Math.max(5, dodgeChance);
}

async function executeAttack(combatId, attackerPhone, action = 'basic_attack') {
  const combat = getCombat(combatId);
  if (!combat) return { success: false, message: 'Combat introuvable !' };

  if (combat.turn !== attackerPhone) {
    return { success: false, message: 'Ce n\'est pas votre tour !' };
  }

  if (combat.status !== 'active') {
    return { success: false, message: 'Ce combat est terminé !' };
  }

  const attacker = await getPlayer(attackerPhone);
  const defenderPhone = combat.player1 === attackerPhone ? combat.player2 : combat.player1;
  const defender = await getPlayer(defenderPhone);

  if (!attacker || !defender) {
    return { success: false, message: 'Joueur introuvable !' };
  }

  const energyCost = ENERGY_COSTS[action] || ENERGY_COSTS.basic_attack;
  const energyCheck = await consumeEnergy(attackerPhone, energyCost);
  
  if (!energyCheck.success) {
    return { success: false, message: 'Énergie insuffisante ! Défendez-vous ou passez votre tour.' };
  }

  const dodged = canDodge(attacker, defender);
  
  if (dodged) {
    const dodgeLog = generateCombatLog(attacker, defender, 0, 'dodge');
    combat.logs.push(dodgeLog);
    
    combat.turn = defenderPhone;
    combat.round++;
    
    return {
      success: true,
      combat,
      action: 'dodge',
      log: dodgeLog,
      attacker: attacker.name,
      defender: defender.name
    };
  }

  const { damage, isCritical } = calculateDamage(attacker, defender);
  
  const isPlayer1Attacker = combat.player1 === attackerPhone;
  if (isPlayer1Attacker) {
    combat.player2HP = Math.max(0, combat.player2HP - damage);
  } else {
    combat.player1HP = Math.max(0, combat.player1HP - damage);
  }

  const attackLog = generateCombatLog(
    attacker, 
    defender, 
    damage, 
    isCritical ? 'critical' : 'attack'
  );
  combat.logs.push(attackLog);

  const defenderHP = isPlayer1Attacker ? combat.player2HP : combat.player1HP;
  
  if (defenderHP <= 0) {
    combat.status = 'finished';
    combat.winner = attackerPhone;
    combat.loser = defenderPhone;

    await addXP(attackerPhone, XP_GAINS.combat_win);
    await addXP(defenderPhone, XP_GAINS.combat_loss);

    const winnerUpdate = await getPlayer(attackerPhone);
    winnerUpdate.combatStats.wins++;
    winnerUpdate.berrys += 500;
    await updatePlayer(attackerPhone, winnerUpdate);

    const loserUpdate = await getPlayer(defenderPhone);
    loserUpdate.combatStats.losses++;
    await updatePlayer(defenderPhone, loserUpdate);

    return {
      success: true,
      combat,
      finished: true,
      winner: attacker.name,
      loser: defender.name,
      log: attackLog,
      xpGained: XP_GAINS.combat_win
    };
  }

  combat.turn = defenderPhone;
  combat.round++;

  return {
    success: true,
    combat,
    action: isCritical ? 'critical' : 'attack',
    damage,
    log: attackLog,
    attacker: attacker.name,
    defender: defender.name,
    attackerHP: isPlayer1Attacker ? combat.player1HP : combat.player2HP,
    defenderHP: isPlayer1Attacker ? combat.player2HP : combat.player1HP
  };
}

function formatCombatStatus(combat, player1, player2) {
  const hpBar1 = generateHPBar(combat.player1HP);
  const hpBar2 = generateHPBar(combat.player2HP);
  
  return `
⚔️ *COMBAT - Round ${combat.round}*

${player1.name}: ${hpBar1} (${combat.player1HP}/100 HP)
${player2.name}: ${hpBar2} (${combat.player2HP}/100 HP)

🎯 Tour de: ${combat.turn === player1.phoneNumber ? player1.name : player2.name}

📜 *Dernières actions:*
${combat.logs.slice(-3).join('\n')}
`.trim();
}

function generateHPBar(hp) {
  const filled = Math.floor(hp / 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function endCombat(combatId) {
  activeCombats.delete(combatId);
}

function getPlayerActiveCombat(phoneNumber) {
  for (const [combatId, combat] of activeCombats) {
    if (combat.player1 === phoneNumber || combat.player2 === phoneNumber) {
      return { combatId, combat };
    }
  }
  return null;
}

module.exports = {
  initCombat,
  getCombat,
  executeAttack,
  formatCombatStatus,
  endCombat,
  getPlayerActiveCombat
};
