const { getPlayer, updatePlayer, addXP } = require('./playerManager');
const { XP_GAINS, XP_LEVELS } = require('../utils/constants');

async function giveTrainingXP(phoneNumber, trainingType) {
  const player = await getPlayer(phoneNumber);
  if (!player) return { success: false, message: 'Joueur introuvable !' };

  // Vérifier le cooldown d'entraînement (1 heure)
  const now = Date.now();
  const lastTraining = player.lastTraining || 0;
  const cooldownTime = 60 * 60 * 1000; // 1 heure en millisecondes
  
  if (now - lastTraining < cooldownTime) {
    const timeLeft = Math.ceil((cooldownTime - (now - lastTraining)) / 60000);
    return { 
      success: false, 
      message: `⏳ Tu dois attendre ${timeLeft} minutes avant de t'entraîner à nouveau !` 
    };
  }

  // Coût de l'entraînement
  const trainingCost = 50; // 50 Berrys
  const energyCost = 20; // 20 énergie
  
  if (player.berrys < trainingCost) {
    return { 
      success: false, 
      message: `❌ Entraînement coûte ${trainingCost} Berrys ! (Tu as: ${player.berrys})` 
    };
  }
  
  if (player.energy < energyCost) {
    return { 
      success: false, 
      message: `❌ Entraînement nécessite ${energyCost} énergie ! (Tu as: ${player.energy})` 
    };
  }

  // Déduire les coûts
  player.berrys -= trainingCost;
  player.energy -= energyCost;
  player.lastTraining = now;

  // XP réduit et plus variable
  const xpAmount = Math.floor(Math.random() * 30) + 20; // 20-50 XP au lieu de 50-150

  const result = await addXP(phoneNumber, xpAmount);

  let attributeGain = null;
  
  // Probabilités réduites pour les gains d'attributs
  switch (trainingType) {
    case 'force':
      if (Math.random() < 0.15) { // 15% au lieu de 30%
        player.attributes.force += 1;
        attributeGain = 'Force +1';
      }
      break;
    case 'vitesse':
      if (Math.random() < 0.12) { // 12% au lieu de 25%
        player.attributes.vitesse += 1;
        attributeGain = 'Vitesse +1';
      }
      break;
    case 'endurance':
      if (Math.random() < 0.15) {
        player.attributes.endurance += 1;
        attributeGain = 'Endurance +1';
      }
      break;
    case 'reflexe':
      if (Math.random() < 0.18) { // 18% au lieu de 35%
        player.attributes.reflexe += 1;
        attributeGain = 'Réflexe +1';
      }
      break;
    case 'intelligence':
      if (Math.random() < 0.15) {
        player.attributes.intelligence += 1;
        attributeGain = 'Intelligence +1';
      }
      break;
    case 'precision':
      if (Math.random() < 0.15) {
        player.attributes.precision += 1;
        attributeGain = 'Précision +1';
      }
      break;
  }

  await updatePlayer(phoneNumber, player);

  return {
    success: true,
    xpGained: xpAmount,
    attributeGain,
    leveledUp: result.leveledUp,
    newLevel: result.newLevel,
    player: result.player,
    costPaid: trainingCost
  };
}

async function getNextLevelInfo(phoneNumber) {
  const player = await getPlayer(phoneNumber);
  if (!player) return null;

  const currentLevelData = XP_LEVELS.find(l => l.level === player.level);
  const nextLevelData = XP_LEVELS.find(l => l.level === player.level + 1);

  if (!nextLevelData) {
    return {
      isMaxLevel: true,
      message: 'Niveau maximum atteint !'
    };
  }

  const xpNeeded = nextLevelData.xpRequired - player.xp;
  const progress = ((player.xp - currentLevelData.xpRequired) / (nextLevelData.xpRequired - currentLevelData.xpRequired) * 100).toFixed(1);

  return {
    currentLevel: player.level,
    nextLevel: player.level + 1,
    currentXP: player.xp,
    xpNeeded,
    xpForNextLevel: nextLevelData.xpRequired,
    progress,
    unlock: nextLevelData.unlock,
    pointsToGain: nextLevelData.points
  };
}

module.exports = {
  giveTrainingXP,
  getNextLevelInfo
};
