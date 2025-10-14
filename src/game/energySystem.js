const cron = require('node-cron');
const { getAllPlayers, updatePlayer, restoreEnergy } = require('./playerManager');

function startEnergyRegeneration() {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const players = await getAllPlayers();
      
      for (const [phoneNumber, player] of Object.entries(players)) {
        if (player.energy < player.maxEnergy) {
          const regenAmount = 10;
          await restoreEnergy(phoneNumber, regenAmount);
        }
      }
      
      console.log('✅ Régénération d\'énergie effectuée pour tous les joueurs');
    } catch (error) {
      console.error('Erreur lors de la régénération d\'énergie:', error);
    }
  });

  console.log('⚡ Système de régénération d\'énergie démarré (toutes les 5 minutes)');
}

async function getEnergyStatus(phoneNumber) {
  const { getPlayer } = require('./playerManager');
  const player = await getPlayer(phoneNumber);
  
  if (!player) return null;

  const percentage = (player.energy / player.maxEnergy * 100).toFixed(1);
  const energyBar = generateEnergyBar(player.energy, player.maxEnergy);

  return {
    current: player.energy,
    max: player.maxEnergy,
    percentage,
    bar: energyBar,
    status: getEnergyStatusText(percentage)
  };
}

function generateEnergyBar(current, max) {
  const filled = Math.floor((current / max) * 10);
  const empty = 10 - filled;
  return '⚡'.repeat(filled) + '○'.repeat(empty);
}

function getEnergyStatusText(percentage) {
  if (percentage >= 80) return 'Excellent';
  if (percentage >= 60) return 'Bon';
  if (percentage >= 40) return 'Moyen';
  if (percentage >= 20) return 'Faible';
  return 'Critique';
}

module.exports = {
  startEnergyRegeneration,
  getEnergyStatus
};
