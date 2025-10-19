const { handleCommand } = require('../commands');
const { normalizePhoneNumber } = require('../utils/helpers');
const { getAdventure } = require('../adventure/adventureSystem');
const { handlePlayerAction } = require('../commands/adventureHandlers');
const fs = require('fs-extra');

async function handleIncomingMessage(sock, message) {
  try {
    const messageType = Object.keys(message.message || {})[0];
    
    if (messageType !== 'conversation' && messageType !== 'extendedTextMessage') {
      return;
    }

    const text = message.message.conversation || message.message.extendedTextMessage?.text || '';
    
    const rawSender = message.key.remoteJid;
    const isGroup = rawSender.endsWith('@g.us');
    
    // Extraire l'ID réel du joueur (participant dans un groupe ou expéditeur direct)
    const actualSender = isGroup ? message.key.participant : rawSender;
    
    // UTILISER L'ID BRUT WHATSAPP DIRECTEMENT (format: numero@s.whatsapp.net)
    const sender = actualSender;

    console.log(`📨 Message de ${sender} (isGroup: ${isGroup}, raw: ${rawSender})`);
    console.log(`📝 Texte: ${text}`);

    // Vérifier si c'est une action d'arène (M:)
    if (text.startsWith('M:') || text.startsWith('m:')) {
      const { getPlayerArena, executeAction } = require('../game/arenaSystem');
      const arenaData = getPlayerArena(sender);
      
      if (arenaData) {
        const actionText = text.substring(2).trim();
        await executeAction(arenaData.arenaId, sender, actionText, sock);
        return; // Ne pas traiter comme une commande normale
      }
    }

    // Vérifier si le joueur est dans une aventure active et que c'est son tour
    const groupId = isGroup ? rawSender : sender;
    const adventure = getAdventure(groupId);
    
    if (adventure && adventure.active && !text.startsWith('!')) {
      const currentPlayer = adventure.getCurrentPlayer();
      
      if (currentPlayer === sender) {
        // C'est le tour de ce joueur, traiter le message comme une action RP
        const actionResult = await handlePlayerAction(groupId, sender, text, sock);
        
        if (actionResult) {
          await sock.sendMessage(rawSender, { text: actionResult });
        }
        
        return; // Ne pas traiter comme une commande normale
      }
    }

    // Traiter comme une commande normale
    if (!text.startsWith('!')) {
      return; // Ignorer les messages normaux hors aventure
    }

    const response = await handleCommand(text, sender, sock);

    if (response) {
      if (typeof response === 'object' && response.type === 'media') {
        const mediaBuffer = await fs.readFile(response.media);
        await sock.sendMessage(rawSender, {
          video: mediaBuffer,
          caption: response.caption,
          gifPlayback: true,
          mimetype: 'image/gif'
        });
        console.log(`✅ Média envoyé à ${rawSender}`);
      } else if (typeof response === 'object' && response.type === 'text') {
        await sock.sendMessage(rawSender, { text: response.text });
        console.log(`✅ Réponse envoyée à ${rawSender}`);
      } else if (typeof response === 'string') {
        await sock.sendMessage(rawSender, { text: response });
        console.log(`✅ Réponse envoyée à ${rawSender}`);
      }
    }

  } catch (error) {
    console.error('Erreur lors du traitement du message:', error);
    console.error('Stack:', error.stack);
    
    try {
      await sock.sendMessage(message.key.remoteJid, { 
        text: '❌ Une erreur est survenue. Réessaye plus tard.\n\nDétails: ' + error.message 
      });
    } catch (sendError) {
      console.error('Erreur lors de l\'envoi du message d\'erreur:', sendError);
    }
  }
}

module.exports = {
  handleIncomingMessage
};
