function normalizePhoneNumber(sender) {
  // Extraire uniquement le numéro de téléphone
  // Formats possibles: 
  // - 33612345678@s.whatsapp.net
  // - 33612345678@g.us (groupes)
  // - 33612345678

  if (!sender) return null;

  // Enlever @s.whatsapp.net ou @c.us si présent
  let normalized = sender.replace(/@s\.whatsapp\.net|@c\.us/g, '');

  // Garder seulement les chiffres
  normalized = normalized.replace(/\D/g, '');

  // Ajouter @s.whatsapp.net à la fin
  return normalized + '@s.whatsapp.net';
}


function calculateAttributeBonus(attribute, type) {
  switch (type) {
    case 'force':
      return {
        damageBonus: attribute * 2,
        liftCapacity: attribute * 20
      };
    case 'vitesse':
      const speedLimits = [
        { level: 1, maxSpeed: 5 },
        { level: 5, maxSpeed: 8 },
        { level: 10, maxSpeed: 12 },
        { level: 15, maxSpeed: 18 },
        { level: 20, maxSpeed: 25 },
        { level: 30, maxSpeed: 30 }
      ];
      const speedData = speedLimits.find(s => attribute <= s.level * 5) || speedLimits[speedLimits.length - 1];
      return { maxSpeed: speedData.maxSpeed };
    case 'endurance':
      return {
        energyBonus: attribute * 5,
        damageReduction: Math.min(attribute, 50) * 0.1
      };
    case 'reflexe':
      const reflexTimes = [
        { points: 5, time: 3 },
        { points: 10, time: 2 },
        { points: 15, time: 1.5 },
        { points: 20, time: 1 },
        { points: 25, time: 0.7 },
        { points: 30, time: 0.5 }
      ];
      const reflexData = reflexTimes.find(r => attribute <= r.points) || reflexTimes[reflexTimes.length - 1];
      return { reactionTime: reflexData.time };
    case 'intelligence':
      return {
        masteryBonus: attribute,
        canCreateTechniques: attribute >= 15,
        fullControl: attribute >= 30
      };
    case 'precision':
      return {
        critChance: Math.min(attribute, 30) * 0.5,
        canTargetWeakPoints: attribute >= 20,
        perfectAim: attribute >= 30
      };
    default:
      return {};
  }
}

function getMaxEnergyFromEndurance(endurance) {
  return endurance * 10;
}

function formatPlayerStats(player) {
  const { attributes } = player;
  return `
⚓ *${player.name}* - Niveau ${player.level}
🏴‍☠️ Race: ${player.race} | Alignement: ${player.alignment}
${player.style ? `⚔️ Style: ${player.style}` : ''}

📊 *ATTRIBUTS:*
⚡ Force: ${attributes.force}
💨 Vitesse: ${attributes.vitesse}
🛡️ Endurance: ${attributes.endurance}
👁️ Réflexe: ${attributes.reflexe}
🧠 Intelligence: ${attributes.intelligence}
🎯 Précision: ${attributes.precision}

⚡ Énergie: ${player.energy}/${player.maxEnergy}
✨ XP: ${player.xp}/${getXPForNextLevel(player.level)}
💰 Berrys: ${player.berrys}
${player.job ? `💼 Métier: ${player.job}` : ''}
`.trim();
}

function getXPForNextLevel(currentLevel) {
  const { XP_LEVELS } = require('./constants');
  const nextLevel = XP_LEVELS.find(l => l.level === currentLevel + 1);
  return nextLevel ? nextLevel.xpRequired : 999999;
}

function getLevelFromXP(xp) {
  const { XP_LEVELS } = require('./constants');
  let level = 1;
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].xpRequired) {
      level = XP_LEVELS[i].level;
      break;
    }
  }
  return level;
}

function canAfford(player, cost) {
  return player.berrys >= cost;
}

function deductBerrys(player, amount) {
  player.berrys = Math.max(0, player.berrys - amount);
  return player;
}

function addBerrys(player, amount) {
  player.berrys += amount;
  return player;
}

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function generateCombatLog(attacker, defender, damage, action) {
  const logs = {
    attack: [
      `${attacker.name} lance une attaque puissante sur ${defender.name} ! 💥 (-${damage} PV)`,
      `${attacker.name} frappe ${defender.name} avec force ! ⚔️ (-${damage} PV)`,
      `${attacker.name} porte un coup dévastateur à ${defender.name} ! 🔥 (-${damage} PV)`
    ],
    dodge: [
      `${defender.name} esquive l'attaque de ${attacker.name} avec agilité ! 💨`,
      `${defender.name} évite le coup au dernier moment ! ⚡`,
      `${attacker.name} rate sa cible, ${defender.name} est trop rapide ! 🌪️`
    ],
    critical: [
      `💀 COUP CRITIQUE ! ${attacker.name} touche un point vital de ${defender.name} ! (-${damage} PV)`,
      `⚡ FRAPPE MORTELLE ! ${attacker.name} inflige des dégâts massifs ! (-${damage} PV)`
    ]
  };

  const actionLogs = logs[action] || logs.attack;
  return actionLogs[Math.floor(Math.random() * actionLogs.length)];
}

module.exports = {
  normalizePhoneNumber,
  calculateAttributeBonus,
  getMaxEnergyFromEndurance,
  formatPlayerStats,
  getXPForNextLevel,
  getLevelFromXP,
  canAfford,
  deductBerrys,
  addBerrys,
  formatNumber,
  generateCombatLog
};