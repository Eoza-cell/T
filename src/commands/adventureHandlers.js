const { getPlayer } = require('../game/playerManager');
const { startAdventure, getAdventure, joinAdventure, processPlayerAction, endAdventure, formatTurnOrder } = require('../adventure/adventureSystem');

async function handleStartAdventure(sender, sock) {
  const player = await getPlayer(sender);
  if (!player) {
    return '⚠️ Tu n\'as pas encore de personnage !';
  }

  const groupId = sender.replace('@s.whatsapp.net', '').includes('-') ? sender : sender;
  
  const existingAdventure = getAdventure(groupId);
  if (existingAdventure && existingAdventure.active) {
    return '⚠️ Une aventure est déjà en cours ! Utilise !joinma pour rejoindre ou !endma pour terminer.';
  }

  const result = await startAdventure(groupId, sender, [sender]);

  if (!result.success) {
    return `❌ ${result.message}`;
  }

  return `
🎭 *MODE AVENTURE DÉMARRÉ !*

⚓ ${player.name} a lancé une aventure One Piece !

🎬 *Comment jouer:*
1. Les autres joueurs utilisent !joinma pour rejoindre
2. Chacun joue à son tour dans l'ordre
3. Décris simplement ton action quand c'est ton tour
4. L'IA narratrice racontera ce qui se passe
5. Les actions les plus cool gagnent des XP !

━━━━━━━━━━━━━━━━━━━━

👥 *Joueurs actuels:* ${result.adventure.players.size}

📝 *Pour rejoindre:* !joinma
🎯 *Voir l'ordre:* !tourma
🛑 *Terminer:* !endma

L'aventure commence ! 🏴‍☠️
`.trim();
}

async function handleJoinAdventure(sender, sock) {
  const player = await getPlayer(sender);
  if (!player) {
    return '⚠️ Tu n\'as pas encore de personnage !';
  }

  const groupId = sender.replace('@s.whatsapp.net', '').includes('-') ? sender : sender;
  
  const result = await joinAdventure(groupId, sender);

  if (!result.success) {
    return `❌ ${result.message}`;
  }

  return `
✅ *${player.name} a rejoint l'aventure !*

👥 Joueurs: ${result.playerCount}

Utilise !tourma pour voir l'ordre des tours.
Attends ton tour pour jouer !
`.trim();
}

async function handleEndAdventure(sender, sock) {
  const player = await getPlayer(sender);
  if (!player) {
    return '⚠️ Tu n\'as pas encore de personnage !';
  }

  const groupId = sender.replace('@s.whatsapp.net', '').includes('-') ? sender : sender;
  
  const adventure = getAdventure(groupId);
  if (!adventure) {
    return '❌ Aucune aventure active !';
  }

  if (adventure.masterId !== sender && adventure.masterId !== groupId) {
    return '❌ Seul le maître de l\'aventure peut terminer la partie !';
  }

  const result = await endAdventure(groupId, sock);

  if (!result.success) {
    return `❌ ${result.message}`;
  }

  return result.finalReport;
}

async function handleAdventureTurn(sender) {
  const player = await getPlayer(sender);
  if (!player) {
    return '⚠️ Tu n\'as pas encore de personnage !';
  }

  const groupId = sender.replace('@s.whatsapp.net', '').includes('-') ? sender : sender;
  
  const adventure = getAdventure(groupId);
  if (!adventure) {
    return '❌ Aucune aventure active ! Utilise !startma pour commencer.';
  }

  if (!adventure.active) {
    return '⚠️ Cette aventure est terminée ! Utilise !startma pour en commencer une nouvelle.';
  }

  return formatTurnOrder(adventure);
}

async function handlePlayerAction(groupId, sender, action, sock) {
  const result = await processPlayerAction(groupId, sender, action, sock);
  
  if (!result.success) {
    return result.message;
  }

  return null;
}

module.exports = {
  handleStartAdventure,
  handleJoinAdventure,
  handleEndAdventure,
  handleAdventureTurn,
  handlePlayerAction
};
