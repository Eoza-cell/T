const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const pino = require('pino');
const fs = require('fs-extra');
const path = require('path');
const { handleIncomingMessage } = require('./messageHandler');
const { startEnergyRegeneration } = require('../game/energySystem');

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: Browsers.ubuntu('Chrome'),
    generateHighQualityLinkPreview: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n🔐 Scanne ce QR code avec WhatsApp:\n');
      qrcodeTerminal.generate(qr, { small: true });
      
      try {
        const qrPath = path.join(__dirname, '../../qr-code.png');
        await QRCode.toFile(qrPath, qr, {
          errorCorrectionLevel: 'H',
          type: 'png',
          quality: 0.95,
          margin: 1,
          width: 512
        });
        console.log(`\n📱 QR Code sauvegardé: ${qrPath}`);
        console.log('💡 Ouvre ce fichier et scanne-le avec WhatsApp\n');
      } catch (err) {
        console.error('Erreur lors de la création du QR code:', err);
      }
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      
      console.log('❌ Connexion fermée. Raison:', lastDisconnect?.error?.message);
      console.log('📊 Code de statut:', lastDisconnect?.error?.output?.statusCode);
      console.log('🔍 Erreur complète:', JSON.stringify(lastDisconnect?.error, null, 2));
      
      if (shouldReconnect) {
        console.log('🔄 Reconnexion dans 5 secondes...');
        setTimeout(() => startBot(), 5000);
      } else {
        console.log('🚪 Déconnecté. Relance le bot pour te reconnecter.');
      }
    } else if (connection === 'open') {
      console.log('✅ Bot connecté à WhatsApp !');
      console.log('🏴‍☠️ Bot One Piece RPG opérationnel !');
      console.log('\n📱 Envoie "!aide" sur WhatsApp pour commencer\n');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const message of messages) {
      if (!message.message) continue;
      if (message.key.fromMe) continue;

      await handleIncomingMessage(sock, message);
    }
  });

  startEnergyRegeneration();

  console.log('⚡ Système d\'énergie activé');
}

module.exports = {
  startBot
};
