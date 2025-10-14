const { handleCommand } = require('../commands');

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

    const sender = message.key.remoteJid;
    const isGroup = sender.endsWith('@g.us');

    console.log(`📨 Message reçu de ${sender}: ${text}`);

    const response = await handleCommand(text, sender);

    if (response) {
      await sock.sendMessage(sender, { text: response });
      console.log(`✅ Réponse envoyée à ${sender}`);
    }

  } catch (error) {
    console.error('Erreur lors du traitement du message:', error);
    
    try {
      await sock.sendMessage(message.key.remoteJid, { 
        text: '❌ Une erreur est survenue. Réessaye plus tard.' 
      });
    } catch (sendError) {
      console.error('Erreur lors de l\'envoi du message d\'erreur:', sendError);
    }
  }
}

module.exports = {
  handleIncomingMessage
};
