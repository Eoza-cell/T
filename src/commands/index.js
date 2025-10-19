const { getPlayer, createPlayer, playerExists, spendAttributePoints, updatePlayer, getAllPlayers } = require('../game/playerManager');
const { giveTrainingXP, getNextLevelInfo } = require('../game/xpSystem');
const { initCombat, executeAttack, formatCombatStatus, getCombat, getPlayerActiveCombat } = require('../game/combatSystem');
const { startArenaCombat, getPlayerArena, executeAction: arenaAction, formatArenaStatus } = require('../game/arenaSystem');
const { getEnergyStatus } = require('../game/energySystem');
const { formatPlayerStats } = require('../utils/helpers');
const { RACES, ALIGNMENTS, STYLES, METIERS, ZONES, DEVIL_FRUITS } = require('../utils/constants');
const { handleWeaponShop, handleShipShop, handleBuyWeapon, handleBuyShip, handleMyWeapons, handleMyShips, handleEquipWeapon, handleEquipShip } = require('./shopHandlers');
const { handleStartAdventure, handleJoinAdventure, handleEndAdventure, handleAdventureTurn, handlePlayerAction } = require('./adventureHandlers');
const path = require('path');
const fs = require('fs-extra');

// Helper function to normalize phone numbers
function normalizePhoneNumber(number) {
  if (!number) return null;
  
  // Enlever @s.whatsapp.net, @c.us et tous les caractères non-numériques
  let normalized = number.replace(/@s\.whatsapp\.net|@c\.us/g, '').replace(/\D/g, '');
  
  // Retourner avec le format WhatsApp
  return normalized + '@s.whatsapp.net';
}


async function handleCommand(command, sender, sock = null) {
  const args = command.trim().split(/\s+/);
  const cmd = args[0].toLowerCase();

  switch (cmd) {
    case '!debug':
      return await handleDebug(sender);

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
    case '!attribut':
    case '!add':
      return await handleAddAttribute(args, sender);

    case '!entrainement':
    case '!train':
      return await handleTraining(args, sender);

    case '!combat':
    case '!fight':
      return await handleCombat(args, sender);

    case '!arene':
      // Extraire le numéro mentionné dans le message
      let opponentPhone = null;
      if (args[1]) {
        // Si c'est une mention @12345678, extraire le numéro
        opponentPhone = normalizePhoneNumber(args[1]);
      }
      return await handleArena(args, sender, opponentPhone, sock);

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

    case '!style':
      return await handleStyle(args, sender);

    case '!metier':
    case '!job':
      return await handleJob(args, sender);

    case '!haki':
      return await handleHaki(args, sender);

    case '!inventaire':
    case '!inventory':
    case '!inv':
      return await handleInventory(sender);

    case '!boutique':
    case '!shop':
      return await handleShop(args, sender);

    case '!acheter':
    case '!buy':
      return await handleBuy(args, sender);

    case '!voyager':
    case '!travel':
      return await handleTravel(args, sender);

    case '!classement':
    case '!leaderboard':
    case '!top':
      return await handleLeaderboard(args);

    case '!reputation':
    case '!rep':
    case '!prime':
    case '!bounty':
      return await handleReputation(sender);

    case '!backup':
      return await handleBackup(args, sender);

    case '!restore':
      return await handleRestore(args, sender);

    case '!backups':
      return await handleListBackups(sender);

    case '!boutiquearmes':
    case '!weaponshop':
      return await handleWeaponShop(args, sender);

    case '!boutiquebateaux':
    case '!shipshop':
      return await handleShipShop(args, sender);

    case '!achetararme':
    case '!buyweapon':
      return await handleBuyWeapon(args, sender);

    case '!acheterb':
    case '!buyship':
      return await handleBuyShip(args, sender);

    case '!mesarmes':
    case '!myweapons':
      return await handleMyWeapons(sender);

    case '!mesbateaux':
    case '!myships':
      return await handleMyShips(sender);

    case '!equipearme':
    case '!equipweapon':
      return await handleEquipWeapon(args, sender);

    case '!equipebateau':
    case '!equipship':
      return await handleEquipShip(args, sender);

    case '!startma':
      return await handleStartAdventure(sender, sock);

    case '!joinma':
      return await handleJoinAdventure(sender, sock);

    case '!endma':
      return await handleEndAdventure(sender, sock);

    case '!tourma':
      return await handleAdventureTurn(sender);

    default:
      return `❌ Commande inconnue: ${command}

Tape *!aide* pour voir la liste des commandes disponibles.`;
  }
}

async function getHelpMessage() {
  const caption = `
🏴‍☠️ *BOT WHATSAPP - ONE PIECE RPG* ⚓

*COMMANDES:*
━━━━━━━━━━━━━━━━━━━━

👤 *PERSONNAGE:*
!creer [nom] [race] [alignement] [bonus]
!profil / !stats - Profil complet
!attribut [attr] [pts] - Ajouter attributs
!niveau - Progression XP
!reputation - Réputation & prime

⚔️ *COMBAT:*
!combat [@mention] - Défier un joueur
!arene [@mention] - Arène avec timer 5min
!attaque - Attaquer en combat

📝 *ARÈNE (Format M:)*
M: [description précise de ton action]
Exemple: M: Luffy tend son bras droit et lance un Gomu Gomu no Pistol vers le torse de Zoro à 3m

🛒 *BOUTIQUES:*
!boutiquearmes [page] - Voir les armes
!achetararme [numéro] - Acheter une arme
!mesarmes - Voir tes armes
!equipearme [numéro] - Équiper une arme

⛵ *BATEAUX:*
!boutiquebateaux [page] - Voir les bateaux
!acheterb [numéro] - Acheter un bateau
!mesbateaux - Voir ta flotte
!equipebateau [numéro] - Naviguer avec

🎭 *MODE AVENTURE RP (IA):*
!startma - Démarrer aventure multi-joueurs
!joinma - Rejoindre l'aventure
!tourma - Voir l'ordre des tours
!endma - Terminer l'aventure
*Décris simplement ton action quand c'est ton tour !*

💪 *PROGRESSION:*
!entrainement [type] - S'entraîner
!style [type] - Choisir style (Niv.5+)
!haki [type] - Débloquer Haki
!metier [type] - Choisir métier

🏪 *ÉCONOMIE:*
!boutique - Voir articles
!acheter [item] - Acheter
!inventaire - Ton inventaire

🗺️ *VOYAGE:*
!voyager [zone] - Changer de zone
!zones - Liste des zones

📊 *SOCIAL:*
!classement [type] - Top joueurs

📚 *INFOS:*
!races !alignements !styles !metiers

*DEBUG:*
!debug - Voir les joueurs enregistrés

💾 *SAUVEGARDES:*
!backup - Créer une sauvegarde
!backups - Liste des sauvegardes
!restore [fichier] - Restaurer

━━━━━━━━━━━━━━━━━━━━
*Exemple:* !creer Luffy HUMAIN PIRATE force
`.trim();

  return caption;
}

async function handleCreateCharacter(args, sender) {
  if (await playerExists(sender)) {
    return '⚠️ Tu as déjà un personnage ! Utilise !profil pour le voir.';
  }

  if (args.length < 4) {
    return `
❌ *Commande incorrecte !*

*Usage:* !creer [nom] [race] [alignement] [bonus_attribut_si_humain]

*Races disponibles:*
HUMAIN, HOMME_POISSON, GEANT, MINK, SKYPEIEN, CYBORG

*Alignements disponibles:*
PIRATE, MARINE, REVOLUTIONNAIRE, CIVIL

*Exemple:* !creer Luffy HUMAIN PIRATE force
*Exemple:* !creer Zoro HUMAIN PIRATE vitesse

⚠️ Si HUMAIN : ajoute force/vitesse/endurance/reflexe/intelligence/precision

Tape !races pour plus de détails sur les races.
`.trim();
  }

  const name = args[1];
  const race = args[2].toUpperCase();
  const alignment = args[3].toUpperCase();
  const bonusAttr = args[4] ? args[4].toLowerCase() : null;

  if (race === 'HUMAIN' && !bonusAttr) {
    return `
❌ *Race HUMAIN nécessite un choix de bonus !*

*Usage:* !creer ${name} HUMAIN ${alignment} [attribut]

*Attributs disponibles:*
force, vitesse, endurance, reflexe, intelligence, precision

*Exemple:* !creer ${name} HUMAIN ${alignment} force
`.trim();
  }

  if (race === 'HUMAIN' && bonusAttr && !['force', 'vitesse', 'endurance', 'reflexe', 'intelligence', 'precision'].includes(bonusAttr)) {
    return '❌ Attribut bonus invalide ! Choisis: force, vitesse, endurance, reflexe, intelligence, precision';
  }

  const result = await createPlayer(sender, name, race, alignment, bonusAttr);

  if (!result.success) {
    return `❌ ${result.message}`;
  }

  let bonusMsg = '';
  if (race === 'HUMAIN' && bonusAttr) {
    bonusMsg = `\n🎁 Bonus HUMAIN: +5 ${bonusAttr}`;
  }

  return `
✅ *Personnage créé avec succès !*
${bonusMsg}

${formatPlayerStats(result.player)}

🎯 Tu commences avec 30 points d'attributs à répartir !
Utilise: !attribut [attribut] [points]

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

*Usage:* !attribut [attribut] [points]

*Attributs:* force, vitesse, endurance, reflexe, intelligence, precision

*Points disponibles:* ${player.attributePoints}

*Exemple:* !attribut force 10
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
✅ *${points} points ajoutés à ${attribute} !*

*Points restants:* ${result.player.attributePoints}

━━━━━━━━━━━━━━━━━━━━

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
💰 -${result.costPaid} Berrys
⚡ -20 Énergie
`;

  if (result.attributeGain) {
    response += `\n🎁 ${result.attributeGain}`;
  }

  if (result.leveledUp) {
    response += `\n\n🎉 *NIVEAU SUPÉRIEUR !* Tu es maintenant niveau ${result.newLevel} !`;
  }

  // Actualiser la fiche du joueur
  response += `\n\n${formatPlayerStats(result.player)}`;
  
  response += `\n\n⏳ Prochain entraînement dans 1 heure`;

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

async function handleArena(args, sender, opponentPhone, sock) {
  const player1 = await getPlayer(sender);
  if (!player1) {
    return '⚠️ Tu n\'as pas encore de personnage !';
  }

  if (getPlayerActiveCombat(sender) || getPlayerArena(sender)) {
    return '⚠️ Tu es déjà en combat ou en arène ! Utilise !attaque pour continuer.';
  }

  if (!opponentPhone) {
    return '❌ Mentionne un adversaire ! Exemple: !arene @mention';
  }

  const player2 = await getPlayer(opponentPhone);
  if (!player2) {
    return `⚠️ L'adversaire ${opponentPhone} n'a pas de personnage.`;
  }

  if (sender === opponentPhone) {
    return '❌ Tu ne peux pas te défier toi-même !';
  }

  // Check if opponent is also in combat
  if (getPlayerActiveCombat(opponentPhone) || getPlayerArena(opponentPhone)) {
    return `⚠️ ${player2.name} est déjà en combat ou en arène !`;
  }

  // Initiate arena combat
  const arenaCombat = await startArenaCombat(player1, player2);

  if (!arenaCombat.success) {
    return `❌ ${arenaCombat.message}`;
  }

  const arena = arenaCombat.arena;
  
  // Send challenge message to opponent
  if (sock) {
    sock.sendMessage(opponentPhone, { text: `🔥 ${player1.name} te défie dans l'arène ! Le combat commence. Attends ton tour pour agir.` });
  }

  const status = formatArenaStatus(arena, player1, player2);
  
  return `
⚔️ *ARÈNE DÉFIÉE !*

${player1.name} vs ${player2.name}

${status}

${player1.name}, c'est ton tour ! Écris ton action en commençant par 'M:' suivi de ta description détaillée.

📝 Exemple: M: Luffy tend son bras droit et lance un Gomu Gomu no Pistol vers le torse de Zoro à 3m

⏰ Tu as 5 minutes pour répondre.
`.trim();
}


async function handleAttack(sender) {
  const activeCombat = getPlayerActiveCombat(sender);
  const activeArena = getPlayerArena(sender);

  if (!activeCombat && !activeArena) {
    return '⚠️ Tu n\'es pas en combat ! Utilise !combat [@mention] ou !arene [@mention] pour défier quelqu\'un.';
  }

  // Check if it's an arena combat
  if (activeArena) {
    // Player needs to provide the action starting with "M:"
    return "📝 Pour combattre dans l'arène, décris ton action en commençant par 'M:'\n\nExemple: M: Luffy tend son bras droit et lance un Gomu Gomu no Pistol vers le torse de Zoro à 3m";
  } else {
    // Handle regular combat (if implemented separately)
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

async function handleStyle(args, sender) {
  const player = await getPlayer(sender);
  if (!player) return '⚠️ Tu n\'as pas encore de personnage !';

  if (player.level < 5) {
    return `❌ Les styles de combat se débloquent au niveau 5 !\n\n*Niveau actuel:* ${player.level}\n*Niveau requis:* 5`;
  }

  if (player.style) {
    return `⚠️ Tu as déjà choisi le style: *${player.style}*\n\nCe choix est définitif !`;
  }

  if (args.length < 2) {
    let styleList = '⚔️ *CHOISIS TON STYLE DE COMBAT:*\n\n';
    Object.entries(STYLES).forEach(([key, style]) => {
      styleList += `*${key}* - ${style.name}\n${style.description}\nBonus: ${JSON.stringify(style.bonus)}\n\n`;
    });
    styleList += '\n*Usage:* !style [EPEISTE/COMBATTANT/TIREUR/etc]';
    return styleList.trim();
  }

  const styleChoice = args[1].toUpperCase();
  const styleData = STYLES[styleChoice];

  if (!styleData) {
    return '❌ Style invalide ! Tape !styles pour voir la liste.';
  }

  player.style = styleData.name;
  Object.entries(styleData.bonus).forEach(([attr, value]) => {
    player.attributes[attr] = (player.attributes[attr] || 0) + value;
  });

  await updatePlayer(sender, player);

  return `
✅ *Style choisi: ${styleData.name}*

${styleData.description}

*Bonus appliqués:*
${Object.entries(styleData.bonus).map(([k, v]) => `• ${k}: ${v > 0 ? '+' : ''}${v}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━

${formatPlayerStats(player)}
`.trim();
}

async function handleJob(args, sender) {
  const player = await getPlayer(sender);
  if (!player) return '⚠️ Tu n\'as pas encore de personnage !';

  if (args.length < 2) {
    let jobList = '💼 *CHOISIS TON MÉTIER:*\n\n';
    Object.entries(METIERS).forEach(([key, job]) => {
      jobList += `*${key}* - ${job.name}\n${job.description}\nSalaire: ${job.salary} Berrys/sem\n\n`;
    });
    jobList += '\n*Usage:* !metier [FORGERON/MEDECIN/etc]';
    return jobList.trim();
  }

  const jobChoice = args[1].toUpperCase();
  const jobData = METIERS[jobChoice];

  if (!jobData) {
    return '❌ Métier invalide ! Tape !metiers pour voir la liste.';
  }

  player.job = jobData.name;
  await updatePlayer(sender, player);

  return `
✅ *Métier choisi: ${jobData.name}*

${jobData.description}

💰 *Salaire:* ${jobData.salary} Berrys/semaine
🎁 *Bonus:* ${JSON.stringify(jobData.bonus)}
`.trim();
}

async function handleHaki(args, sender) {
  const player = await getPlayer(sender);
  if (!player) return '⚠️ Tu n\'as pas encore de personnage !';

  if (args.length < 2) {
    return `
🌀 *TON HAKI:*

*Observation:* ${player.haki.observation ? '✅ Débloqué' : '🔒 Niveau 10 requis'}
*Armement:* ${player.haki.armement ? '✅ Débloqué' : '🔒 Niveau 15 requis'}
*Royal:* ${player.haki.royal ? '✅ Débloqué' : '🔒 Niveau 20 requis'}

*Usage:*
!haki observation - Débloquer (Niv. 10, 500 Berrys)
!haki armement - Débloquer (Niv. 15, 1000 Berrys)
!haki royal - Débloquer (Niv. 20, 2000 Berrys)
`.trim();
  }

  const hakiType = args[1].toLowerCase();
  const requirements = {
    observation: { level: 10, cost: 500 },
    armement: { level: 15, cost: 1000 },
    royal: { level: 20, cost: 2000 }
  };

  if (!requirements[hakiType]) {
    return '❌ Type de Haki invalide ! (observation, armement, royal)';
  }

  if (player.haki[hakiType]) {
    return `⚠️ Tu possèdes déjà le Haki ${hakiType} !`;
  }

  const req = requirements[hakiType];
  if (player.level < req.level) {
    return `❌ Niveau ${req.level} requis ! (Actuel: ${player.level})`;
  }

  if (player.berrys < req.cost) {
    return `❌ ${req.cost} Berrys requis ! (Actuel: ${player.berrys})`;
  }

  player.haki[hakiType] = true;
  player.berrys -= req.cost;
  await updatePlayer(sender, player);

  return `
✅ *Haki ${hakiType.toUpperCase()} débloqué !*

🌀 Tu maîtrises maintenant ce pouvoir !
💰 -${req.cost} Berrys
`.trim();
}

async function handleInventory(sender) {
  const player = await getPlayer(sender);
  if (!player) return '⚠️ Tu n\'as pas encore de personnage !';

  if (!player.inventory || player.inventory.length === 0) {
    return '🎒 *Inventaire vide*\n\nUtilise !boutique pour acheter des objets.';
  }

  let inv = '🎒 *TON INVENTAIRE:*\n\n';
  player.inventory.forEach((item, index) => {
    inv += `${index + 1}. ${item.name} x${item.quantity}\n   ${item.description}\n\n`;
  });

  return inv.trim();
}

async function handleShop(args, sender) {
  const player = await getPlayer(sender);
  if (!player) return '⚠️ Tu n\'as pas encore de personnage !';

  if (args.length > 1 && args[1].toLowerCase() === 'fruits') {
    // Boutique des fruits du démon
    let fruitShop = `
🍎 *BOUTIQUE DES FRUITS DU DÉMON* 🍎

💰 *Tes Berrys:* ${player.berrys}
⚠️ Tu as déjà un fruit: ${player.fruit || 'Aucun'}

*FRUITS DISPONIBLES:*

`;

    // Grouper par rareté
    const byRarity = {
      commun: [],
      rare: [],
      tres_rare: [],
      mythique: [],
      legendaire: []
    };

    Object.entries(DEVIL_FRUITS).forEach(([key, fruit]) => {
      byRarity[fruit.rarity].push({ key, ...fruit });
    });

    Object.entries(byRarity).forEach(([rarity, fruits]) => {
      if (fruits.length > 0) {
        const rarityEmoji = {
          commun: '⚪',
          rare: '🔵',
          tres_rare: '🟣',
          mythique: '🟡',
          legendaire: '🔴'
        };
        fruitShop += `\n${rarityEmoji[rarity]} *${rarity.toUpperCase()}*\n`;
        fruits.forEach(fruit => {
          fruitShop += `  • ${fruit.name} (${fruit.type})\n`;
          fruitShop += `    💰 ${fruit.price} Berrys\n`;
          fruitShop += `    ${fruit.description}\n`;
          fruitShop += `    !acheter ${fruit.key.toLowerCase()}\n\n`;
        });
      }
    });

    fruitShop += `\n*Usage:* !acheter [nom_fruit]\n*Exemple:* !acheter gomu_gomu`;

    return fruitShop.trim();
  }

  const shopItems = {
    potion: { name: 'Potion de soin', price: 50, effect: '+50 HP', description: 'Restaure 50 HP' },
    boost: { name: 'Boost d\'énergie', price: 100, effect: '+20 énergie', description: 'Restaure 20 énergie' },
    arme: { name: 'Arme +10 Force', price: 500, effect: '+10 Force', description: 'Augmente Force de 10' }
  };

  let shop = `
🏪 *BOUTIQUE* 🏪

💰 *Tes Berrys:* ${player.berrys}

*Articles disponibles:*

`;

  Object.entries(shopItems).forEach(([key, item]) => {
    shop += `📦 *${item.name}* - ${item.price} Berrys\n   ${item.description}\n   !acheter ${key}\n\n`;
  });

  shop += `\n🍎 *FRUITS DU DÉMON*\nTape: !boutique fruits`;

  return shop.trim();
}

async function handleBuy(args, sender) {
  const player = await getPlayer(sender);
  if (!player) return '⚠️ Tu n\'as pas encore de personnage !';

  if (args.length < 2) {
    return '❌ Utilise: !acheter [item]\n\nTape !boutique pour voir les articles.';
  }

  const itemKey = args[1].toUpperCase();

  // Vérifier si c'est un fruit du démon
  if (DEVIL_FRUITS[itemKey]) {
    const fruit = DEVIL_FRUITS[itemKey];

    if (player.fruit) {
      return `❌ Tu possèdes déjà le fruit: *${player.fruit}*\n\nOn ne peut manger qu'un seul Fruit du Démon !`;
    }

    if (player.berrys < fruit.price) {
      return `❌ Pas assez de Berrys !\n\n*Prix:* ${fruit.price}\n*Tes Berrys:* ${player.berrys}`;
    }

    player.berrys -= fruit.price;
    player.fruit = fruit.name;

    // Appliquer les bonus du fruit
    Object.entries(fruit.bonus).forEach(([attr, value]) => {
      player.attributes[attr] = (player.attributes[attr] || 0) + value;
    });

    // Malus pour les fruits (faiblesse à l'eau)
    player.attributes.endurance -= 10;

    await updatePlayer(sender, player);

    return `
✅ *FRUIT DU DÉMON ACQUIS !*

🍎 *${fruit.name}*
📜 Type: ${fruit.type}
💰 -${fruit.price} Berrys (Reste: ${player.berrys})

*BONUS APPLIQUÉS:*
${Object.entries(fruit.bonus).map(([k, v]) => `⚡ +${v} ${k}`).join('\n')}

⚠️ *MALUS:* -10 Endurance (faiblesse à l'eau)

${fruit.description}

${formatPlayerStats(player)}
`.trim();
  }

  // Articles normaux
  const shopItems = {
    potion: { name: 'Potion de soin', price: 50, effect: 'heal', value: 50, description: 'Restaure 50 HP' },
    boost: { name: 'Boost d\'énergie', price: 100, effect: 'energy', value: 20, description: 'Restaure 20 énergie' },
    arme: { name: 'Arme +10 Force', price: 500, effect: 'force', value: 10, description: '+10 Force permanent' }
  };

  const item = shopItems[itemKey.toLowerCase()];

  if (!item) {
    return '❌ Article inexistant ! Tape !boutique ou !boutique fruits';
  }

  if (player.berrys < item.price) {
    return `❌ Pas assez de Berrys !\n\n*Prix:* ${item.price}\n*Tes Berrys:* ${player.berrys}`;
  }

  player.berrys -= item.price;

  if (item.effect === 'force') {
    player.attributes.force += item.value;
  } else if (item.effect === 'energy') {
    player.energy = Math.min(player.maxEnergy, player.energy + item.value);
  } else {
    if (!player.inventory) player.inventory = [];
    const existing = player.inventory.find(i => i.name === item.name);
    if (existing) {
      existing.quantity++;
    } else {
      player.inventory.push({ ...item, quantity: 1 });
    }
  }

  await updatePlayer(sender, player);

  return `
✅ *Achat réussi !*

📦 ${item.name}
💰 -${item.price} Berrys (Reste: ${player.berrys})

${item.effect === 'force' ? `⚡ +${item.value} Force appliqué !` : ''}
${item.effect === 'energy' ? `⚡ +${item.value} énergie restaurée !` : ''}
`.trim();
}

async function handleTravel(args, sender) {
  const player = await getPlayer(sender);
  if (!player) return '⚠️ Tu n\'as pas encore de personnage !';

  if (args.length < 2) {
    return `
🗺️ *VOYAGER:*

*Zone actuelle:* ${player.currentZone}

*Zones disponibles:*
${Object.entries(ZONES).map(([key, zone]) => 
  `• ${key} (Niv. ${zone.minLevel}+) - ${zone.description}`
).join('\n')}

*Usage:* !voyager [EAST_BLUE/GRAND_LINE/etc]
`.trim();
  }

  const zoneKey = args[1].toUpperCase();
  const zone = ZONES[zoneKey];

  if (!zone) {
    return '❌ Zone invalide ! Tape !zones pour voir la liste.';
  }

  if (player.level < zone.minLevel) {
    return `❌ Niveau ${zone.minLevel} requis pour ${zone.name} !\n\n*Ton niveau:* ${player.level}`;
  }

  player.currentZone = zoneKey;
  await updatePlayer(sender, player);

  return `
✅ *Voyage réussi !*

📍 Tu es maintenant dans: *${zone.name}*

${zone.description}
⚠️ Niveau de danger: ${zone.dangerLevel}
`.trim();
}

async function handleLeaderboard(args) {
  const allPlayers = await getAllPlayers();
  const players = Object.values(allPlayers);

  if (players.length === 0) {
    return '📊 Aucun joueur enregistré !';
  }

  const type = args[1] || 'level';
  let sorted = [];

  if (type === 'level') {
    sorted = players.sort((a, b) => b.level - a.level || b.xp - a.xp);
  } else if (type === 'berrys') {
    sorted = players.sort((a, b) => b.berrys - a.berrys);
  } else if (type === 'bounty') {
    sorted = players.sort((a, b) => b.bounty - a.bounty);
  } else {
    sorted = players.sort((a, b) => b.level - a.level);
  }

  let board = `
🏆 *CLASSEMENT* ${type.toUpperCase()} 🏆

`;

  sorted.slice(0, 10).forEach((p, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
    const value = type === 'level' ? `Niv.${p.level} (${p.xp} XP)` : 
                  type === 'berrys' ? `${p.berrys} Berrys` :
                  `${p.bounty} Berrys`;
    board += `${medal} *${p.name}* - ${value}\n`;
  });

  board += `\n*Types:* !classement [level/berrys/bounty]`;

  return board.trim();
}

async function handleReputation(sender) {
  const player = await getPlayer(sender);
  if (!player) return '⚠️ Tu n\'as pas encore de personnage !';

  const repLevel = player.reputation >= 1000 ? 'Légende' :
                   player.reputation >= 500 ? 'Célèbre' :
                   player.reputation >= 200 ? 'Connu' :
                   player.reputation >= 50 ? 'Émergent' : 'Inconnu';

  return `
👤 *${player.name}*

📊 *Réputation:* ${player.reputation} (${repLevel})
💀 *Prime:* ${player.bounty} Berrys
⚖️ *Alignement:* ${player.alignment}

⚔️ *Stats de combat:*
• Victoires: ${player.combatStats.wins}
• Défaites: ${player.combatStats.losses}
• Ratio: ${player.combatStats.wins > 0 ? (player.combatStats.wins / (player.combatStats.wins + player.combatStats.losses) * 100).toFixed(1) : 0}%
`.trim();
}

async function handleDebug(sender) {
  const allPlayers = await getAllPlayers();
  let debugMessage = '--- DEBUG PLAYERS ---';

  if (Object.keys(allPlayers).length === 0) {
    return 'Aucun joueur enregistré.';
  }

  for (const playerId in allPlayers) {
    const player = allPlayers[playerId];
    debugMessage += `\nID: ${playerId}\nNom: ${player.name}\nLevel: ${player.level}\nZone: ${player.currentZone}\n`;
  }

  debugMessage += '\n--- END DEBUG ---';
  return debugMessage;
}

async function handleBackup(args, sender) {
  const { createBackup } = require('../utils/backup');
  const result = await createBackup();
  
  if (result.success) {
    return `✅ **Sauvegarde créée avec succès !**\n\n📁 ${path.basename(result.file)}\n\nUtilise !backups pour voir toutes les sauvegardes.`;
  }
  
  return `❌ Erreur lors de la sauvegarde: ${result.message}`;
}

async function handleRestore(args, sender) {
  const { restoreBackup } = require('../utils/backup');
  const backupName = args[1] || null;
  const result = await restoreBackup(backupName);
  
  if (result.success) {
    return `✅ **Données restaurées avec succès !**\n\n📁 Depuis: ${result.file}\n\nLe bot va redémarrer...`;
  }
  
  return `❌ Erreur lors de la restauration: ${result.message}`;
}

async function handleListBackups(sender) {
  const { listBackups } = require('../utils/backup');
  const result = await listBackups();
  
  if (!result.success) {
    return `❌ Erreur: ${result.message}`;
  }
  
  if (result.backups.length === 0) {
    return '📦 Aucune sauvegarde disponible.\n\nUtilise !backup pour créer une sauvegarde.';
  }
  
  let list = '📦 **SAUVEGARDES DISPONIBLES:**\n\n';
  result.backups.forEach((backup, i) => {
    list += `${i + 1}. ${backup.name}\n   📅 ${backup.date}\n   📊 ${backup.size}\n\n`;
  });
  
  list += '\n*Pour restaurer:* !restore [nom_fichier]';
  
  return list.trim();
}

module.exports = {
  handleCommand
};