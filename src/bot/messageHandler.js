const { handleCommand } = require('../commands');
const { normalizePhoneNumber } = require('../utils/helpers');
const fs = require('fs-extra');

async function handleIncomingMessage(sock, message) {
  try {
    const messageType = Object.keys(message.message || {})[0];
    
    if (messageType !== 'conversation' && messageType !== 'extendedTextMessage') {
      return;
    }

    const text = message.message.conversation || message.message.extendedTextMessage?.text || '';
    
    if (!text.startsWith('!')) {
      return;
    }

    const rawSender = message.key.remoteJid;
    const isGroup = rawSender.endsWith('@g.us');
    
    // Normaliser le numéro pour avoir un identifiant cohérent
    const sender = normalizePhoneNumber(rawSender);

    console.log(`📨 Message reçu de ${rawSender} (normalisé: ${sender}): ${text}`);

    const response = await handleCommand(text, sender);

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
