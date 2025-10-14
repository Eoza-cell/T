const { getPlayer, updatePlayer, addXP } = require('./playerManager');
const { XP_GAINS, XP_LEVELS } = require('../utils/constants');

async function giveTrainingXP(phoneNumber, trainingType) {
  const player = await getPlayer(phoneNumber);
  if (!player) return { success: false, message: 'Joueur introuvable !' };

  const xpAmount = Math.floor(Math.random() * (XP_GAINS.training.max - XP_GAINS.training.min + 1)) + XP_GAINS.training.min;

  const result = await addXP(phoneNumber, xpAmount);

  let attributeGain = null;
  
  switch (trainingType) {
    case 'force':
      if (Math.random() < 0.3) {
        player.attributes.force += 1;
        attributeGain = 'Force +1';
      }
      break;
    case 'vitesse':
      if (Math.random() < 0.25) {
        player.attributes.vitesse += 1;
        attributeGain = 'Vitesse +1';
      }
      break;
    case 'endurance':
      if (Math.random() < 0.3) {
        player.attributes.endurance += 1;
        attributeGain = 'Endurance +1';
      }
      break;
    case 'reflexe':
      if (Math.random() < 0.35) {
        player.attributes.reflexe += 1;
        attributeGain = 'Réflexe +1';
      }
      break;
    case 'intelligence':
      if (Math.random() < 0.3) {
        player.attributes.intelligence += 1;
        attributeGain = 'Intelligence +1';
      }
      break;
    case 'precision':
      if (Math.random() < 0.3) {
        player.attributes.precision += 1;
        attributeGain = 'Précision +1';
      }
      break;
  }

  if (attributeGain) {
    await updatePlayer(phoneNumber, player);
  }

  return {
    success: true,
    xpGained: xpAmount,
    attributeGain,
    leveledUp: result.leveledUp,
    newLevel: result.newLevel,
    player: result.player
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
