const { getPlayer, createPlayer, playerExists, spendAttributePoints } = require('../game/playerManager');
const { giveTrainingXP, getNextLevelInfo } = require('../game/xpSystem');
const { initCombat, executeAttack, formatCombatStatus, getCombat, getPlayerActiveCombat } = require('../game/combatSystem');
const { getEnergyStatus } = require('../game/energySystem');
const { formatPlayerStats } = require('../utils/helpers');
const { RACES, ALIGNMENTS, STYLES, METIERS, ZONES } = require('../utils/constants');

async function handleCommand(message, sender) {
  const text = message.trim().toLowerCase();
  const args = text.split(' ');
  const command = args[0];

  switch (command) {
    case '!start':
    case '!commencer':
    case '!aide':
    case '!help':
      return getHelpMessage();

    case '!creer':
    case '!create':
      return await handleCreateCharacter(args, sender);

    case '!profil':
    case '!profile':
    case '!stats':
      return await handleProfile(sender);

    case '!attributs':
    case '!add':
      return await handleAddAttribute(args, sender);

    case '!entrainement':
    case '!train':
      return await handleTraining(args, sender);

    case '!combat':
    case '!fight':
      return await handleCombat(args, sender);

    case '!attaque':
    case '!attack':
      return await handleAttack(sender);

    case '!energie':
    case '!energy':
      return await handleEnergy(sender);

    case '!niveau':
    case '!level':
      return await handleLevelInfo(sender);

    case '!races':
      return getRacesList();

    case '!alignements':
    case '!alignments':
      return getAlignmentsList();

    case '!styles':
      return getStylesList();

    case '!metiers':
    case '!jobs':
      return getJobsList();

    case '!zones':
      return getZonesList();

    default:
      return null;
  }
}

function getHelpMessage() {
  return `
🏴‍☠️ *BOT WHATSAPP - ONE PIECE RPG* ⚓

*COMMANDES DE BASE:*
━━━━━━━━━━━━━━━━━━━━

👤 *PERSONNAGE:*
!creer [nom] [race] [alignement] - Créer ton personnage
!profil - Voir ton profil complet
!stats - Voir tes statistiques
!attributs [attr] [points] - Ajouter des points d'attributs
!niveau - Progression vers le prochain niveau

⚔️ *COMBAT:*
!combat [@mention] - Défier un joueur
!attaque - Attaquer pendant un combat
!energie - Voir ton énergie

💪 *PROGRESSION:*
!entrainement [type] - S'entraîner (force/vitesse/endurance/reflexe/intelligence/precision)

📚 *INFORMATIONS:*
!races - Liste des races
!alignements - Liste des alignements
!styles - Liste des styles de combat (niveau 5+)
!metiers - Liste des métiers
!zones - Liste des zones

━━━━━━━━━━━━━━━━━━━━
*Exemple:* !creer Luffy HUMAIN PIRATE
`.trim();
}

async function handleCreateCharacter(args, sender) {
  if (await playerExists(sender)) {
    return '⚠️ Tu as déjà un personnage ! Utilise !profil pour le voir.';
  }

  if (args.length < 4) {
    return `
❌ *Commande incorrecte !*

*Usage:* !creer [nom] [race] [alignement]

*Races disponibles:*
HUMAIN, HOMME_POISSON, GEANT, MINK, SKYPEIEN, CYBORG

*Alignements disponibles:*
PIRATE, MARINE, REVOLUTIONNAIRE, CIVIL

*Exemple:* !creer Luffy HUMAIN PIRATE

Tape !races pour plus de détails sur les races.
`.trim();
  }

  const name = args[1];
  const race = args[2].toUpperCase();
  const alignment = args[3].toUpperCase();

  const result = await createPlayer(sender, name, race, alignment);

  if (!result.success) {
    return `❌ ${result.message}`;
  }

  return `
✅ *Personnage créé avec succès !*

${formatPlayerStats(result.player)}

🎯 Tu commences avec 30 points d'attributs à répartir !
Utilise: !attributs [attribut] [points]

Exemple: !attribut force 10

Tape !aide pour voir toutes les commandes.
`.trim();
}

async function handleProfile(sender) {
  const player = await getPlayer(sender);
  if (!player) {
    return '⚠️ Tu n\'as pas encore de personnage ! Utilise !creer pour en créer un.';
  }

  return formatPlayerStats(player);
}

async function handleAddAttribute(args, sender) {
  const player = await getPlayer(sender);
  if (!player) {
    return '⚠️ Tu n\'as pas encore de personnage ! Utilise !creer pour en créer un.';
  }

  if (args.length < 3) {
    return `
❌ *Commande incorrecte !*

*Usage:* !attributs [attribut] [points]

*Attributs:* force, vitesse, endurance, reflexe, intelligence, precision

*Points disponibles:* ${player.attributePoints}

*Exemple:* !attributs force 10
`.trim();
  }

  const attribute = args[1].toLowerCase();
  const points = parseInt(args[2]);

  if (isNaN(points) || points <= 0) {
    return '❌ Le nombre de points doit être un nombre positif !';
  }

  const result = await spendAttributePoints(sender, attribute, points);

  if (!result.success) {
    return `❌ ${result.message}`;
  }

  return `
${result.message}

*Points restants:* ${result.player.attributePoints}

${formatPlayerStats(result.player)}
`.trim();
}

async function handleTraining(args, sender) {
  const player = await getPlayer(sender);
  if (!player) {
    return '⚠️ Tu n\'as pas encore de personnage !';
  }

  if (args.length < 2) {
    return `
❌ *Commande incorrecte !*

*Usage:* !entrainement [type]

*Types disponibles:*
- force
- vitesse
- endurance
- reflexe
- intelligence
- precision

*Exemple:* !entrainement force
`.trim();
  }

  const trainingType = args[1].toLowerCase();
  const validTypes = ['force', 'vitesse', 'endurance', 'reflexe', 'intelligence', 'precision'];

  if (!validTypes.includes(trainingType)) {
    return '❌ Type d\'entraînement invalide !';
  }

  const result = await giveTrainingXP(sender, trainingType);

  if (!result.success) {
    return `❌ ${result.message}`;
  }

  let response = `
💪 *Entraînement de ${trainingType} terminé !*

✨ +${result.xpGained} XP
`;

  if (result.attributeGain) {
    response += `⚡ ${result.attributeGain}\n`;
  }

  if (result.leveledUp) {
    response += `\n🎉 *NIVEAU SUPÉRIEUR !* Tu es maintenant niveau ${result.newLevel} !`;
  }

  return response.trim();
}

async function handleCombat(args, sender) {
  const player = await getPlayer(sender);
  if (!player) {
    return '⚠️ Tu n\'as pas encore de personnage !';
  }

  const activeCombat = getPlayerActiveCombat(sender);
  if (activeCombat) {
    return '⚠️ Tu es déjà en combat ! Utilise !attaque pour combattre.';
  }

  if (args.length < 2) {
    return '❌ Mentionne un adversaire ! Exemple: !combat @mention';
  }

  return '⚠️ Le système de combat PvP nécessite que les deux joueurs soient présents. Pour l\'instant, utilise !entrainement pour progresser.';
}

async function handleAttack(sender) {
  const activeCombat = getPlayerActiveCombat(sender);
  
  if (!activeCombat) {
    return '⚠️ Tu n\'es pas en combat ! Utilise !combat [@mention] pour défier quelqu\'un.';
  }

  const result = await executeAttack(activeCombat.combatId, sender);

  if (!result.success) {
    return `❌ ${result.message}`;
  }

  if (result.finished) {
    return `
🏆 *VICTOIRE !*

${result.log}

${result.winner} remporte le combat !
+${result.xpGained} XP
+500 Berrys
`.trim();
  }

  const player1 = await getPlayer(activeCombat.combat.player1);
  const player2 = await getPlayer(activeCombat.combat.player2);

  return `
${result.log}

${formatCombatStatus(activeCombat.combat, player1, player2)}

Utilise !attaque pour continuer le combat !
`.trim();
}

async function handleEnergy(sender) {
  const energyStatus = await getEnergyStatus(sender);
  
  if (!energyStatus) {
    return '⚠️ Tu n\'as pas encore de personnage !';
  }

  return `
⚡ *ÉNERGIE*

${energyStatus.bar}
${energyStatus.current}/${energyStatus.max} (${energyStatus.percentage}%)

*Status:* ${energyStatus.status}

L'énergie se régénère automatiquement toutes les 5 minutes (+10).
`.trim();
}

async function handleLevelInfo(sender) {
  const info = await getNextLevelInfo(sender);
  
  if (!info) {
    return '⚠️ Tu n\'as pas encore de personnage !';
  }

  if (info.isMaxLevel) {
    return info.message;
  }

  const progressBar = '█'.repeat(Math.floor(info.progress / 10)) + '░'.repeat(10 - Math.floor(info.progress / 10));

  return `
📊 *PROGRESSION - Niveau ${info.currentLevel}*

${progressBar} ${info.progress}%

*XP actuel:* ${info.currentXP}
*XP requis:* ${info.xpForNextLevel}
*XP manquant:* ${info.xpNeeded}

🎁 *Prochain niveau (${info.nextLevel}):*
- ${info.unlock}
- +${info.pointsToGain} points d'attributs
`.trim();
}

function getRacesList() {
  let list = '🧬 *RACES DISPONIBLES:*\n\n';
  
  Object.entries(RACES).forEach(([key, race]) => {
    list += `*${race.name}*\n${race.description}\n\n`;
  });

  return list.trim();
}

function getAlignmentsList() {
  let list = '⚖️ *ALIGNEMENTS DISPONIBLES:*\n\n';
  
  Object.entries(ALIGNMENTS).forEach(([key, alignment]) => {
    list += `*${alignment.name}*\n${alignment.description}\n\n`;
  });

  return list.trim();
}

function getStylesList() {
  let list = '⚔️ *STYLES DE COMBAT:* (Débloqué au niveau 5)\n\n';
  
  Object.entries(STYLES).forEach(([key, style]) => {
    list += `*${style.name}*\n${style.description}\n\n`;
  });

  return list.trim();
}

function getJobsList() {
  let list = '💼 *MÉTIERS DISPONIBLES:*\n\n';
  
  Object.entries(METIERS).forEach(([key, job]) => {
    list += `*${job.name}* - ${job.salary} Berrys/sem\n${job.description}\n\n`;
  });

  return list.trim();
}

function getZonesList() {
  let list = '🗺️ *ZONES DU MONDE:*\n\n';
  
  Object.entries(ZONES).forEach(([key, zone]) => {
    list += `*${zone.name}* (Niv. ${zone.minLevel}-${zone.maxLevel})\n${zone.description}\n\n`;
  });

  return list.trim();
}

module.exports = {
  handleCommand
};
