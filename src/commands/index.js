const { getPlayer, createPlayer, playerExists, spendAttributePoints, updatePlayer, getAllPlayers } = require('../game/playerManager');
const { giveTrainingXP, getNextLevelInfo } = require('../game/xpSystem');
const { initCombat, executeAttack, formatCombatStatus, getCombat, getPlayerActiveCombat, startArenaCombat, arenaAction } = require('../game/combatSystem');
const { getEnergyStatus } = require('../game/energySystem');
const { formatPlayerStats } = require('../utils/helpers');
const { RACES, ALIGNMENTS, STYLES, METIERS, ZONES } = require('../utils/constants');
const path = require('path');
const fs = require('fs-extra');

// Helper function to normalize phone numbers
function normalizePhoneNumber(number) {
  if (!number) return null;
  // Remove non-digit characters and ensure it starts with '91' for India or appropriate country code
  let normalized = number.replace(/\D/g, '');
  if (normalized.startsWith('0')) {
    normalized = '91' + normalized.substring(1); // Assuming India as default if starts with 0
  } else if (!normalized.startsWith('91')) {
    normalized = '91' + normalized; // Default to India country code if not present
  }
  return normalized + '@s.whatsapp.net';
}

// Global variables for arena timer
let currentArena = null;
let arenaTimer = null;

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
      const opponentPhone = args[1] ? normalizePhoneNumber(args[1].replace('@', '')) : null;
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

  if (getPlayerActiveCombat(sender)) {
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
  if (getPlayerActiveCombat(opponentPhone)) {
    return `⚠️ ${player2.name} est déjà en combat ou en arène !`;
  }

  // Initiate arena combat
  const arenaCombat = await startArenaCombat(player1, player2);

  if (!arenaCombat.success) {
    return `❌ ${arenaCombat.message}`;
  }

  currentArena = arenaCombat.arena;
  
  // Start the 5-minute timer
  clearTimeout(arenaTimer); // Clear any existing timer
  arenaTimer = setTimeout(async () => {
    if (currentArena && !currentArena.finished) {
      const inactivePlayer = currentArena.turn === currentArena.player1.id ? currentArena.player1 : currentArena.player2;
      const activePlayer = currentArena.turn === currentArena.player1.id ? currentArena.player2 : currentArena.player1;
      
      // Apply penalty: lose turn and 10% energy
      await updatePlayer(inactivePlayer.id, { energy: Math.max(0, inactivePlayer.energy - 10) });
      
      // Send timeout message to both players
      const timeoutMessage = `
⏳ Temps écoulé pour ${inactivePlayer.name} !
⚠️ ${inactivePlayer.name} perd son tour et subit une perte d'énergie.
⚡ Énergie de ${inactivePlayer.name} : ${inactivePlayer.energy - 10}%
      `;
      sock.sendMessage(inactivePlayer.id, { text: timeoutMessage });
      sock.sendMessage(activePlayer.id, { text: `L'adversaire ${inactivePlayer.name} a perdu son tour.` });

      // Advance turn and reset timer
      await arenaAction(currentArena.id, activePlayer.id, "timeout"); // Simulate an action to advance turn
      
      // Notify players about the next turn
      const nextPlayer = currentArena.turn === currentArena.player1.id ? currentArena.player1 : currentArena.player2;
      sock.sendMessage(nextPlayer.id, { text: "🕐 5 minutes pour répondre. Ton tour commence !" });
      
      // Reset timer for the new turn
      clearTimeout(arenaTimer);
      arenaTimer = setTimeout(async () => {
        // Handle timeout for the next player
        if (currentArena && !currentArena.finished) {
            const nextInactivePlayer = currentArena.turn === currentArena.player1.id ? currentArena.player1 : currentArena.player2;
            const nextActivePlayer = currentArena.turn === currentArena.player1.id ? currentArena.player2 : currentArena.player1;
            await updatePlayer(nextInactivePlayer.id, { energy: Math.max(0, nextInactivePlayer.energy - 10) });
            sock.sendMessage(nextInactivePlayer.id, { text: `⏳ Temps écoulé pour ${nextInactivePlayer.name} ! Tu perds ton tour et 10% d'énergie.` });
            sock.sendMessage(nextActivePlayer.id, { text: `L'adversaire ${nextInactivePlayer.name} a perdu son tour.` });
            await arenaAction(currentArena.id, nextActivePlayer.id, "timeout"); // Advance turn
        }
      }, 300000); // 5 minutes
    }
  }, 300000); // 5 minutes

  // Send challenge message to opponent
  if (sock) {
    sock.sendMessage(opponentPhone, { text: `🔥 ${player1.name} te défie dans l'arène ! Utilise !attaque pour commencer le combat.` });
  }

  return `
⚔️ *ARÈNE DÉFIÉE !*

${player1.name} vs ${player2.name}

${formatCombatStatus(currentArena, player1, player2)}

${player1.name}, c'est ton tour ! Écris ton action (M: ...). Tu as 5 minutes.
      `.trim();
}


async function handleAttack(sender) {
  const activeCombat = getPlayerActiveCombat(sender);

  if (!activeCombat) {
    return '⚠️ Tu n\'es pas en combat ! Utilise !combat [@mention] pour défier quelqu\'un.';
  }

  // Check if it's an arena combat
  if (activeCombat.type === 'arena') {
    // The player has typed !attaque, so they are performing their action.
    // We need to parse the message for the action description.
    // This part is tricky as the original code doesn't specify how !attaque would be used in an arena.
    // Assuming the player's action is in the message content *after* !attaque.
    // This needs a more robust message parsing mechanism.

    // For now, let's assume a simplified scenario where !attaque itself triggers the next step
    // and the actual action is parsed by arenaAction when it receives a message starting with 'M:'
    
    // If the player is the current player in the arena combat
    if (activeCombat.turn === sender) {
      // Player needs to provide the action starting with "M:"
      return "Veuillez entrer votre action en commençant par 'M:' (ex: M: J'attaque avec mon épée)";
    } else {
      return "Ce n'est pas encore votre tour !";
    }
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

// Function to handle messages starting with 'M:' during an arena combat
async function handleArenaMessage(message, sender, sock) {
  if (!currentArena || currentArena.finished) {
    return; // Not in an active arena combat
  }

  if (currentArena.turn !== sender) {
    sock.sendMessage(sender, { text: "Ce n'est pas encore ton tour !" });
    return;
  }

  const actionText = message.substring(message.indexOf("M:") + 2).trim();
  if (!actionText) {
    sock.sendMessage(sender, { text: "Veuillez décrire ton action après 'M:'." });
    return;
  }

  clearTimeout(arenaTimer); // Stop the timer as the player has responded

  const result = await arenaAction(currentArena.id, sender, actionText);

  if (!result.success) {
    sock.sendMessage(sender, { text: `⚠️ Action refusée : ${result.message}` });
    // Restart timer for the same player
    arenaTimer = setTimeout(async () => {
        if (currentArena && !currentArena.finished) {
            const inactivePlayer = currentArena.turn === currentArena.player1.id ? currentArena.player1 : currentArena.player2;
            const activePlayer = currentArena.turn === currentArena.player1.id ? currentArena.player2 : currentArena.player1;
            await updatePlayer(inactivePlayer.id, { energy: Math.max(0, inactivePlayer.energy - 10) });
            sock.sendMessage(inactivePlayer.id, { text: `⏳ Temps écoulé pour ${inactivePlayer.name} ! Tu perds ton tour et 10% d'énergie.` });
            await arenaAction(currentArena.id, activePlayer.id, "timeout");
        }
    }, 300000);
    return;
  }

  // Send status update to both players
  const player1 = await getPlayer(currentArena.player1.id);
  const player2 = await getPlayer(currentArena.player2.id);
  const combatStatus = formatCombatStatus(currentArena.combat, player1, player2);

  sock.sendMessage(currentArena.player1.id, { text: `\n${result.log}\n${combatStatus}` });
  sock.sendMessage(currentArena.player2.id, { text: `\n${result.log}\n${combatStatus}` });

  if (result.finished) {
    clearTimeout(arenaTimer);
    currentArena.finished = true;
    currentArena = null; // Reset arena state
    return;
  }

  // Announce next turn and reset timer
  const nextPlayer = currentArena.turn === currentArena.player1.id ? currentArena.player1 : currentArena.player2;
  sock.sendMessage(nextPlayer.id, { text: "🕐 5 minutes pour répondre. Ton tour commence !" });
  
  clearTimeout(arenaTimer);
  arenaTimer = setTimeout(async () => {
      if (currentArena && !currentArena.finished) {
          const inactivePlayer = currentArena.turn === currentArena.player1.id ? currentArena.player1 : currentArena.player2;
          const activePlayer = currentArena.turn === currentArena.player1.id ? currentArena.player2 : currentArena.player1;
          await updatePlayer(inactivePlayer.id, { energy: Math.max(0, inactivePlayer.energy - 10) });
          sock.sendMessage(inactivePlayer.id, { text: `⏳ Temps écoulé pour ${inactivePlayer.name} ! Tu perds ton tour et 10% d'énergie.` });
          sock.sendMessage(activePlayer.id, { text: `L'adversaire ${inactivePlayer.name} a perdu son tour.` });
          await arenaAction(currentArena.id, activePlayer.id, "timeout");
      }
  }, 300000);
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

  const shopItems = {
    potion: { name: 'Potion de soin', price: 50, effect: '+50 HP', description: 'Restaure 50 HP' },
    boost: { name: 'Boost d\'énergie', price: 100, effect: '+20 énergie', description: 'Restaure 20 énergie' },
    arme: { name: 'Arme +10 Force', price: 500, effect: '+10 Force', description: 'Augmente Force de 10' },
    fruit: { name: 'Fruit du Démon (aléatoire)', price: 5000, effect: 'Pouvoir', description: 'Fruit aléatoire' }
  };

  let shop = `
🏪 *BOUTIQUE* 🏪

💰 *Tes Berrys:* ${player.berrys}

*Articles disponibles:*

`;

  Object.entries(shopItems).forEach(([key, item]) => {
    shop += `📦 *${item.name}* - ${item.price} Berrys\n   ${item.description}\n   !acheter ${key}\n\n`;
  });

  return shop.trim();
}

async function handleBuy(args, sender) {
  const player = await getPlayer(sender);
  if (!player) return '⚠️ Tu n\'as pas encore de personnage !';

  if (args.length < 2) {
    return '❌ Utilise: !acheter [item]\n\nTape !boutique pour voir les articles.';
  }

  const shopItems = {
    potion: { name: 'Potion de soin', price: 50, effect: 'heal', value: 50, description: 'Restaure 50 HP' },
    boost: { name: 'Boost d\'énergie', price: 100, effect: 'energy', value: 20, description: 'Restaure 20 énergie' },
    arme: { name: 'Arme +10 Force', price: 500, effect: 'force', value: 10, description: '+10 Force permanent' },
    fruit: { name: 'Fruit du Démon', price: 5000, effect: 'fruit', value: 1, description: 'Fruit aléatoire' }
  };

  const itemKey = args[1].toLowerCase();
  const item = shopItems[itemKey];

  if (!item) {
    return '❌ Article inexistant ! Tape !boutique pour voir la liste.';
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
  handleCommand,
  handleArenaMessage
};