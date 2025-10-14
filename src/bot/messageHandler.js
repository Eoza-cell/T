const { handleCommand } = require('../commands');
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

    const sender = message.key.remoteJid;
    const isGroup = sender.endsWith('@g.us');

    console.log(`📨 Message reçu de ${sender}: ${text}`);

    const response = await handleCommand(text, sender);

    if (response) {
      if (typeof response === 'object' && response.type === 'media') {
        const mediaBuffer = await fs.readFile(response.media);
        await sock.sendMessage(sender, {
          video: mediaBuffer,
          caption: response.caption,
          gifPlayback: true,
          mimetype: 'image/gif'
        });
        console.log(`✅ Média envoyé à ${sender}`);
      } else if (typeof response === 'object' && response.type === 'text') {
        await sock.sendMessage(sender, { text: response.text });
        console.log(`✅ Réponse envoyée à ${sender}`);
      } else if (typeof response === 'string') {
        await sock.sendMessage(sender, { text: response });
        console.log(`✅ Réponse envoyée à ${sender}`);
      }
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
